// Stop the mailbox server started from THIS directory on THIS port, via its pidfile.
// Never a pattern match across the machine. MAILBOX_PORT selects the instance.
import { readFileSync, unlinkSync, realpathSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { PORT, HOST } from "../config.mjs";

const PIDFILE = fileURLToPath(new URL(`../.server.${PORT}.pid`, import.meta.url));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let SERVER = null;
try { SERVER = realpathSync(fileURLToPath(new URL("../server.mjs", import.meta.url))); } catch { SERVER = null; }

function alive(pid) {
  try { process.kill(pid, 0); return true; } catch { return false; }
}
// Identity, without parsing argv: the process must be the one LISTENING on our
// host:port (lsof), and its command line must mention server.mjs. A pid reused by
// an unrelated process cannot be listening on our port; another directory's
// mailbox would have to collide on both pid and port. Fails CLOSED when lsof is
// unavailable: nothing is signalled and the pidfile is kept.
function listeningPid() {
  try {
    const out = execFileSync("lsof", ["-nP", `-iTCP@${HOST}:${PORT}`, "-sTCP:LISTEN", "-Fp"], { encoding: "utf-8" });
    const line = out.split("\n").find((l) => l.startsWith("p"));
    return line ? Number(line.slice(1)) : 0;
  } catch (e) {
    // lsof exits 1 when nothing matches: that is a definite "nobody listens".
    if (e && e.status === 1 && !e.code) return 0;
    return null; // lsof not installed (ENOENT) or failed for another reason: unknown
  }
}
function commandOf(pid) {
  try { return execFileSync("ps", ["-o", "command=", "-p", String(pid)], { encoding: "utf-8" }).trim(); } catch { return ""; }
}
function isOurServer(pid) {
  const lp = listeningPid();
  if (lp === null) return null; // cannot verify
  return lp === pid && /server\.mjs/.test(commandOf(pid));
}
// Remove the pidfile only if its bytes are still exactly what we read, in one
// synchronous read-compare-unlink. A successor publishing its own file inside that
// microsecond window is the residual, documented, race.
function removePidfileIfStill(raw) {
  try { if (readFileSync(PIDFILE, "utf-8") === raw) unlinkSync(PIDFILE); return true; } catch { return false; }
}

let raw = null;
try { raw = readFileSync(PIDFILE, "utf-8"); } catch {
  console.log(`mailbox: no .server.${PORT}.pid here; nothing on port ${PORT} was started from this directory.`);
  process.exit(0);
}
const pid = /^\d+$/.test(raw.trim()) ? Number(raw.trim()) : NaN;
if (!Number.isInteger(pid) || pid <= 0 || !alive(pid)) {
  const removed = removePidfileIfStill(raw);
  console.log(`mailbox: pidfile names ${JSON.stringify(raw.trim())}, not a running pid; ${removed ? "stale pidfile removed" : "pidfile changed meanwhile, left alone"}.`);
  process.exit(0);
}
const ours = isOurServer(pid);
if (ours === null) {
  console.error(`mailbox: cannot verify that pid ${pid} is this server (lsof unavailable); nothing signalled, pidfile kept.`);
  process.exit(1);
}
if (!ours) {
  const removed = removePidfileIfStill(raw);
  console.log(`mailbox: pid ${pid} is not listening on ${HOST}:${PORT} as a mailbox server (pid reused); nothing signalled, ${removed ? "stale pidfile removed" : "pidfile changed meanwhile, left alone"}.`);
  process.exit(0);
}

try {
  process.kill(pid, "SIGTERM");
} catch (e) {
  console.log(`mailbox: pid ${pid} ${e && e.code === "EPERM" ? "is not ours" : "already exited"}; nothing more to do.`);
  process.exit(0);
}
const started = Date.now();
let killed = false;
// The server's clean stop awaits the MCP client close, whose SDK escalation can
// take ~4s (stdin end, SIGTERM, SIGKILL). Give it 5s, then force, up to 8s total.
while (alive(pid)) {
  const waited = Date.now() - started;
  if (waited > 5000 && !killed && isOurServer(pid) === true) {
    try { process.kill(pid, "SIGKILL"); } catch { /* raced with exit */ }
    killed = true;
  }
  if (waited > 8000) {
    console.error(`mailbox: pid ${pid} did not exit; pidfile kept for inspection.`);
    process.exit(1);
  }
  await sleep(200);
}
// A clean stop removed its own pidfile before releasing the port. After a forced
// kill the file may remain; remove it only if it is still the one we read.
removePidfileIfStill(raw);
console.log(`mailbox: stopped pid ${pid} on port ${PORT}${killed ? " (forced)" : ""}.`);
