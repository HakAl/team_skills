// Priority-1 verification: Compose "To" autocompletes from the live roster and
// HARD-BLOCKS unknown recipients. Self-target only; never sends to a real actor
// (the unknown-recipient case is blocked client-side before any /api/send).
//
// Run:  node tests/autocomplete.mjs   (assumes the server is already running)
import { webkit } from "playwright";

const BASE = process.env.BASE || "http://127.0.0.1:4100";
const JAC = "01J00000000000000000000001";

let failures = 0;
function ok(cond, msg) {
  console.log(`  ${cond ? "ok" : "FAIL"} - ${msg}`);
  if (!cond) failures++;
}

const browser = await webkit.launch();
const page = await browser.newPage();
try {
  await page.goto(BASE);
  await page.waitForSelector("#composeBtn");

  console.log("1. roster loaded into the datalist");
  const optCount = await page.locator("#actorList option").count();
  ok(optCount > 0, `datalist has ${optCount} actor option(s)`);
  const hasJac = await page.locator(`#actorList option[value="${JAC}"]`).count();
  ok(hasJac === 1, "jac's own id is an autocomplete option");

  console.log("2. unknown recipient -> invalid chip + send blocked");
  await page.click("#composeBtn");
  await page.waitForSelector("#composeForm:not([hidden])");
  await page.fill("#cTo", "not-a-real-actor");
  await page.press("#cTo", "Enter");
  await page.fill("#cBody", "should never send");
  await page.waitForFunction(() =>
    document.querySelector('.chip[data-id="not-a-real-actor"].chip-invalid') !== null
  );
  ok(true, "chip marks the id as unknown (.chip-invalid present)");
  await page.click("#composeSend");
  // The block is client-side: a toast fires and the compose pane stays open.
  const toastText = await page.locator("#toast").textContent();
  ok(/unknown recipient/i.test(toastText || ""), `send blocked with toast: "${toastText}"`);
  const stillOpen = await page.locator("#composeForm:not([hidden])").count();
  ok(stillOpen === 1, "compose pane stayed open (nothing sent)");

  console.log("3. second valid recipient -> valid chip");
  await page.fill("#cTo", JAC);
  await page.press("#cTo", "Enter");
  await page.waitForFunction((jac) =>
    document.querySelector(`.chip[data-id="${jac}"].chip-valid`) !== null &&
    document.querySelector('.chip[data-id="not-a-real-actor"].chip-invalid') !== null
  , JAC);
  ok(true, "second recipient validates independently as .chip-valid");

  console.log(failures ? `\nFAIL - ${failures} check(s) failed` : "\nPASS - autocomplete hard-validation verified in webkit");
} catch (e) {
  console.error("ERROR:", e.message);
  failures++;
} finally {
  await browser.close();
}
process.exit(failures ? 1 : 0);
