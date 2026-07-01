// Buildless Node backend for the jac mailbox. Serves the static UI and a small
// JSON API over the mail module (one warm MCP client, identity = jac).
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, normalize, extname } from "node:path";
import {
  listInbox,
  listSent,
  readMessage,
  sendMessage,
  listActors,
  ackMessage,
  postStatus,
  shutdown,
} from "./mail.mjs";
import { PORT, HOST, ACTOR_DISPLAY, ACTOR_ID } from "./config.mjs";

const ROOT = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(ROOT, "public");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
};

function sendJson(res, status, value) {
  const body = JSON.stringify(value);
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(body);
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf-8"));
}

// Walk parent_message_id as far as the operator seat can read. Ancestors that jac
// cannot read (e.g. messages jac sent, where jac is not a recipient) are skipped
// gracefully - the MCP function set has no recipient-independent thread tool.
async function loadThread(message) {
  const ancestors = [];
  let parentId = message && message.parent_message_id;
  const seen = new Set([message && message.id]);
  while (parentId && !seen.has(parentId)) {
    seen.add(parentId);
    let parent;
    try {
      parent = await readMessage(parentId);
    } catch {
      break;
    }
    if (!parent) break;
    ancestors.push(parent);
    parentId = parent.parent_message_id;
  }
  return ancestors;
}

async function serveStatic(res, urlPath) {
  const rel = urlPath === "/" ? "/index.html" : urlPath;
  const safe = normalize(rel).replace(/^(\.\.[/\\])+/, "");
  const file = join(PUBLIC, safe);
  if (!file.startsWith(PUBLIC)) {
    res.writeHead(403);
    return res.end("forbidden");
  }
  try {
    const data = await readFile(file);
    res.writeHead(200, { "content-type": MIME[extname(file)] || "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("not found");
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  try {
    if (path === "/api/me") {
      return sendJson(res, 200, { display: ACTOR_DISPLAY, id: ACTOR_ID });
    }
    if (path === "/api/inbox" && req.method === "GET") {
      const rows = await listInbox({ unreadOnly: false, limit: 50 });
      return sendJson(res, 200, { messages: Array.isArray(rows) ? rows : [] });
    }
    if (path === "/api/sent" && req.method === "GET") {
      try {
        const rows = await listSent({ limit: 100 });
        return sendJson(res, 200, {
          messages: Array.isArray(rows) ? rows : [],
          sentAvailable: true,
        });
      } catch {
        return sendJson(res, 200, { messages: [], sentAvailable: false });
      }
    }
    if (path === "/api/message" && req.method === "GET") {
      const id = url.searchParams.get("id");
      if (!id) return sendJson(res, 400, { error: "missing id" });
      const message = await readMessage(id);
      const thread = await loadThread(message);
      return sendJson(res, 200, { message, thread });
    }
    if (path === "/api/actors" && req.method === "GET") {
      // The operator_mailbox seat may not expose a roster tool. Degrade gracefully:
      // an empty roster means the UI falls back to free text + server-side validation.
      try {
        const actors = await listActors();
        return sendJson(res, 200, {
          actors: Array.isArray(actors) ? actors : [],
          rosterAvailable: true,
        });
      } catch {
        return sendJson(res, 200, { actors: [], rosterAvailable: false });
      }
    }
    if (path === "/api/send" && req.method === "POST") {
      const b = await readBody(req);
      const toAgents = Array.isArray(b.toAgents)
        ? b.toAgents
        : String(b.to || "")
            .split(/[,\s]+/)
            .map((s) => s.trim())
            .filter(Boolean);
      if (!toAgents.length) return sendJson(res, 400, { error: "no recipients" });
      if (!b.body || !String(b.body).trim()) return sendJson(res, 400, { error: "empty body" });
      const result = await sendMessage({
        toAgents,
        subject: b.subject || "(no subject)",
        body: b.body,
        parentMessageId: b.parentMessageId || null,
        requiresAck: !!b.requiresAck,
      });
      return sendJson(res, 200, { ok: true, result });
    }
    if (path === "/api/ack" && req.method === "POST") {
      const b = await readBody(req);
      if (!b.id) return sendJson(res, 400, { error: "missing id" });
      await ackMessage(b.id, b.response || "");
      return sendJson(res, 200, { ok: true });
    }
    if (path === "/api/status" && req.method === "POST") {
      const b = await readBody(req);
      const summary = String(b.summary || "").trim();
      if (!summary) return sendJson(res, 400, { error: "empty summary" });
      await postStatus({ summary, nextStep: b.nextStep || "" });
      return sendJson(res, 200, { ok: true });
    }
    if (req.method === "GET") return serveStatic(res, path);
    res.writeHead(404);
    res.end("not found");
  } catch (err) {
    sendJson(res, 500, { error: String(err && err.message ? err.message : err) });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`mailbox (as ${ACTOR_DISPLAY}) at http://${HOST}:${PORT}`);
  console.log("Press Ctrl+C to stop.");
});

// Clean shutdown: stop accepting requests, close the MCP client (kills the child
// server), then exit. No stack traces on Ctrl+C.
let stopping = false;
function stop(signal) {
  if (stopping) return;
  stopping = true;
  console.log(`\nStopping mailbox (${signal})...`);
  server.close();
  shutdown().finally(() => {
    console.log("Stopped.");
    process.exit(0);
  });
}
process.on("SIGINT", () => stop("SIGINT"));
process.on("SIGTERM", () => stop("SIGTERM"));
