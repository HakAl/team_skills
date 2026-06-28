// Thin mail interface over the agent-comms MCP function set.
// One warm MCP client, one identity (see config.mjs). No pool, no switcher.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { MCP_COMMAND, MCP_ARGS, MCP_ENV } from "./config.mjs";

let clientPromise = null;

async function getClient() {
  if (clientPromise) return clientPromise;
  clientPromise = (async () => {
    const transport = new StdioClientTransport({
      command: MCP_COMMAND,
      args: MCP_ARGS,
      env: MCP_ENV,
      // Silence the child server's startup logs and its Ctrl+C traceback so they
      // never pollute the terminal. The server still works; we just drop its stderr.
      stderr: "ignore",
    });
    const client = new Client(
      { name: "mailbox", version: "0.1.0" },
      { capabilities: {} }
    );
    await client.connect(transport);
    return client;
  })().catch((err) => {
    clientPromise = null; // allow retry on next call
    throw err;
  });
  return clientPromise;
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
  const client = await getClient();
  const result = await client.callTool({ name, arguments: args });
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

export function readMessage(messageId) {
  return call("read_message", { message_id: messageId });
}

export function sendMessage({ toAgents, subject, body, refs, parentMessageId } = {}) {
  const args = { to_agents: toAgents, subject, body };
  if (refs && refs.length) args.refs = refs;
  if (parentMessageId) args.parent_message_id = parentMessageId;
  return call("send_message", args);
}

export function listActors() {
  return call("list_actors", {});
}

// Triage (full UI for this is NEXT). Exposed now for the test-cleanup script.
export function closeMessage(messageId, response = "") {
  return call("close_message", { message_id: messageId, response });
}

// Close the MCP client and terminate the child server process. Idempotent.
export async function shutdown() {
  if (!clientPromise) return;
  const pending = clientPromise;
  clientPromise = null;
  try {
    const client = await pending;
    await client.close();
  } catch { /* already gone */ }
}
