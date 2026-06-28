// Webkit verification for publishing jac's status.
// This really publishes jac's status. There is no read-back tool to restore it.
import { webkit } from "playwright";

const BASE = process.env.BASE || "http://127.0.0.1:4100";
const summary = `mailbox status check ${Date.now()}`;

function assert(cond, msg) {
  if (!cond) throw new Error("ASSERT FAILED: " + msg);
  console.log("  ok - " + msg);
}

const browser = await webkit.launch();
const page = await browser.newPage();
let failed = false;
try {
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.removeItem("mailbox.status"));
  await page.click("#statusBtn");
  await page.waitForSelector("#statusForm:not([hidden])", { timeout: 15000 });
  await page.fill("#statusSummary", summary);
  await page.fill("#statusNext", "continue mailbox verification");
  await page.click("#statusPublish");
  await page.waitForFunction(
    (s) => document.querySelector("#statusDisplay")?.textContent.includes(s),
    summary,
    { timeout: 15000 }
  );
  assert(true, "status display shows published summary");
  const stored = await page.evaluate(() => localStorage.getItem("mailbox.status"));
  assert(stored && JSON.parse(stored).summary === summary, "localStorage stores last status");
  console.log("\nPASS - status publish verified in webkit");
} catch (err) {
  failed = true;
  console.error("\nFAIL -", err.message);
  try { await page.screenshot({ path: "tests/status-failure.png" }); } catch {}
} finally {
  await browser.close();
}
process.exit(failed ? 1 : 0);
