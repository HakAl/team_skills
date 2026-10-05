// Stop the mailbox server started from THIS directory, via its pidfile. Never a
// pattern match across the machine.
import { readFile, unlink } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const PIDFILE = fileURLToPath(new URL("../.server.pid", import.meta.url));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// EPERM means a live process we do not own: never ours (we started it), so treat
// it as "not our server" rather than something to signal.
function alive(pid) {
  try { process.kill(pid, 0); return true; } catch { return false; }
}

let pid = null;
try {
  pid = Number((await readFile(PIDFILE, "utf-8")).trim());
} catch {
  console.log("mailbox: no .server.pid here; nothing started from this directory is running.");
  process.exit(0);
}
if (!Number.isInteger(pid) || pid <= 0 || !alive(pid)) {
  await unlink(PIDFILE).catch(() => {});
  console.log(`mailbox: pid ${pid} is not running; stale pidfile removed.`);
  process.exit(0);
}

try {
  process.kill(pid, "SIGTERM");
} catch (e) {
  // Exited between the liveness check and the signal, or not ours after all.
  await unlink(PIDFILE).catch(() => {});
  console.log(`mailbox: pid ${pid} ${e && e.code === "EPERM" ? "is not ours" : "already exited"}; pidfile removed.`);
  process.exit(0);
}
const started = Date.now();
let killed = false;
// The server's clean stop awaits the MCP client close, whose SDK escalation can
// take ~4s (stdin end, SIGTERM, SIGKILL). Give it 5s, then force, up to 8s total.
while (alive(pid)) {
  const waited = Date.now() - started;
  if (waited > 5000 && !killed) {
    try { process.kill(pid, "SIGKILL"); } catch { /* raced with exit */ }
    killed = true;
  }
  if (waited > 8000) {
    console.error(`mailbox: pid ${pid} did not exit; pidfile kept for inspection.`);
    process.exit(1);
  }
  await sleep(200);
}
await unlink(PIDFILE).catch(() => {});
console.log(`mailbox: stopped pid ${pid}${killed ? " (forced)" : ""}.`);
