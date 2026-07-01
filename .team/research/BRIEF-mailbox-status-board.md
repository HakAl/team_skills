# BRIEF: mailbox status board pre-build (read-only list_status, inert until seat grant)

Date: 2026-07-01. Author: engineering-architect. Approved by jac (design OK'd in
session). Status: DISPATCHED.

## Goal

Pre-build a read-only STATUS BOARD in the mailbox: each agent's latest status from
`list_status`. The operator seat does not have the tool yet (ask #3 in
msg_20260701_220730_8a98d5fc), so the feature stays INVISIBLE until the grant lands,
then lights up on restart. Same pattern as sent-items (BRIEF-mailbox-sent-items.md):
speculative tool name isolated to mail.mjs, degrading endpoint, route-intercepted
webkit test so the enabled path is in `verify` today.

Real payload shape (confirmed from the engineering seat): array of
`{ id, agent_id, summary, current_files[], blocked_on, next_step, dispatch_id,
thread_ref, created_at }`. Summaries can exceed 2,000 chars. Some statuses are
months old.

## Constraints

- Do NOT touch agent-comms. Worker ships CODE ONLY (sandbox cannot bind 4100 or run
  webkit); architect verifies locally.
- Do NOT touch the existing hidden `#statusWrap` (that is the separate, blocked
  post_status WRITE feature) or tests/status.mjs.
- Change ONLY: mail.mjs, server.mjs, public/index.html, public/app.js,
  public/style.css, tests/status-board.mjs (new), package.json.

## Work items

1. mail.mjs: export `listStatus()` calling tool `list_status` with `{}`. Tool name
   appears here ONLY.

2. server.mjs: GET /api/status-board, mirroring /api/sent degradation exactly:
   try -> `{ statuses: Array.isArray(rows) ? rows : [], boardAvailable: true }`
   catch -> `{ statuses: [], boardAvailable: false }` (200, never 5xx).

3. index.html: a "Status board" button in the header area near the compose control,
   `hidden` by default, id `statusBoardBtn`. A board container `statusBoard`
   (hidden) in the RIGHT pane as a sibling state of reader/placeholder/compose.

4. app.js:
   - State: `let boardStatuses = []; let boardAvailable = false;`
   - `loadStatusBoard()` fetching /api/status-board; degrade on error. Call on boot;
     unhide `statusBoardBtn` only when boardAvailable. Re-fetch on every board open.
   - Opening the board hides reader/placeholder/compose (same discipline compose
     uses); opening a message or compose hides the board. No state can overlap.
   - Render one card per status, ORDERED: blocked (non-empty blocked_on) first,
     then newest-first by created_at within each group. Card layout, top to bottom:
     - line 1: agent display name (reuse senderLabel) + relative age via a new
       `fmtAge(iso)` helper ("3h ago", "5d ago", "7w ago"). Age gets class `stale`
       when older than 7 days.
     - line 2 (only when blocked_on non-empty): a visually loud "BLOCKED:" prefix +
       the blocked_on text (amber treatment consistent with the ack styling).
     - line 3 (when next_step non-empty): "next:" + next_step, muted.
     - summary: CSS-clamped to 3 lines (-webkit-line-clamp) with a "more"/"less"
       toggle that un-clamps per card. Ignore current_files/dispatch_id/thread_ref.
   - Empty-but-available board: a simple "No statuses." placeholder line.

5. style.css: card styles (border, spacing per existing palette), `.stale` muted or
   warn tone on the age, blocked amber accent (reuse the ack amber variable if one
   exists), clamp + expanded states. Small; no layout rework.

6. tests/status-board.mjs (new, goes in `verify`): copy the harness conventions of
   tests/sent-merge.mjs. Route-intercept `**/api/status-board` BEFORE page load with
   `boardAvailable: true` and 3 fixtures built relative to Date.now() in Node:
   - "blocked-agent": blocked_on "waiting on jac", created_at 2 days ago;
   - "fresh-agent": no blocked_on, created_at 1 hour ago;
   - "stale-agent": no blocked_on, created_at 45 days ago, summary > 400 chars so
     the clamp/expand toggle is exercised.
   Assert:
   - statusBoardBtn becomes visible; clicking opens the board and hides the reader
     placeholder;
   - card order is blocked-agent, fresh-agent, stale-agent;
   - blocked card shows the BLOCKED treatment text;
   - stale-agent's age element has class `stale`, fresh-agent's does not;
   - the long summary is clamped, the toggle expands it (assert a class flips and
     the toggle label changes);
   - opening a real message from the inbox hides the board and shows the reader;
   - then re-route with `{ statuses: [], boardAvailable: false }`, reload, assert
     statusBoardBtn stays hidden.
   PAST BUG to avoid: never reference Node-scope variables inside
   page.waitForFunction/evaluate callbacks - pass them as args.

7. package.json: add `"e2e:status-board": "node tests/status-board.mjs"`, append
   `node tests/status-board.mjs` to `verify` before cleanup-tests.mjs.

## Acceptance (architect runs locally)

`npm run verify` all green including status-board; live app shows NO trace of the
board (button hidden, degraded endpoint). When the grant lands: restart, button
appears, screenshot for jac. If the granted tool name differs, re-point
mail.mjs listStatus() only.
