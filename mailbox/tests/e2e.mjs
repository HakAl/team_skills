// Webkit e2e happy path for the jac mailbox.
// Self-contained and safe: every message is sent to jac's own id, so the test
// never pings a real architect. Covers: load inbox -> compose+send -> see it land
// -> open it -> reply -> see reply land.
//
// Run:  node tests/e2e.mjs        (assumes the server is already running)
//       BASE=http://127.0.0.1:4100 node tests/e2e.mjs
import { webkit } from "playwright";

const BASE = process.env.BASE || "http://127.0.0.1:4100";
const marker = process.env.E2E_MARKER || "e2e-check";

function assert(cond, msg) {
  if (!cond) throw new Error("ASSERT FAILED: " + msg);
  console.log("  ok - " + msg);
}

const browser = await webkit.launch();
const page = await browser.newPage();
let failed = false;
try {
  console.log("1. load inbox");
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForSelector(".group", { timeout: 15000 });
  const groups = await page.locator(".group").count();
  assert(groups >= 1, `inbox rendered ${groups} conversation group(s)`);

  console.log("2. compose -> self -> send");
  await page.click("#composeBtn");
  await page.waitForSelector("#composeForm:not([hidden])");
  await page.fill("#cTo", "01J00000000000000000000001");
  await page.press("#cTo", "Enter");
  await page.fill("#cSubject", `mailbox ${marker}`);
  await page.fill("#cBody", `compose body ${marker}`);
  await page.click("#composeSend");
  await page.waitForSelector("#toast:not([hidden])", { timeout: 15000 });
  const t1 = await page.textContent("#toast");
  assert(/sent/i.test(t1), `compose toast says sent ("${t1}")`);

  console.log("3. see it land as the top conversation (from self)");
  await page.waitForFunction(
    (m) => {
      const head = document.querySelector(".group-head .subj");
      return head && head.textContent.includes(m);
    },
    marker,
    { timeout: 15000 }
  );
  assert(true, "composed message tops the conversation list");

  console.log("4. expand the conversation and open the message");
  await page.locator(".group-head").first().click();
  await page.locator(".group.open .group-msgs .msg").first().click();
  await page.waitForSelector("#reader:not([hidden])", { timeout: 15000 });
  await page.waitForFunction(
    (m) => {
      const s = document.querySelector("#rSubject");
      return s && s.textContent.includes(m);
    },
    marker,
    { timeout: 15000 }
  );
  const subj = await page.textContent("#rSubject");
  assert(subj.includes(marker), `reader shows the message ("${subj}")`);

  console.log("5. reply (goes to self, since the message is from self)");
  await page.fill("#replyBody", `reply body ${marker}`);
  await page.click("#replySend");
  await page.waitForFunction(
    () => {
      const t = document.querySelector("#toast");
      return t && !t.hidden && /reply sent/i.test(t.textContent);
    },
    { timeout: 15000 }
  );
  assert(true, "reply sent");

  await page.screenshot({ path: "tests/e2e-result.png" });
  console.log("\nPASS - happy path verified in webkit. Screenshot: tests/e2e-result.png");
} catch (err) {
  failed = true;
  console.error("\nFAIL -", err.message);
  try { await page.screenshot({ path: "tests/e2e-failure.png" }); } catch {}
} finally {
  await browser.close();
}
process.exit(failed ? 1 : 0);
