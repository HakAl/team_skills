// Stop the mailbox server started from THIS directory on THIS port, via its pidfile.
// Never a pattern match across the machine. MAILBOX_PORT selects the instance.
import { readFile, unlink } from "node:fs/promises";
import { realpathSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { isAbsolute, resolve } from "node:path";
import { PORT } from "../config.mjs";

const PIDFILE = fileURLToPath(new URL(`../.server.${PORT}.pid`, import.meta.url));
const SERVER = realpathSync(fileURLToPath(new URL("../server.mjs", import.meta.url)));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function alive(pid) {
  try { process.kill(pid, 0); return true; } catch { return false; }
}
function ps(pid, column) {
  try {
    return execFileSync("ps", ["-o", `${column}=`, "-p", String(pid)], { encoding: "utf-8" }).trim();
  } catch {
    return "";
  }
}
function cwdOf(pid) {
  // macOS/BSD: lsof reports the cwd as the "n" field of the cwd descriptor.
  try {
    const out = execFileSync("lsof", ["-a", "-p", String(pid), "-d", "cwd", "-Fn"], { encoding: "utf-8" });
    const line = out.split("\n").find((l) => l.startsWith("n"));
    return line ? line.slice(1) : null;
  } catch {
    return null;
  }
}
// A pidfile proves nothing after a crash: the pid may have been reused. Only signal
// a process whose script argument, resolved against ITS working directory, is this
// exact server.mjs. "node server.mjs" from another checkout, "node ./server.mjs",
// or an absolute interpreter path are all handled by resolving, not pattern matching.
function isOurServer(pid) {
  const args = ps(pid, "command").split(/\s+/).filter(Boolean);
  const script = args.find((a) => /server\.mjs$/.test(a));
  if (!script) return false;
  let path = script;
  if (!isAbsolute(path)) {
    const cwd = cwdOf(pid);
    if (!cwd) return false;
    path = resolve(cwd, path);
  }
  try { return realpathSync(path) === SERVER; } catch { return false; }
}
// Only remove the pidfile if it still names the pid we are dealing with, so a
// successor that published its own pidfile meanwhile is never un-tracked.
async function removePidfileIf(pid) {
  try {
    if ((await readFile(PIDFILE, "utf-8")).trim() === String(pid)) await unlink(PIDFILE);
  } catch { /* absent */ }
}

let pid = null;
try {
  pid = Number((await readFile(PIDFILE, "utf-8")).trim());
} catch {
  console.log(`mailbox: no .server.${PORT}.pid here; nothing on port ${PORT} was started from this directory.`);
  process.exit(0);
}
if (!Number.isInteger(pid) || pid <= 0 || !alive(pid)) {
  await removePidfileIf(pid);
  console.log(`mailbox: pid ${pid} is not running; stale pidfile removed.`);
  process.exit(0);
}
if (!isOurServer(pid)) {
  await removePidfileIf(pid);
  console.log(`mailbox: pid ${pid} is not this directory's server.mjs (pid reused); stale pidfile removed, nothing signalled.`);
  process.exit(0);
}

try {
  process.kill(pid, "SIGTERM");
} catch (e) {
  await removePidfileIf(pid);
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
await removePidfileIf(pid);
console.log(`mailbox: stopped pid ${pid} on port ${PORT}${killed ? " (forced)" : ""}.`);
