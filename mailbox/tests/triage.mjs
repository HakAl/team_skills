// Webkit verification for inbox triage: priority badges, unread total, filters,
// reply context (To line, request-ack), and closing a message from the reader.
// Self-contained and safe: the setup message is sent to jac's own id.
import { webkit } from "playwright";
import { sendMessage } from "../mail.mjs";

const BASE = process.env.BASE || "http://127.0.0.1:4100";
const JAC = "01J00000000000000000000001";
const subject = `mailbox e2e-triage-${Date.now()}`;

function assert(cond, msg) {
  if (!cond) throw new Error("ASSERT FAILED: " + msg);
  console.log("  ok - " + msg);
}

const sent = await sendMessage({
  toAgents: [JAC],
  subject,
  body: `triage body line 1\ntriage body line 2 ${subject}`,
  requiresAck: true,
  priority: "high",
});
const id = sent && sent.id;
assert(!!id, `setup message minted (${id})`);

const browser = await webkit.launch();
const page = await browser.newPage();
page.on("dialog", (d) => d.accept());
let failed = false;
try {
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForSelector(`.msg[data-id="${id}"]`, { state: "attached", timeout: 15000 });
  const group = page.locator(`.group:has(.msg[data-id="${id}"])`).first();

  console.log("1. unread total + priority badge");
  const total = await page.locator("#unreadTotal:not([hidden])").textContent();
  assert(/^\d+$/.test((total || "").trim()) && Number(total) >= 1, `unread total shows ${total}`);
  const title = await page.title();
  assert(/^\(\d+\) Mailbox/.test(title), `document title carries the count ("${title}")`);
  // The conversation head shows the HIGHEST priority in the group (the same sender may
  // have blocker mail); the test message's own row must show exactly "high".
  const headBadge = await group.locator(".group-head .priority-badge").textContent();
  assert(["high", "blocker"].includes(headBadge), `conversation head shows a priority badge (${headBadge})`);
  const rowBadge = await page.locator(`.msg[data-id="${id}"] .priority-badge`).textContent();
  assert(rowBadge === "high", "message row shows the high priority badge");

  console.log("2. filters");
  await page.click('#filters .filter[data-filter="ack"]');
  assert((await page.locator(`.msg[data-id="${id}"]`).count()) === 1, "needs-ack filter keeps the test message");
  const allNeedAck = await page.locator("#messages .group").evaluateAll((gs) =>
    gs.every((g) => g.querySelector(".group-head .ack-flag") !== null));
  assert(allNeedAck, "every visible conversation under the needs-ack filter has an ack flag");
  await page.click('#filters .filter[data-filter="unread"]');
  assert((await page.locator(`.msg[data-id="${id}"]`).count()) === 1, "unread filter keeps the test message");
  await page.click('#filters .filter[data-filter="all"]');
  assert((await page.locator('#filters .filter.active[data-filter="all"]').count()) === 1, "all filter re-selected");

  console.log("3. open: reader priority, To line, reply controls");
  await group.locator(".group-head").click();
  await page.locator(`.group.open .group-msgs .msg[data-id="${id}"]`).click();
  await page.waitForSelector("#reader:not([hidden])", { timeout: 15000 });
  await page.waitForFunction(() => document.querySelector("#rBody").textContent.length > 0);
  const rp = await page.locator("#rPriority:not([hidden])").textContent();
  assert(rp === "high", "reader shows the priority badge");
  const replyTo = await page.locator("#replyTo").textContent();
  assert(/^To: /.test(replyTo) && /jac/.test(replyTo), `reply To line names the sender ("${replyTo}")`);
  assert((await page.locator("#replyAllWrap[hidden]").count()) === 1, "reply-all hidden for a single-recipient message");
  assert((await page.locator("#rAck").count()) === 1, "reply form has a Request ack checkbox");
  assert((await page.locator("#cAck").count()) === 1 && (await page.locator("#cPriority").count()) === 1,
    "compose form has Request ack and Priority controls");

  console.log("4. quote inserts the parent body");
  await page.click("#quoteBtn");
  const quoted = await page.inputValue("#replyBody");
  assert(quoted.startsWith("> triage body line 1\n> triage body line 2"), "quoted body is prefixed line by line");

  console.log("5. bulk tool visible for read messages in the conversation");
  await page.waitForSelector(`.group:has(.msg[data-id="${id}"]) .group-tools .close-read`, { timeout: 15000 });
  assert(true, "conversation offers 'Close N read' once the message is read");

  console.log("6. close from the reader");
  await page.click("#closeMsgBtn");
  await page.waitForFunction(() => {
    const t = document.querySelector("#toast");
    return t && !t.hidden && /closed/i.test(t.textContent);
  }, { timeout: 15000 });
  await page.waitForFunction((mid) => !document.querySelector(`.msg[data-id="${mid}"]`), id, { timeout: 15000 });
  assert(true, "closed message leaves the inbox");
  assert((await page.locator("#reader").isHidden()) && !(await page.locator("#placeholder").isHidden()),
    "reader clears to the placeholder after close");

  console.log("7. compose with Request ack + blocker priority lands flagged");
  const composed = `${subject}-compose`;
  await page.click("#composeBtn");
  await page.waitForSelector("#composeForm:not([hidden])");
  await page.type("#cTo", JAC + " ");
  await page.fill("#cSubject", composed);
  await page.fill("#cBody", "compose with ack requested");
  await page.check("#cAck");
  await page.selectOption("#cPriority", "blocker");
  await page.click("#composeSend");
  await page.waitForFunction((s) => {
    const row = [...document.querySelectorAll(".group-msgs .msg")].find((el) => el.textContent.includes(s));
    return row && row.querySelector(".ack-flag") && row.querySelector(".priority-badge.p-blocker");
  }, composed, { timeout: 20000 });
  assert(true, "composed message shows the ack flag and blocker badge in the inbox");
  const draftAck = await page.evaluate(() => {
    const d = JSON.parse(localStorage.getItem("mailbox.compose.draft") || "null");
    return d ? d.requiresAck : null;
  });
  assert(draftAck === null, "draft (including the ack flag) cleared after send");

  console.log("\nPASS - triage flow verified in webkit");
} catch (err) {
  failed = true;
  console.error("\nFAIL -", err.message);
  try { await page.screenshot({ path: "tests/triage-failure.png" }); } catch {}
} finally {
  await browser.close();
}
process.exit(failed ? 1 : 0);
