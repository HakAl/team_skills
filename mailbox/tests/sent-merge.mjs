// Webkit verification for the pre-built two-sided View all sender transcript.
// /api/sent is intercepted so this can run before the real MCP sent-items tool
// is available. Read-only against the live inbox: it targets an already-read
// sender message when one exists.
//
// Run:  node tests/sent-merge.mjs   (assumes the server is already running)
import { webkit } from "playwright";

const BASE = process.env.BASE || "http://127.0.0.1:4100";

let failures = 0;
function ok(cond, msg) {
  console.log(`  ${cond ? "ok" : "FAIL"} - ${msg}`);
  if (!cond) failures++;
}

const { messages } = await (await fetch(`${BASE}/api/inbox`)).json();
const groups = new Map();
for (const m of Array.isArray(messages) ? messages : []) {
  if (!groups.has(m.from)) groups.set(m.from, []);
  groups.get(m.from).push(m);
}
let target = null;
let targetMessages = null;
for (const [from, msgs] of groups) {
  if (msgs.length > 1 && msgs.every((m) => m.status !== "sent")) {
    target = from;
    targetMessages = msgs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    break;
  }
}

if (!target) {
  console.error("SKIP - no sender with >1 already-read messages to test against");
  process.exit(0);
}

const targetMessage = targetMessages[0];
const targetDate = new Date(targetMessage.created_at);
const targetMs = Number.isNaN(targetDate.getTime()) ? Date.now() : targetDate.getTime();
const FIXTURES = [
  {
    id: "sent-merge-newer",
    from: "jac",
    to: [target],
    subject: "sent merge newer fixture",
    body_snippet: "newer sent fixture body",
    created_at: new Date(targetMs + 60_000).toISOString(),
  },
  {
    id: "sent-merge-older",
    from: "jac",
    to: target,
    subject: "sent merge older fixture",
    body_snippet: "older sent fixture body",
    created_at: new Date(targetMs - 60_000).toISOString(),
  },
];

console.log(`target sender: ${target}`);

const browser = await webkit.launch();
const page = await browser.newPage();
try {
  await page.route("**/api/sent", (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({ sentAvailable: true, messages: FIXTURES }),
  }));

  await page.goto(BASE);
  await page.waitForSelector("#messages .group");

  console.log("1. open the target sender message");
  const head = page.locator(`.group:has(.msg[data-id="${targetMessage.id}"]) .group-head`).first();
  await head.click();
  const row = page
    .locator(`.group.open .group-msgs .msg[data-id="${targetMessage.id}"]`)
    .first();
  await row.click();
  await page.waitForSelector("#reader:not([hidden])");
  await page.waitForFunction(() => document.querySelector("#rBody").textContent.length > 0);
  await page.waitForSelector("#senderAll:not([hidden]) #viewAllBtn");
  await page.click("#viewAllBtn");
  await page.waitForSelector("#senderAllList:not([hidden])");

  console.log("2. sent fixtures merge into the sender view");
  const cap = await page.locator(".sender-all-cap").textContent();
  ok(/between you and/i.test(cap || ""), `caption says between you and: "${cap}"`);
  const fromYou = page.locator("#senderAllList .sa-item.from-you");
  ok(await fromYou.count() === 2, "fixture items render with class from-you");
  const fromYouMeta = await fromYou.locator(".t-meta").evaluateAll((els) =>
    els.map((el) => el.textContent || "")
  );
  ok(fromYouMeta.every((text) => text.includes("jac (you)")), "fixture metadata is prefixed with jac (you)");

  console.log("3. merged list stays newest-first");
  // The rendered meta date (fmtWhen) has no year and the open row ends with
  // "(open)", so Date.parse on meta text is unreliable. Assert order via the
  // relative positions of the three known items instead: the newer fixture
  // (target time +60s) must lead, then the open target, then the older fixture
  // (target time -60s) somewhere after.
  const metas = await page.locator("#senderAllList .sa-item .t-meta").evaluateAll((els) =>
    els.map((el) => el.textContent || "")
  );
  const iNewer = metas.findIndex((t) => t.includes(FIXTURES[0].subject));
  const iOpen = metas.findIndex((t) => t.endsWith("(open)"));
  const iOlder = metas.findIndex((t) => t.includes(FIXTURES[1].subject));
  ok(iNewer === 0, `newer sent fixture leads the merged list (index ${iNewer})`);
  ok(iOpen > iNewer, `open target follows the newer fixture (${iNewer} < ${iOpen})`);
  ok(iOlder > iOpen, `older fixture follows the open target (${iOpen} < ${iOlder})`);

  console.log("4. sent fixtures are inert and absent from the inbox pane");
  const clickableFixtures = await page.locator("#senderAllList .sa-item.from-you.clickable").count();
  ok(clickableFixtures === 0, "fixture items lack the clickable class");
  const inboxText = await page.locator("#messages").textContent();
  ok(!inboxText.includes(FIXTURES[0].subject) && !inboxText.includes(FIXTURES[1].subject),
    "inbox pane does not contain fixture subjects");

  console.log("5. degraded sent-items response restores the one-sided caption");
  await page.unroute("**/api/sent");
  await page.route("**/api/sent", (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({ sentAvailable: false, messages: [] }),
  }));
  await page.reload();
  await page.waitForSelector("#messages .group");
  await page.locator(`.group:has(.msg[data-id="${targetMessage.id}"]) .group-head`).first().click();
  await page
    .locator(`.group.open .group-msgs .msg[data-id="${targetMessage.id}"]`)
    .first()
    .click();
  await page.waitForSelector("#reader:not([hidden])");
  await page.waitForFunction(() => document.querySelector("#rBody").textContent.length > 0);
  await page.waitForSelector("#senderAll:not([hidden]) #viewAllBtn");
  await page.click("#viewAllBtn");
  await page.waitForSelector("#senderAllList:not([hidden])");
  const degradedCap = await page.locator(".sender-all-cap").textContent();
  ok(/your replies are not shown/i.test(degradedCap || ""),
    `old one-sided caption is back: "${degradedCap}"`);

  console.log(failures ? `\nFAIL - ${failures} check(s) failed` : "\nPASS - sent merge verified in webkit");
} catch (e) {
  console.error("ERROR:", e.message);
  failures++;
} finally {
  await browser.close();
}
process.exit(failures ? 1 : 0);
