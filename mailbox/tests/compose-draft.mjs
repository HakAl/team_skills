// Webkit verification for inline compose draft persistence.
// Self-contained and safe: any send targets jac's own id only.
//
// Run:  node tests/compose-draft.mjs   (assumes the server is already running)
import { webkit } from "playwright";

const BASE = process.env.BASE || "http://127.0.0.1:4100";
const JAC = "01J00000000000000000000001";
const marker = `compose-draft-${Date.now()}`;

let failures = 0;
function ok(cond, msg) {
  console.log(`  ${cond ? "ok" : "FAIL"} - ${msg}`);
  if (!cond) failures++;
}

async function openCompose(page) {
  await page.click("#composeBtn");
  await page.waitForSelector("#composeForm:not([hidden])");
}

async function waitForDraft(page) {
  await page.waitForFunction(() => {
    const status = document.querySelector("#draftStatus");
    return status && /draft saved/i.test(status.textContent || "");
  });
}

async function assertFields(page, recipients, subject, body, label) {
  const gotRecipients = await page.locator(".chip").evaluateAll((chips) =>
    chips.map((chip) => chip.dataset.id)
  );
  const gotSubject = await page.inputValue("#cSubject");
  const gotBody = await page.inputValue("#cBody");
  ok(
    JSON.stringify(gotRecipients) === JSON.stringify(recipients) &&
      gotSubject === subject &&
      gotBody === body,
    label
  );
}

const browser = await webkit.launch();
const page = await browser.newPage();
try {
  console.log("1. type a draft, reload, and restore fields");
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.removeItem("mailbox.compose.draft"));
  await openCompose(page);
  await page.fill("#cTo", JAC);
  await page.press("#cTo", "Enter");
  await page.fill("#cSubject", `mailbox ${marker}`);
  await page.fill("#cBody", `draft body ${marker}`);
  await waitForDraft(page);
  await page.reload({ waitUntil: "networkidle" });
  await openCompose(page);
  await assertFields(page, [JAC], `mailbox ${marker}`, `draft body ${marker}`, "draft restored after reload");

  console.log("2. clicking elsewhere does not dismiss or clear compose");
  await page.click(".brand");
  const stillOpen = await page.locator("#composeForm:not([hidden])").count();
  ok(stillOpen === 1, "compose stays open after outside click");
  await assertFields(page, [JAC], `mailbox ${marker}`, `draft body ${marker}`, "fields survived outside click");

  console.log("3. successful self-targeted send clears the draft");
  await page.click("#composeSend");
  await page.waitForFunction(
    () => {
      const t = document.querySelector("#toast");
      return t && !t.hidden && /message sent/i.test(t.textContent || "");
    },
    { timeout: 15000 }
  );
  await page.reload({ waitUntil: "networkidle" });
  await openCompose(page);
  await assertFields(page, [], "", "", "draft empty after successful send and reload");

  console.log("4. Discard draft clears fields and stored draft");
  await page.fill("#cTo", JAC);
  await page.press("#cTo", "Enter");
  await page.fill("#cSubject", `mailbox ${marker} discard`);
  await page.fill("#cBody", `discard body ${marker}`);
  await waitForDraft(page);
  await page.click("#composeDiscard");
  await assertFields(page, [], "", "", "discard clears visible fields");
  const stored = await page.evaluate(() => localStorage.getItem("mailbox.compose.draft"));
  ok(stored === null, "discard clears localStorage draft");
  await page.reload({ waitUntil: "networkidle" });
  await openCompose(page);
  await assertFields(page, [], "", "", "discarded draft stays empty after reload");

  console.log(failures ? `\nFAIL - ${failures} check(s) failed` : "\nPASS - compose draft persistence verified in webkit");
} catch (e) {
  console.error("ERROR:", e.message);
  failures++;
} finally {
  await browser.close();
}
process.exit(failures ? 1 : 0);
