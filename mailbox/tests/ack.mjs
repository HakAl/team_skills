// Webkit verification for acknowledging messages that require ack.
// Self-contained and safe: the setup message is sent to jac's own id.
import { webkit } from "playwright";
import { sendMessage } from "../mail.mjs";

const BASE = process.env.BASE || "http://127.0.0.1:4100";
const JAC = "01J00000000000000000000001";
const subject = `mailbox e2e-ack-${Date.now()}`;

function assert(cond, msg) {
  if (!cond) throw new Error("ASSERT FAILED: " + msg);
  console.log("  ok - " + msg);
}

await sendMessage({
  toAgents: [JAC],
  subject,
  body: `ack body ${subject}`,
  requiresAck: true,
});

const browser = await webkit.launch();
const page = await browser.newPage();
let failed = false;
try {
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForSelector(".group", { timeout: 15000 });
  await page.waitForFunction(
    (s) => [...document.querySelectorAll(".group-head .subj")].some((el) => el.textContent.includes(s)),
    subject,
    { timeout: 15000 }
  );

  const group = page.locator(".group").filter({ hasText: subject }).first();
  await group.locator(".group-head .ack-flag").waitFor({ timeout: 15000 });
  assert(true, "inbox conversation shows needs-ack indicator");

  await group.locator(".group-head").click();
  const row = group.locator(".group-msgs .msg").filter({ hasText: subject }).first();
  await row.locator(".ack-flag").waitFor({ timeout: 15000 });
  assert(true, "message row shows needs-ack indicator");

  await row.click();
  await page.waitForSelector("#reader:not([hidden])", { timeout: 15000 });
  await page.waitForSelector("#ackBox:not([hidden]) #ackBtn", { timeout: 15000 });
  assert(true, "acknowledge control is shown in reader");

  await page.fill("#ackResponse", "acknowledged by mailbox e2e");
  await page.click("#ackBtn");
  await page.waitForFunction(() => {
    const box = document.querySelector("#ackBox");
    return box && box.hidden;
  }, { timeout: 15000 });
  assert(true, "acknowledge control disappears after ack");

  // Scope to the acked row: the same sender may have OTHER messages still needing ack
  // (e.g. monitor pages to jac), which legitimately keep the conversation-level flag.
  await page.waitForFunction((s) => {
    const row = [...document.querySelectorAll(".group-msgs .msg")].find((el) => el.textContent.includes(s));
    return row && !row.querySelector(".ack-flag");
  }, subject, { timeout: 15000 });
  assert(true, "needs-ack indicator clears from the acked message row");
  console.log("\nPASS - acknowledge flow verified in webkit");
} catch (err) {
  failed = true;
  console.error("\nFAIL -", err.message);
  try { await page.screenshot({ path: "tests/ack-failure.png" }); } catch {}
} finally {
  await browser.close();
}
process.exit(failed ? 1 : 0);
