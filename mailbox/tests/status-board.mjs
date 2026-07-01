// Webkit verification for the pre-built read-only status board.
// /api/status-board is intercepted so this can run before the real MCP
// status-listing tool is available.
//
// Run:  node tests/status-board.mjs   (assumes the server is already running)
import { webkit } from "playwright";

const BASE = process.env.BASE || "http://127.0.0.1:4100";

let failures = 0;
function ok(cond, msg) {
  console.log(`  ${cond ? "ok" : "FAIL"} - ${msg}`);
  if (!cond) failures++;
}

const { messages } = await (await fetch(`${BASE}/api/inbox`)).json();
const inboxMessages = Array.isArray(messages) ? messages : [];
const targetMessage = inboxMessages.find((m) => m && m.id);
if (!targetMessage) {
  console.error("SKIP - no inbox message to test board-to-reader transition");
  process.exit(0);
}

const longSummary = Array.from({ length: 16 }, (_, i) =>
  `This is long status detail ${i + 1} with enough words to exercise the clamp.`
).join(" ");
const now = Date.now();
const FIXTURES = [
  {
    id: "status-blocked",
    agent_id: "blocked-agent",
    summary: "Blocked status summary.",
    current_files: [],
    blocked_on: "waiting on jac",
    next_step: "resume after input",
    dispatch_id: "",
    thread_ref: "",
    created_at: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "status-fresh",
    agent_id: "fresh-agent",
    summary: "Fresh status summary.",
    current_files: [],
    blocked_on: "",
    next_step: "continue implementation",
    dispatch_id: "",
    thread_ref: "",
    created_at: new Date(now - 60 * 60 * 1000).toISOString(),
  },
  {
    id: "status-stale",
    agent_id: "stale-agent",
    summary: longSummary,
    current_files: [],
    blocked_on: "",
    next_step: "",
    dispatch_id: "",
    thread_ref: "",
    created_at: new Date(now - 45 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const browser = await webkit.launch();
const page = await browser.newPage();
try {
  await page.route("**/api/status-board", (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({ boardAvailable: true, statuses: FIXTURES }),
  }));

  await page.goto(BASE);
  await page.waitForSelector("#messages .group");

  console.log("1. status board is available and ordered");
  await page.waitForSelector("#statusBoardBtn:not([hidden])");
  await page.click("#statusBoardBtn");
  await page.waitForSelector("#statusBoard:not([hidden])");
  ok(await page.locator("#reader").isHidden(), "reader is hidden while board is open");
  ok(await page.locator("#placeholder").isHidden(), "placeholder is hidden while board is open");

  const agentIds = await page.locator("#statusBoard .status-card").evaluateAll((els) =>
    els.map((el) => el.dataset.agentId)
  );
  ok(agentIds.join(",") === "blocked-agent,fresh-agent,stale-agent",
    `card order is blocked, fresh, stale: ${agentIds.join(",")}`);

  console.log("2. blocked and stale treatments render");
  const blockedText = await page.locator('.status-card[data-agent-id="blocked-agent"] .status-blocked').textContent();
  ok(/BLOCKED:\s*waiting on jac/.test(blockedText || ""), `blocked line is loud: "${blockedText}"`);
  ok(await page.locator('.status-card[data-agent-id="stale-agent"] .status-age.stale').count() === 1,
    "stale agent age has stale class");
  ok(await page.locator('.status-card[data-agent-id="fresh-agent"] .status-age.stale').count() === 0,
    "fresh agent age does not have stale class");

  console.log("3. long summary expands and collapses");
  const staleSummary = page.locator('.status-card[data-agent-id="stale-agent"] .status-summary');
  const staleToggle = page.locator('.status-card[data-agent-id="stale-agent"] .status-more');
  ok(!(await staleSummary.evaluate((el) => el.classList.contains("expanded"))),
    "long summary starts clamped");
  ok((await staleToggle.textContent()) === "more", "toggle starts as more");
  await staleToggle.click();
  ok(await staleSummary.evaluate((el) => el.classList.contains("expanded")),
    "long summary class flips to expanded");
  ok((await staleToggle.textContent()) === "less", "toggle changes to less");

  console.log("4. opening an inbox message hides the board");
  const targetId = targetMessage.id;
  await page.locator(`.group:has(.msg[data-id="${targetId}"]) .group-head`).first().click();
  await page.locator(`.group.open .group-msgs .msg[data-id="${targetId}"]`).first().click();
  await page.waitForSelector("#reader:not([hidden])");
  ok(await page.locator("#statusBoard").isHidden(), "board is hidden after opening a message");

  console.log("5. unavailable board keeps the button hidden");
  await page.unroute("**/api/status-board");
  await page.route("**/api/status-board", (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({ boardAvailable: false, statuses: [] }),
  }));
  await page.reload();
  await page.waitForSelector("#messages .group");
  ok(await page.locator("#statusBoardBtn").isHidden(), "status board button stays hidden");

  console.log(failures ? `\nFAIL - ${failures} check(s) failed` : "\nPASS - status board verified in webkit");
} catch (e) {
  console.error("ERROR:", e.message);
  failures++;
} finally {
  await browser.close();
}
process.exit(failures ? 1 : 0);
