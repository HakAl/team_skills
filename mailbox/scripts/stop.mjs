// Stop the mailbox server started from THIS directory on THIS port, via its pidfile.
// Never a pattern match across the machine. MAILBOX_PORT selects the instance.
import { readFile, unlink } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { PORT } from "../config.mjs";

const PIDFILE = fileURLToPath(new URL(`../.server.${PORT}.pid`, import.meta.url));
const SERVER = fileURLToPath(new URL("../server.mjs", import.meta.url));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function alive(pid) {
  try { process.kill(pid, 0); return true; } catch { return false; }
}
// A pidfile proves nothing after a crash: the pid may have been reused by another
// process. Only signal a process whose command line is our server.mjs.
function isOurServer(pid) {
  try {
    const cmd = execFileSync("ps", ["-o", "command=", "-p", String(pid)], { encoding: "utf-8" });
    return cmd.includes(SERVER) || /(^|\s)node(\s.*)?\sserver\.mjs(\s|$)/.test(cmd.trim());
  } catch {
    return false;
  }
}
async function removePidfile() { await unlink(PIDFILE).catch(() => {}); }

let pid = null;
try {
  pid = Number((await readFile(PIDFILE, "utf-8")).trim());
} catch {
  console.log(`mailbox: no .server.${PORT}.pid here; nothing on port ${PORT} was started from this directory.`);
  process.exit(0);
}
if (!Number.isInteger(pid) || pid <= 0 || !alive(pid)) {
  await removePidfile();
  console.log(`mailbox: pid ${pid} is not running; stale pidfile removed.`);
  process.exit(0);
}
if (!isOurServer(pid)) {
  await removePidfile();
  console.log(`mailbox: pid ${pid} is not a mailbox server (pid reused); stale pidfile removed, nothing signalled.`);
  process.exit(0);
}

try {
  process.kill(pid, "SIGTERM");
} catch (e) {
  await removePidfile();
  console.log(`mailbox: pid ${pid} ${e && e.code === "EPERM" ? "is not ours" : "already exited"}; pidfile removed.`);
  process.exit(0);
}
const started = Date.now();
let killed = false;
// The server's clean stop awaits the MCP client close, whose SDK escalation can
// take ~4s (stdin end, SIGTERM, SIGKILL). Give it 5s, then force, up to 8s total.
while (alive(pid)) {
  const waited = Date.now() - started;
  if (waited > 5000 && !killed && isOurServer(pid)) {
    try { process.kill(pid, "SIGKILL"); } catch { /* raced with exit */ }
    killed = true;
  }
  if (waited > 8000) {
    console.error(`mailbox: pid ${pid} did not exit; pidfile kept for inspection.`);
    process.exit(1);
  }
  await sleep(200);
}
await removePidfile();
console.log(`mailbox: stopped pid ${pid} on port ${PORT}${killed ? " (forced)" : ""}.`);
