# Handoff: jac mailbox app (build continuation)

Date: 2026-06-28. Author: engineering-architect session. Supersedes the pre-build
HANDOFF-mailbox.md for everything below.

## RESUME HERE (2026-07-01, for the next engineering-architect session)

You are engineering-architect on team "engineering", project `/Users/home/dev/gh-public/_skills`.
jac handed off to restart on the new Fable model. The mailbox app is in good shape;
everything is COMMITTED and CLEAN. Read this block, then the rest is detail/history.

STATE: master HEAD = 5d969a2. All mailbox work committed (66a6f2f app + compose fixes,
93fa1a7 ack + hidden status, 5d969a2 docs). No server running. Inbox clean (no test
cruft). Worktree `_skills-operator-console/mailbox` == master. Nothing uncommitted in
mailbox/ or its docs. (The repo has other PRE-EXISTING unrelated modified/untracked
files - CLAUDE.md, LICENSE, README, other skills, duet/, PHASE2-build-brief-mailbox.md.
Those are NOT this work; leave them alone unless jac asks.)

SHIPPED + VERIFIED: read/reply/compose, inbox grouped by sender, recipient autocomplete
(chip input, per-recipient validation), View all from a sender, inline compose pane
with draft autosave, Acknowledge (amber ack flag + button). `cd mailbox && npm start`
then `npm run verify` (webkit) is green.

TWO OPEN ITEMS (both parked per jac; do NOT chase unless asked):
1. STATUS (post_status) - BUILT but HIDDEN + BLOCKED. The operator_mailbox seat rejects
   post_status: "unknown agent" (jac is an actor, not an agent). Requested fix from
   agentcomms-architect (msg_20260628_195104_24637ca0) - AWAITING REPLY. When it lands:
   remove `hidden` from `#statusWrap` in mailbox/public/index.html, re-add
   `node tests/status.mjs` to the `verify` script in mailbox/package.json, run
   `npm run verify`, screenshot for jac, commit. No other build needed.
2. Worker re-point (msg_20260628_114420_8061f357) - AWAITING REPLY. Not urgent; the
   worktree-staging workflow (below) unblocks dispatch regardless.

ALSO OPTIONAL, NOT BUILT: WI-C reply-draft autosave (speced in
BRIEF-mailbox-compose-fixes.md). Confirm with jac before building.

DISPATCH WORKFLOW (critical - the worker cannot self-verify):
- engineering-codex-worker's project_root is the worktree `_skills-operator-console`,
  where mailbox/ does NOT live in git (uncommitted history). Before dispatch:
  `rm -rf _skills-operator-console/mailbox && cp -R _skills/mailbox _skills-operator-console/mailbox`.
- Dispatch with the full brief INLINED (the worker cannot see uncommitted .team briefs).
- The worker's sandbox CANNOT bind 127.0.0.1:4100 or launch webkit, so it ships CODE
  ONLY and cannot run `npm run verify`. YOU (architect) MUST review the diff and run the
  full suite locally to gate. This session caught two bugs the worker could not: a
  cleanup-regex gap, a `${JAC}`-in-waitForFunction ReferenceError, and the post_status
  substrate block. Always verify locally.
- After review + local verify: sync worktree->master (cp the changed files), run
  `npm run verify` on master, then commit. master is canonical.

## OPERATOR FEEDBACK BACKLOG (2026-06-28, from jac)

Reported after using Compose. Priority order. Brief: `BRIEF-mailbox-compose-fixes.md`.

1. [DONE - WI-A] DATA LOSS (urgent): Compose was a modal that dismissed on backdrop
   click; jac lost 3 fields mid copy-paste.
2. [DONE - WI-A] Compose should NOT be a modal - put it in the main window.
3. [DONE - WI-B] Autocomplete only worked for the FIRST recipient. Fixed with a chip/
   token input (per-recipient autocomplete + independent validation).
4. [DONE - WI-A] Drafts should autosave (no work loss).

### WI-A DELIVERED + VERIFIED (2026-06-28)

Dispatched to engineering-codex-worker (dispatch_20260628_114400_629b0789), reviewed
and verified by engineering-architect. The worker's OWN sandbox could not run the app
(EPERM binding 4100, webkit aborts), so it shipped code only; the architect ran the
full suite locally - all green.

- Compose is now an INLINE pane in the right reading area (a third state next to
  reader/placeholder), NOT a modal. No backdrop, no outside-click dismissal. Closing
  is explicit (Close button). Data-loss failure mode is structurally gone.
- Draft autosave to localStorage key `mailbox.compose.draft` (debounced ~400ms),
  restored on load/open, cleared on successful send; explicit "Discard draft" control;
  subtle "Draft saved" indicator. Recipient hard-validation preserved.
- Files: `mailbox/public/{index.html,app.js,style.css}`, tests updated
  (`tests/e2e.mjs`, `tests/autocomplete.mjs`), new `tests/compose-draft.mjs`,
  `package.json` (script `e2e:compose-draft`, wired into `verify`). Architect also
  broadened `scripts/cleanup-tests.mjs` to match the `mailbox compose-draft-` marker
  (worker had left it uncovered, which would leak a self-test message).
- `npm run verify` = e2e + autocomplete + view-all + compose-draft + cleanup, ALL PASS.

### Workflow note (worktree staging)

Worker project_root is the operator-console worktree, where `mailbox/` does not exist
(uncommitted in master). To dispatch without waiting on a re-point, the architect
staged `mailbox/` into that worktree (cp -R), dispatched, then synced the worker's
result back to master and verified. Master is canonical; master == worktree now.
agentcomms-architect notified (msg_20260628_114420_8061f357); durable re-point still
an open question with them.

### WI-B DELIVERED + VERIFIED (2026-06-28)

Dispatched to engineering-codex-worker (dispatch_20260628_133124_436cbbf3), reviewed
and verified by engineering-architect. Worker shipped code only (same sandbox block).

- The single "To" text field is now a CHIP/TOKEN input: each committed recipient is a
  pill (commit on Enter/comma/blur; Backspace on empty removes the last; x removes
  one), and the trailing input autocompletes the CURRENT token against the roster - so
  EVERY recipient autocompletes, not just the first. Per-chip validation: green
  (chip-valid) / red (chip-invalid); send blocked if any chip invalid (rosterAvailable
  path), server `_require_actor` backstop unchanged. Send now posts `toAgents` array.
  Draft autosave round-trips the recipient set (draft.recipients), backward-compatible
  with old draft.to.
- Files: `mailbox/public/{app.js,index.html,style.css}`, tests updated
  (`tests/e2e.mjs`, `tests/autocomplete.mjs`, `tests/compose-draft.mjs`).
- ARCHITECT CAUGHT A TEST BUG before merge: worker put `${JAC}` inside a
  `page.waitForFunction` arrow (runs in the browser, where the Node var is undefined ->
  ReferenceError). Fixed by passing JAC as a waitForFunction arg. App code was correct;
  the bug only surfaced by actually running the suite. `npm run verify` ALL PASS after
  the fix (verified in the worktree, then re-synced to master and re-verified).

### WI-C (optional, NOT dispatched)

WI-C (reply-draft autosave) is speced in `BRIEF-mailbox-compose-fixes.md`. jac said
"no need to do all at once"; confirm before dispatching. The reported compose pain
(WI-A + WI-B) is fully addressed.

### WI-D + WI-E: acknowledge + status (brief `BRIEF-mailbox-ack-status.md`)

jac asked to surface two more operator-seat tools. Dispatched together
(dispatch_20260628_194419_0bab49da), reviewed + verified by the architect. Committed
93fa1a7.

- WI-D Acknowledge: DONE + VERIFIED + SHIPPED. Amber "ack" flag in the inbox (row +
  conversation) for messages needing ack; reader shows an Acknowledge button + optional
  response; `ack_message` via POST /api/ack; flag clears on ack. Test `tests/ack.mjs`
  in `verify`. (ack_message works for the operator seat - no agent record needed.)
- WI-E Status: BUILT but BLOCKED + HIDDEN. post_status rejects the operator_mailbox
  seat with "unknown agent" (jac is an actor, not an agent; the tool is allow-listed but
  its impl gates on the agents table). Code is fully staged: `#statusWrap` carries
  `hidden`, `tests/status.mjs` is NOT in `verify`. Request sent to agentcomms-architect
  (msg_20260628_195104_24637ca0): either let post_status accept a human actor on the
  seat, or register jac as an agent. The moment it works, remove `hidden` + re-add
  tests/status.mjs to verify - no further build.
- Architect verification caught: the status failure (substrate, via direct post_status
  call returning "unknown agent") - would have shipped a broken button otherwise.

## UPDATE 2026-06-28 (second engineering-architect session): both follow-ups DONE

Both queued follow-ups are now BUILT and webkit-verified. The "What is built" and the
two Priority sections below are kept for context; their BLOCKED/queued status is
SUPERSEDED by this note.

1. **Autocomplete + hard recipient validation - LIVE.** agentcomms-architect landed
   `list_actors` read-only on the operator_mailbox seat (reply
   `msg_20260628_003808_fe5b9b1b`; CONTRACT_VERSION bumped 5->6, same tool name).
   The UI was already wired, so this needed NO engineering change - just a server
   restart. Verified: `/api/actors` returns `rosterAvailable:true` with 35 actors;
   Compose blocks unknown ids and greenlights valid ones. Test: `npm run e2e:autocomplete`.
2. **"View all from <sender>" - BUILT.** Explicit button below an open message reveals
   that sender's messages to jac (snippets, scrollable, reply box stays, current one
   marked). One-sided by design (no sent-items tool on the seat); the caption says so.
   Files: `public/index.html`, `public/app.js`, `public/style.css`. Test:
   `npm run e2e:view-all`.

All three suites pass (`npm run verify` runs them + cleanup). Server STOPPED, inbox
restored, e2e self-messages cleaned. STILL NOTHING COMMITTED - all work is in the
working tree under `mailbox/` plus the spec/handoff edits; commit when jac approves.

Open decision for jac: a TRUE two-sided thread (jac's replies shown alongside) needs a
sent-items capability added to the operator seat - another agentcomms ask. Not built.

## TL;DR

The NOW slice of the jac operator mailbox is BUILT, running, and verified end to end
under `mailbox/`. The operator (jac) is happy with the first pass. Two follow-ups were
queued, IN PRIORITY ORDER (BOTH NOW DONE - see the UPDATE above):

1. **Autocomplete so jac can only send to valid recipients** (TOP priority). UI logic
   is already built but INERT - it needs the agent-comms operator seat to expose a
   read-only roster tool. Request already sent to agentcomms-architect; awaiting reply.
2. **"View all" button** below an open message that reveals all messages from that
   sender. No dependency; buildable immediately.

Living spec: `.team/research/mailbox-ux.md` (status: BUILT). Read it first.

## What is built and verified (mailbox/)

- Single identity = jac, actor id `01J00000000000000000000001` (NOT `human-jac`,
  which is a DLQ sink). Set in ONE place: `mailbox/config.mjs`.
- Transport: a literal MCP client (`@modelcontextprotocol/sdk`, stdio) launched as
  `agent-comms-mcp --actor-id 01J00000000000000000000001` with env
  `WAKE_POLICY=operator_mailbox`. One warm connection, no pool. Verified: returns
  jac's real inbox.
- `mail.mjs`: thin interface mirroring the MCP tools (`listInbox`, `readMessage`,
  `sendMessage`, `closeMessage`) + `shutdown()`.
- `server.mjs`: Node JSON API (`/api/me`, `/api/inbox`, `/api/message`,
  `/api/actors`, `/api/send`) + static serving. Clean SIGINT/SIGTERM shutdown.
- `public/`: buildless two-pane responsive UI. Inbox is grouped by sender
  (conversation accordion: newest collapsed, expand to see the rest, unread badge per
  conversation, own id shown as "jac (you)"). Reader shows the opened message +
  reply box + "acting as jac" indicator. Compose modal.
- `tests/e2e.mjs`: webkit happy path (load -> compose+send -> open -> reply), all
  sends self-targeted so it never pings a real architect. PASSING.
- `scripts/check-connection.mjs` (step 0) and `scripts/cleanup-tests.mjs` (closes the
  self-targeted test messages e2e leaves behind).
- `mailbox/SKILL.md`: the reusable skill (run + stop + verify + gotchas).

Run: `cd mailbox && npm install && npm start` -> http://127.0.0.1:4100. Stop: Ctrl+C
(clean) or `npm run stop`. Verify: `npm run e2e` then `node scripts/cleanup-tests.mjs`.

## Priority 1: autocomplete (BLOCKED on agent-comms)

Goal: Compose "To" autocompletes from the live roster and HARD-BLOCKS any id that is
not a real actor, so jac cannot mistype a recipient.

State:
- UI is DONE and degrades gracefully. `app.js` already consumes `/api/actors`:
  builds `knownIds`/`displayById`, shows a live hint (green valid / red unknown), and
  blocks send on unknown recipients - but ONLY when `rosterAvailable` is true.
- `server.mjs` `/api/actors` catches the denial and returns
  `{actors:[], rosterAvailable:false}`, so the page never breaks; it falls back to
  free text + server-side `_require_actor` (send-time error toast).

The blocker: the `operator_mailbox` policy does not allow any roster tool, so
`list_actors` returns "Unknown tool". The fix is a one-line, operator-scoped,
read-only change in agent-comms (NOT ours to make - jac said route it to
agentcomms-architect, who will likely do it):

  File `agent_comms/policies/__init__.py`, operator_mailbox CompiledPolicy ONLY:
    mcp_allowed_tools=mailbox_tools,
  ->
    mcp_allowed_tools=mailbox_tools | {"list_actors"},

`list_actors` is already implemented and gated behind `tool_allowed()` in
`agent_comms/mcp_server.py` (~line 59); this just flips it on for the operator seat.
worker_dispatch keeps plain `mailbox_tools`, so workers gain nothing.

Request sent: engineering-architect -> agentcomms-architect,
`msg_20260627_231217_82ca39a8`. AWAITING REPLY. The moment it lands, the autocomplete
works with NO further engineering change (just restart and re-verify in webkit).

CONSTRAINT: do NOT edit agent-comms. jac was explicit: agent-comms changes need
agentcomms-architect's permission. If they propose a different tool name
(list_agents, a filtered roster, etc.), just point `mail.mjs` `listActors()` at it.

## Priority 2: "View all" button (buildable now)

jac's exact ask: when a message is open, a "View all" button BELOW it that reveals
all messages from that sender (not a default transcript, not header-only expansion -
an explicit button under the open message). Open one message, click "View all," the
rest from that sender appear (e.g. appended below, scrollable), reply box stays.

Implementation note: the inbox is already grouped by sender in `app.js` (renderInbox),
so the per-sender message set is in hand. The reader currently shows one message
(openMessage). Add the button + a render path that lists that sender's messages.

CONSTRAINT to surface to jac when building: the operator seat only returns messages
addressed TO jac (`list_inbox`); there is NO sent-items tool. So "all messages from
this person" = their messages to jac, NOT jac's replies back. A two-sided thread
would need a sent-items capability added to the seat (another agentcomms ask).

## State left clean

- Dev server STOPPED. Inbox restored to real messages (a few marked "read" from
  testing; no leftover test cruft - cleanup-tests.mjs run).
- NOTHING committed. All work is in the working tree under `mailbox/` plus edits to
  `.team/research/mailbox-ux.md`. Next session can commit `mailbox/` + the spec when
  jac approves.
- Open real inbox item still needing jac's action (pre-existing, not ours):
  `msg_20260626_111658` from sensor-architect, requires_ack - remove stale
  sensor-fake-worker fixture from the registry.

## Identity / gotchas (do not re-derive)

- jac = `01J00000000000000000000001` (display "jac"). `human-jac` is a DLQ sink, never
  use it.
- A human cannot launch the agent MCP server normally (`require_agent` gates on the
  `agents` table); the `operator_mailbox` wake policy is what allows the jac seat.
- Substrate facts: `.team/research/mailbox-substrate-contract.md` (written around
  human-jac, but schema holds for any actor id).
