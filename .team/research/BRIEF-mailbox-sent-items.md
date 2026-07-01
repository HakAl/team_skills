# BRIEF: mailbox sent-items pre-build (two-sided thread, inert until seat grant)

Date: 2026-07-01. Author: engineering-architect. Approved by jac (roadmap L1).
Status: DISPATCHED (see dispatch id in handoff/changelog).

## Goal

Pre-build the two-sided "View all" thread so that the moment agentcomms-architect
grants a sent-items tool on the operator_mailbox seat, the feature lights up with a
server restart - no build. Until then the UI degrades to today's one-sided behavior.
Same graceful-degradation pattern as rosterAvailable (autocomplete).

Ask sent to agentcomms: msg_20260701_220730_8a98d5fc. Speculative tool name:
`list_sent` (messages WHERE from_agent = jac). If they expose a different name/shape,
only mail.mjs listSent() gets re-pointed - keep that the ONLY place the name appears.

## Constraints (unchanged from prior WIs)

- Do NOT touch agent-comms. Do NOT invent server-side fakes for the missing tool.
- Worker ships CODE ONLY (sandbox cannot bind 127.0.0.1:4100 or run webkit).
  Architect runs `npm run verify` locally and gates.
- Change ONLY the files named below, all under mailbox/.

## Work items

### 1. mail.mjs - listSent()

Export `listSent({ limit = 100 } = {})` calling MCP tool `list_sent` with `{ limit }`.
One-liner mirroring listInbox. (Tool name appears here ONLY.)

### 2. server.mjs - GET /api/sent

Mirror the /api/actors degradation exactly:
- try: `const rows = await listSent({ limit: 100 })` ->
  `{ messages: Array.isArray(rows) ? rows : [], sentAvailable: true }`
- catch: `{ messages: [], sentAvailable: false }` (200, never 5xx).
Import listSent alongside the other mail.mjs imports.

### 3. public/app.js - merge into the sender view

State: `let sentMessages = []; let sentAvailable = false;`

Fetch: an async `loadSent()` calling /api/sent, setting both vars; swallow errors as
degraded (`sentAvailable = false`). Call it (a) once on boot alongside the actors
fetch, and (b) at the top of toggleSenderAll() when OPENING the list (so the view is
fresh); re-render after it resolves.

setupSenderAll(sender): when sentAvailable, the button count becomes
inbox-from-sender + sent-to-sender counts; the `count <= 1` gate now also passes if
there is at least 1 inbox message + 1 sent reply. Degraded: unchanged.

renderSenderAll():
- Build the sender's inbox messages as today.
- When sentAvailable: add jac's sent messages addressed to viewAllSender. A sent
  row's `to` may be a string OR an array of ids - match if it equals/includes
  viewAllSender. Tag each merged item so CSS can style it (`sa-item from-you`), meta
  prefix "jac (you)". Sort the COMBINED list newest-first (same comparator).
  Caption: `${total} message(s) between you and ${senderLabel(viewAllSender)}`.
- Degraded (sentAvailable false): EXACTLY today's output, including the caption
  "...your replies are not shown (the seat has no sent-items view)."
- Sent items are NOT clickable (read_message only works for messages TO jac) and
  never get the unread/current markers.
- Sent items must NOT appear in the inbox list, thread box, or anywhere else.

### 4. public/style.css - .sa-item.from-you

Visually distinct "you" style consistent with the existing palette: e.g. accent
left-border + slightly shifted background, matching how chips/ack styles were done.
Small, tasteful; no layout rework.

### 5. tests/sent-merge.mjs - enabled path, testable TODAY (goes in verify)

Copy the harness conventions of tests/view-all.mjs (launch webkit, same base URL,
same marker/cleanup discipline). Before page load, use Playwright route interception:

  await page.route("**/api/sent", (route) => route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({ sentAvailable: true, messages: FIXTURES }),
  }));

FIXTURES: 2 sent messages from jac to the sender the test drives against, with ids,
subjects, body_snippet, created_at values interleaving the real inbox timestamps
(pick the sender the same way view-all.mjs does, from the live inbox). Assert:
- caption says "between you and";
- the list contains the fixture items with the from-you class and "jac (you)" meta;
- ordering is newest-first across merged items;
- fixture items are not clickable (no `clickable` class);
- inbox pane does NOT contain the fixture subjects.
Also assert the DEGRADED path in the same file: reload with route fulfilling
`{ messages: [], sentAvailable: false }` and check the old one-sided caption is back.

### 6. package.json

Add script `"e2e:sent-merge": "node tests/sent-merge.mjs"` and append
`node tests/sent-merge.mjs` to `verify` (before cleanup-tests.mjs).

## NOT in scope

- No inbox-pane changes, no compose changes, no thread-box (ancestor walk) changes.
- No attempt to call list_sent for real in tests (the live server will be degraded
  until the grant; tests/view-all.mjs keeps covering the live degraded path).
- WI-C reply-draft autosave remains parked.

## Acceptance (architect runs locally)

`cd mailbox && npm start` then `npm run verify` all green, including the new
sent-merge suite; view-all suite unchanged and green (live degraded path). Manual:
open a sender with >1 message - degraded caption unchanged today.
