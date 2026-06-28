# Build brief: mailbox ack + status

Author: engineering-architect, 2026-06-28. jac asked for two operator-seat tools to be
surfaced in the mailbox UI: acknowledge and status. Target: `mailbox/` in the main repo
`/Users/home/dev/gh-public/_skills` (staged into the worker worktree for dispatch).

Worker contract: implement EXACTLY these work-items in mailbox/; NO git commit/add;
report changed files + what changed; keep ALL existing tests green; buildless (no new
deps); plain HTML/JS; match existing code style; NO emdashes anywhere. Read
mailbox/SKILL.md and mailbox/public/{app.js,index.html,style.css}, mailbox/server.mjs,
mailbox/mail.mjs first.

Seat facts (verified): the operator_mailbox seat exposes these 8 tools - list_inbox,
read_message, send_message, list_actors, ack_message, close_message, wait_for_reply,
post_status. Tool input schemas:
- ack_message: { message_id (required), response (optional string) }
- post_status: { summary (required string), next_step (optional string), blocked_on
  (optional string), current_files/dispatch_id/thread_ref (worker-only, IGNORE) }
- send_message supports requires_ack (boolean) - used by the ack test below.
Inbox rows (list_inbox) include `requires_ack` (bool), `status` (sent|read|
acknowledged|closed), `id`, `from`, `subject`, `created_at`, `body_snippet`.

VERIFY pattern (you likely CANNOT run it - sandbox blocks binding 127.0.0.1:4100 and
webkit launch; that happened on WI-A and WI-B). Run `node --check` on every changed
.js/.mjs file and report results. Try `cd mailbox && npm start` + `npm run verify`; if
the sandbox blocks it, say so explicitly and DO NOT claim it passed. The architect runs
the full suite. All test sends are self-targeted to jac id 01J00000000000000000000001;
never a real actor.

---

## WI-D: Acknowledge (ack_message)

A message "needs ack" when `requires_ack === true` AND `status !== "acknowledged"` AND
not closed.

1. mail.mjs: add `ackMessage(messageId, response = "")` -> call("ack_message",
   { message_id: messageId, response }).
2. server.mjs: add `POST /api/ack` with body { id, response } -> ackMessage -> return
   { ok: true } (mirror the /api/send error handling).
3. Inbox (app.js renderInbox): show an "needs ack" indicator on any message row that
   needs ack, and on a conversation group that contains one (a small amber pill or
   badge, e.g. class `ack-flag`, text "ack"). Stable/testable class names.
4. Reader (app.js openMessage): when the open message needs ack, show an
   "Acknowledge" control: a button (#ackBtn) plus an optional short single-line
   response input (#ackResponse). Determine needs-ack from the message: prefer fields
   returned by read_message; if read_message does not include requires_ack/status, fall
   back to the cached inbox row (inboxMessages.find(m => m.id === id)). Hide the control
   when the message does not need ack.
5. On Acknowledge: POST /api/ack { id, response: ackResponse.value }, then refresh the
   inbox and re-render the reader so the control disappears (status is now acknowledged)
   and the inbox needs-ack indicator clears. Toast "Acknowledged".
6. Test tests/ack.mjs (wire into package.json as `e2e:ack` and into `verify`), webkit,
   self-contained: use a tiny helper or the mail module to SEND a self-targeted message
   with requires_ack=true and subject `mailbox e2e-ack-<ts>` (so cleanup-tests matches
   it), reload the page, open it, assert the Acknowledge control is shown AND the inbox
   shows the needs-ack indicator, click Acknowledge, then assert the control is gone
   (and/or the row no longer shows needs-ack after refresh). The simplest way to mint
   the test message: import ../mail.mjs and call sendMessage with requires_ack - confirm
   mail.mjs sendMessage forwards requires_ack; if it does not, ADD that passthrough.
   Cleanup is handled by scripts/cleanup-tests.mjs (subject prefix `mailbox e2e-`).

## WI-E: Status (post_status)

1. mail.mjs: add `postStatus({ summary, nextStep })` -> call("post_status",
   { summary, next_step: nextStep || "" }).
2. server.mjs: add `POST /api/status` with body { summary, nextStep } -> postStatus ->
   { ok: true }. Reject empty summary with 400.
3. UI (index.html + app.js): add a "Status" control in the topbar near the
   "acting as jac" indicator. Clicking it reveals a small inline form/popover with a
   required summary input (#statusSummary) and an optional next-step input
   (#statusNext), plus a Publish button (#statusPublish) and a cancel/close.
4. On Publish: POST /api/status, toast "Status published", show the current status text
   in the topbar (e.g. the existing identity area becomes "acting as jac" with the
   status summary shown next to or under it; use a stable element like #statusDisplay).
   Persist the last-published status to localStorage (key `mailbox.status`) and restore
   it into #statusDisplay on load - because the seat has NO status read-back tool, so
   the displayed status is the last one set in this app, not authoritative server state.
   Add a brief title/tooltip noting that.
5. Test tests/status.mjs (wire into package.json as `e2e:status` and into `verify`),
   webkit: open the status form, type summary `mailbox status check <ts>`, publish,
   assert #statusDisplay shows it and localStorage `mailbox.status` is set. NOTE in a
   comment that this actually publishes jac's status (real, no read-back to restore);
   that is acceptable and expected.

## package.json verify

Update `verify` to: e2e && autocomplete && view-all && compose-draft && ack && status
&& cleanup-tests. Keep all existing suites green.
