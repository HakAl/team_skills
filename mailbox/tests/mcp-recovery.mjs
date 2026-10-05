// Standalone (no web server): prove mail.mjs survives a dead agent-comms child.
// Case 1 (in-flight): SIGKILL the child and call list_actors in the same tick,
// before the SDK's close event, so the rejection path in call() reconnects.
// Case 2 (idle): kill, wait for exit so onclose clears the cache, then call.
// Case 3 (non-replayable): kill under a self-addressed send_message; expect
// ConnectionLostError, a fresh child, and the message NOT in the inbox (a replaying
// implementation would land it exactly once, which this detects). Case 4 (live
// child): an unknown tool is a protocol answer,
// surfaced as-is with no reconnect. Case 5: the child log recorded all of it (only
// the part appended by this run is inspected).
import { readFile, stat } from "node:fs/promises";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { listActors, listInbox, sendMessage, childPid, shutdown, shouldReconnect, callTool as listActorsRaw, CHILD_LOG } from "../mail.mjs";

const JAC = "01J00000000000000000000001";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function alive(pid) {
  try { process.kill(pid, 0); return true; } catch (e) { return !!e && e.code === "EPERM"; }
}
let failures = 0;
function ok(cond, msg) {
  console.log(`  ${cond ? "ok" : "FAIL"} - ${msg}`);
  if (!cond) failures++;
}

const logStart = await stat(CHILD_LOG).then((s) => s.size).catch(() => 0);
try {
  console.log("0a. reconnect classifier (SDK 1.29 error shapes)");
  ok(shouldReconnect(new McpError(ErrorCode.ConnectionClosed, "closed")) === true, "ConnectionClosed -> reconnect");
  ok(shouldReconnect(new McpError(ErrorCode.MethodNotFound, "nope")) === false, "coded JSON-RPC error -> pass through");
  ok(shouldReconnect(new McpError(ErrorCode.RequestTimeout, "slow")) === false, "RequestTimeout -> pass through (no teardown)");
  ok(shouldReconnect(Object.assign(new Error("invalid result"), { issues: [] })) === false, "response validation error -> pass through (child alive)");
  ok(shouldReconnect(new Error("Not connected")) === true, "'Not connected' -> reconnect");
  ok(shouldReconnect(Object.assign(new Error("write EPIPE"), { code: "EPIPE" })) === true, "EPIPE -> reconnect");

  console.log("0b. cold start");
  ok(Array.isArray(await listActors()), "first call answers");
  const pid1 = childPid();
  ok(Number.isInteger(pid1) && pid1 > 0, `child pid is ${pid1}`);

  console.log("1. in-flight death: SIGKILL, then call immediately");
  process.kill(pid1, "SIGKILL");
  const t1 = Date.now();
  ok(Array.isArray(await listActors()), `call after SIGKILL answered via reconnect (${Date.now() - t1}ms)`);
  const pid2 = childPid();
  ok(Number.isInteger(pid2) && pid2 !== pid1, `fresh child pid ${pid2} (was ${pid1})`);

  console.log("2. idle death: SIGKILL, wait for exit and the close event, then call");
  process.kill(pid2, "SIGKILL");
  const t2 = Date.now();
  while (alive(pid2) && Date.now() - t2 < 5000) await sleep(50);
  while (childPid() !== null && Date.now() - t2 < 5000) await sleep(50);
  ok(childPid() === null, "onclose cleared the cached client");
  ok(Array.isArray(await listActors()), "call after idle death answers");
  const pid3 = childPid();
  ok(Number.isInteger(pid3) && pid3 !== pid2, `fresh child pid ${pid3} (was ${pid2})`);

  console.log("3. in-flight death on a NON-replayable call reconnects but does not replay");
  const marker = `mailbox e2e-noreplay-${Date.now()}`;
  process.kill(pid3, "SIGKILL");
  let lost = null;
  try {
    await sendMessage({ toAgents: [JAC], subject: marker, body: "must never land: sent into a dead child" });
  } catch (e) { lost = e; }
  ok(lost && lost.name === "ConnectionLostError", `send during death throws ConnectionLostError (${lost && lost.message})`);
  const pid4 = childPid();
  ok(Number.isInteger(pid4) && pid4 !== pid3, `reconnected anyway, fresh child pid ${pid4}`);
  const inbox = await listInbox({ unreadOnly: false, limit: 200 });
  ok(Array.isArray(inbox), "inbox lookup returned a list (so an absent marker means absent, not unreadable)");
  const landed = (Array.isArray(inbox) ? inbox : []).filter((m) => m.subject === marker).length;
  ok(landed === 0, `the send was not replayed (found ${landed} copies among ${Array.isArray(inbox) ? inbox.length : 0} rows; a replay would show 1)`);

  console.log("4. live child: a protocol error is surfaced, no reconnect");
  let protoErr = null;
  try { await listActorsRaw("tool_that_does_not_exist"); } catch (e) { protoErr = e; }
  ok(protoErr && protoErr.name !== "ConnectionLostError", `unknown tool rejects (${protoErr && protoErr.message.slice(0, 60)})`);
  ok(childPid() === pid4, "child pid unchanged, no reconnect for a protocol answer");

  console.log("5. child log has the evidence (this run only)");
  const log = (await readFile(CHILD_LOG, "utf-8")).slice(logStart);
  ok(log.includes(`spawned child pid ${pid1}`), "log records the first spawn");
  ok(log.includes("reconnecting after failed list_actors"), "log records the in-flight reconnect");
  ok(log.includes(`child pid ${pid1} closed`) && log.includes(`spawned child pid ${pid2}`), "log records death 1 and respawn 2");
  ok(log.includes(`child pid ${pid2} closed`), "log records the idle death");
  ok(log.includes(`spawned child pid ${pid3}`), "log records the respawn");
  ok(log.includes("reconnecting after failed send_message"), "log records the non-replayable reconnect");
  console.log(failures ? `\nFAIL - ${failures} check(s) failed` : "\nPASS - MCP child recovery verified");
} catch (e) {
  failures++;
  console.error("ERROR:", e && e.stack ? e.stack : e);
} finally {
  await shutdown();
}
process.exit(failures ? 1 : 0);
