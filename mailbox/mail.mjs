// Thin mail interface over the agent-comms MCP function set.
// One warm MCP client, one identity (see config.mjs). No pool, no switcher.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { openSync, writeSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { MCP_COMMAND, MCP_ARGS, MCP_ENV } from "./config.mjs";

// The child's stderr goes to this file at the OS level (an append fd handed to
// spawn, no stream piping in Node), so a death leaves its last words on disk.
export const CHILD_LOG = fileURLToPath(new URL("./.mcp-child.log", import.meta.url));
let logFd = null;

function openLog() {
  if (logFd === null) {
    try { logFd = openSync(CHILD_LOG, "a"); } catch { logFd = null; }
  }
  return logFd;
}

function logLine(text) {
  if (openLog() === null) return;
  try { writeSync(logFd, `[${new Date().toISOString()}] mailbox: ${text}\n`); } catch { /* never break mail */ }
}

let clientPromise = null;
let current = null; // { client, pid } for the live connection

function getClient() {
  if (clientPromise) return clientPromise;
  const promise = (async () => {
    const fd = openLog();
    const transport = new StdioClientTransport({
      command: MCP_COMMAND,
      args: MCP_ARGS,
      env: MCP_ENV,
      stderr: fd === null ? "ignore" : fd,
    });
    const client = new Client({ name: "mailbox", version: "0.1.0" }, { capabilities: {} });
    await client.connect(transport);
    const pid = transport.pid; // null again by the time onclose runs; capture now
    current = { client, pid };
    logLine(`spawned child pid ${pid}`);
    // Only onclose means the child is gone. onerror also fires for protocol-level
    // noise on a healthy child, so it must never reset the cache.
    client.onclose = () => {
      logLine(`child pid ${pid} closed`);
      if (clientPromise === promise) clientPromise = null;
      if (current && current.client === client) current = null;
    };
    client.onerror = (err) => logLine(`client error (pid ${pid}): ${err && err.message ? err.message : err}`);
    return client;
  })();
  clientPromise = promise;
  promise.catch(() => { if (clientPromise === promise) clientPromise = null; });
  return promise;
}

// Pid of the live child, or null. Exposed for the recovery test.
export function childPid() {
  return current ? current.pid : null;
}

// Raw tool call by name. Exposed for the recovery test (unknown-tool case).
export function callTool(name, args = {}) {
  return call(name, args);
}

// A rejection carrying a JSON-RPC error code (other than ConnectionClosed) is an
// answer from a live child: unknown tool, bad arguments, request timeout. Anything
// else (EPIPE on a dead stdin, ConnectionClosed from the SDK's close handler) is a
// transport failure worth one reconnect.
function isProtocolAnswer(err) {
  return err instanceof McpError && err.code !== ErrorCode.ConnectionClosed;
}

// Only calls that are harmless to repeat are replayed after a reconnect. A send,
// ack, close or status that was in flight when the child died MAY have landed; the
// caller must look before repeating it, so those surface a clear error instead.
const REPLAYABLE = new Set(["list_inbox", "list_actors", "list_sent", "list_status", "read_message"]);

export class ConnectionLostError extends Error {
  constructor(name) {
    super(`connection to agent-comms was lost while ${name} was in flight; it may or may not have landed. Reload and check before repeating it.`);
    this.name = "ConnectionLostError";
    this.tool = name;
  }
}

// FastMCP returns tool output either as structuredContent or as JSON text.
// Normalize both into a plain JS value.
function parseToolResult(result) {
  if (result == null) return null;
  if (result.isError) {
    const text = (result.content || [])
      .map((c) => (c && c.type === "text" ? c.text : ""))
      .join("\n");
    throw new Error(text || "MCP tool returned an error");
  }
  if (result.structuredContent !== undefined) {
    const sc = result.structuredContent;
    // FastMCP wraps a bare list/scalar return under a "result" key.
    if (sc && typeof sc === "object" && "result" in sc && Object.keys(sc).length === 1) {
      return sc.result;
    }
    return sc;
  }
  const textPart = (result.content || []).find((c) => c && c.type === "text");
  if (textPart) {
    try {
      return JSON.parse(textPart.text);
    } catch {
      return textPart.text;
    }
  }
  return null;
}

async function call(name, args = {}) {
  const first = getClient();
  const client = await first;
  let result;
  try {
    result = await client.callTool({ name, arguments: args });
  } catch (err) {
    if (isProtocolAnswer(err)) throw err;
    // The in-flight rejection usually lands BEFORE the SDK's close event, so clear
    // the cache ourselves (only if it still points at the failed client), tear that
    // client down (bounded by the SDK's own escalation, so a misjudged healthy child
    // is stopped rather than leaked), then rebuild and retry exactly once.
    if (clientPromise === first) clientPromise = null;
    if (current && current.client === client) current = null;
    try { await client.close(); } catch { /* already gone */ }
    logLine(`reconnecting after failed ${name}: ${err && err.message ? err.message : err}`);
    const fresh = await getClient();
    if (!REPLAYABLE.has(name)) throw new ConnectionLostError(name);
    result = await fresh.callTool({ name, arguments: args });
  }
  return parseToolResult(result);
}

// --- mail interface (method names mirror the MCP tools) ---

export function listInbox({ unreadOnly = false, includeClosed = false, limit = 50 } = {}) {
  return call("list_inbox", {
    unread_only: unreadOnly,
    include_closed: includeClosed,
    limit,
  });
}

export function listSent({ limit = 100 } = {}) {
  return call("list_sent", { limit });
}

export function listStatus() {
  return call("list_status", {});
}

export function readMessage(messageId) {
  return call("read_message", { message_id: messageId });
}

export const PRIORITIES = ["normal", "high", "blocker", "low"];

export function sendMessage({ toAgents, subject, body, refs, parentMessageId, requiresAck, priority } = {}) {
  const args = { to_agents: toAgents, subject, body };
  if (refs && refs.length) args.refs = refs;
  if (parentMessageId) args.parent_message_id = parentMessageId;
  if (requiresAck !== undefined) args.requires_ack = !!requiresAck;
  if (priority && PRIORITIES.includes(priority) && priority !== "normal") args.priority = priority;
  return call("send_message", args);
}

export function listActors() {
  return call("list_actors", {});
}

// Triage: close removes a message from the inbox (list_inbox hides closed rows).
export function closeMessage(messageId, response = "") {
  return call("close_message", { message_id: messageId, response });
}

export function ackMessage(messageId, response = "") {
  return call("ack_message", { message_id: messageId, response });
}

export function postStatus({ summary, nextStep } = {}) {
  return call("post_status", { summary, next_step: nextStep || "" });
}

// Close the MCP client and terminate the child server process. Idempotent.
export async function shutdown() {
  if (!clientPromise) return;
  const pending = clientPromise;
  clientPromise = null;
  current = null;
  try {
    const client = await pending;
    await client.close();
  } catch { /* already gone */ }
}
