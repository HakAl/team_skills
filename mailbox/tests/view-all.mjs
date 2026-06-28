// Priority-2 verification: an explicit "View all from <sender>" button below an
// open message reveals every message that sender has sent jac. Read-only against
// the real inbox: it targets a sender whose messages are ALREADY read, so opening
// one changes no unread state, and revealing siblings renders from cached snippets
// (no extra reads).
//
// Run:  node tests/view-all.mjs   (assumes the server is already running)
import { webkit } from "playwright";

const BASE = process.env.BASE || "http://127.0.0.1:4100";

let failures = 0;
function ok(cond, msg) {
  console.log(`  ${cond ? "ok" : "FAIL"} - ${msg}`);
  if (!cond) failures++;
}

// Pick a target sender: >1 message, all already read (avoid mutating unread state).
const { messages } = await (await fetch(`${BASE}/api/inbox`)).json();
const groups = new Map();
for (const m of messages) {
  if (!groups.has(m.from)) groups.set(m.from, []);
  groups.get(m.from).push(m);
}
let target = null;
for (const [from, msgs] of groups) {
  if (msgs.length > 1 && msgs.every((m) => m.status !== "sent")) { target = { from, count: msgs.length }; break; }
}
if (!target) {
  console.error("SKIP - no sender with >1 already-read message to test against");
  process.exit(0);
}
console.log(`target sender: ${target.from} (${target.count} messages)`);

const browser = await webkit.launch();
const page = await browser.newPage();
try {
  await page.goto(BASE);
  await page.waitForSelector("#messages .group");

  console.log("1. open a message from the target sender");
  const head = page.locator(`.group-head:has(.from:text-is("${target.from}"))`);
  await head.click();                                   // expand the conversation
  const firstRow = page.locator(`.group.open:has(.from:text-is("${target.from}")) .group-msgs .msg`).first();
  await firstRow.click();
  await page.waitForSelector("#reader:not([hidden])");
  // openMessage un-hides the reader before its fetch resolves; wait for the body
  // and the View all button (populated by setupSenderAll after the fetch).
  await page.waitForFunction(() => document.querySelector("#rBody").textContent.length > 0);
  await page.waitForSelector("#senderAll:not([hidden]) #viewAllBtn");
  ok(true, "reader opened");

  console.log("2. the View all button is present below the message");
  const btnVisible = await page.locator("#senderAll:not([hidden]) #viewAllBtn").count();
  ok(btnVisible === 1, "View all button is shown (sender has >1 message)");
  const label = await page.locator("#viewAllBtn").textContent();
  ok(/view all from/i.test(label) && label.includes(String(target.count)),
    `button labelled with sender + count: "${label}"`);

  console.log("3. clicking reveals all of the sender's messages");
  await page.click("#viewAllBtn");
  await page.waitForSelector("#senderAllList:not([hidden])");
  const items = await page.locator("#senderAllList .sa-item").count();
  ok(items === target.count, `revealed ${items} item(s), expected ${target.count}`);
  const cap = await page.locator(".sender-all-cap").textContent();
  ok(/your replies are not shown/i.test(cap || ""),
    "caption surfaces the one-sided constraint (no sent-items)");
  const openMarked = await page.locator("#senderAllList .sa-item.current").count();
  ok(openMarked === 1, "the currently-open message is marked in the list");

  console.log("4. reply box still present below the reveal");
  const replyThere = await page.locator("#reader #replyForm #replySend").count();
  ok(replyThere === 1, "reply box stayed in place");

  console.log("5. button toggles closed");
  await page.click("#viewAllBtn");
  const hiddenAgain = await page.locator("#senderAllList[hidden]").count();
  ok(hiddenAgain === 1, "View all collapses again");

  console.log(failures ? `\nFAIL - ${failures} check(s) failed` : "\nPASS - View all verified in webkit");
} catch (e) {
  console.error("ERROR:", e.message);
  failures++;
} finally {
  await browser.close();
}
process.exit(failures ? 1 : 0);
