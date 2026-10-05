---
name: mailbox-e2e
description: >
  Run and verify the local jac mailbox: a buildless web UI over agent-comms that
  reads jac's inbox and sends/replies as jac (one warm MCP client, operator_mailbox
  policy). Starts the server, drives the webkit happy path (load inbox, compose+send,
  open, reply, see it land), and cleans up the self-targeted test messages.
  Invoke with "/mailbox-e2e".
---

# Mailbox e2e

A local web mailbox over the shared agent-comms instance. It acts as ONE identity,
jac (`01J00000000000000000000001`), via a single warm MCP client launched with
`WAKE_POLICY=operator_mailbox` (send + read only, no dispatch, no admin). Buildless:
Node backend + plain HTML/JS, no bundler. Webkit for e2e (chrome is not installed).

## Layout

- `config.mjs` - the one place the identity and launch are defined.
- `mail.mjs` - thin interface mirroring the MCP tools (`listInbox`, `readMessage`,
  `sendMessage`, `listActors`, `closeMessage`). One warm `@modelcontextprotocol/sdk`
  client. If the agent-comms child dies, the next call reconnects once: the cache is
  cleared by the SDK's close event (idle death) or by the failed call itself
  (in-flight death, whose rejection lands before the close event). A rejection that
  carries a JSON-RPC error code other than ConnectionClosed is an answer from a live
  child (unknown tool, bad args, timeout) and is surfaced unchanged, never a
  reconnect. A Zod validation error (a response arrived but failed the result schema) also
  passes through: the child is alive. Only read calls (`list_*`, `read_message`) are
  replayed after the reconnect; `read_message` is idempotent on the substrate (it
  moves `sent` to `read` once and keeps the first `read_at`). A `send_message`,
  `ack_message`, `close_message` or `post_status` that was in flight may already
  have landed, so it reconnects and throws `ConnectionLostError` telling the caller
  to reload and check before repeating. Known limit: a hung (not dead) child yields
  `RequestTimeout` on every call and is not torn down; restart the server.
  The child's stderr is appended at the OS level to `.mcp-child.log`
  (gitignored) along with spawn / closed / reconnect markers, so a death leaves
  evidence. `childPid()` is exported for the recovery test.
- `server.mjs` - Node JSON API + static file server. `/api/actors` returns the live
  roster (`rosterAvailable:true`); if the seat ever lacks the roster tool it degrades
  to `{actors:[], rosterAvailable:false}` and the UI falls back to free text.
- `public/` - the two-pane responsive UI (`index.html`, `style.css`, `app.js`).
  The inbox groups messages by sender (conversation accordion): newest per sender
  shown collapsed, click to expand the rest, unread badge per conversation. Your own
  id renders as "jac (you)". Note: the seat only returns messages addressed TO you,
  so a conversation shows the other party's messages, not your replies back.
  - Compose is an INLINE pane in the right reading area (a third state alongside the
    reader and placeholder), NOT a modal. There is no backdrop and no outside-click
    dismissal; closing is explicit (Close button). This is deliberate - an earlier
    modal dismissed on backdrop click and lost in-progress messages.
  - Compose drafts autosave to localStorage (`mailbox.compose.draft`, debounced):
    restored on load/open, cleared on a successful send, with an explicit "Discard
    draft" control and a "Draft saved" indicator. Work is not lost on reload or close.
  - Compose "To" is a chip/token input: each recipient is committed as a pill (Enter,
    comma, or blur; Backspace on empty removes the last; x removes one) and the trailing
    input autocompletes the CURRENT token against the live roster (`list_actors`), so
    EVERY recipient autocompletes, not just the first. Each chip is validated
    independently (green = valid, red = unknown); send is HARD-BLOCKED if any chip is
    unknown, on top of the server-side `_require_actor` check. Send posts a `toAgents`
    array.
  - "View all from <sender>" - an explicit button below an open message that reveals
    every message that sender has sent jac (snippets, scrollable, reply box stays).
    One-sided by design: the seat has no sent-items tool, so jac's replies are not
    shown. The caption says so.
  - Acknowledge - messages that need ack (`requires_ack` and not yet acknowledged) show
    an amber "ack" flag in the inbox (row + conversation); opening one shows an
    Acknowledge button with an optional response, backed by `ack_message` via
    `POST /api/ack`. Acking clears the flag.
  - Request ack - compose and reply both have a "Request ack" checkbox that sets
    `requires_ack` on the outgoing message. Compose also has a Priority select
    (normal / high / blocker); choosing high or blocker ticks Request ack if it is
    not already ticked. Both persist in the compose draft.
  - Priority - non-normal priority renders as a badge (HIGH amber, BLOCKER red) in the
    inbox row, the conversation head (highest in the group), and the reader meta line.
  - Filters + unread total - a filter bar under the inbox head (All / Unread / Needs
    ack) filters client-side over the loaded page. The inbox head shows the total
    unread count and the document title carries it as "(N) Mailbox - jac". The server
    page is 200 messages; when the page is full a note under the list says so.
  - Close - "Close message" in the reader meta line calls `close_message` via
    `POST /api/close` (empty response: the substrate requires a threaded reply for
    close text); the message leaves the inbox and the reader clears. Each expanded
    conversation offers "Close N read" to bulk-close its already-read messages after
    a confirm dialog. Closed is not deleted (`include_closed` still lists them).
  - Reply context - the reply form shows "To: <sender>"; when the message had other
    recipients a "Reply all (also ...)" checkbox appears, off by default. "Quote"
    inserts the open message prefixed with "> ". Reopening the same message keeps
    the reply text; opening a different one clears it.
  - Recipient tokens commit on Enter, comma, OR space (actor ids never contain
    whitespace).
  - Security: all message text is rendered via textContent (sender ids and subjects
    come from other agents and are untrusted). The server refuses POSTs that are
    not `application/json` or carry a non-loopback `Origin`, since every POST
    sends as jac.
  - Status (`post_status`) is BUILT but HIDDEN (`#statusWrap` has `hidden`): the
    operator_mailbox seat rejects `post_status` with "unknown agent" (jac is an actor,
    not an agent). Awaiting an agent-comms fix; remove `hidden` and re-add
    `tests/status.mjs` to `verify` once the seat can publish status.
- `scripts/check-connection.mjs` - step 0: prove the MCP client boots as jac.
- `scripts/stop.mjs` - `npm run stop` (honours `MAILBOX_PORT`). Reads
  `.server.<port>.pid` (written on listen via tmp + rename; removed by the server
  synchronously BEFORE it releases the port, so a successor's pidfile can never be
  deleted by its predecessor). Identity is not argv parsing: the pid must be the one
  LISTENING on host:port (`lsof`) and its command line must mention `server.mjs`; a
  pid reused after a crash is treated as stale and never signalled; if `lsof` is
  unavailable it fails closed (nothing signalled, pidfile kept, exit 1). SIGTERM,
  up to 5s for the SDK's own child teardown, then SIGKILL, up to 8s. Pidfile
  removal is a single synchronous read-compare-unlink against the exact bytes read;
  a successor publishing inside that microsecond window is the residual race. A
  server started BEFORE this change has no pidfile; stop that one by hand once
  (Ctrl+C in its terminal).
- `tests/e2e.mjs` - webkit happy path (all sends self-targeted, so it never pings a
  real architect).
- `tests/autocomplete.mjs` - webkit: roster loads, unknown recipient is blocked, valid
  recipient passes, a trailing space commits a chip (self-target only; never sends).
- `tests/view-all.mjs` - webkit: "View all" reveals a sender's messages (read-only;
  targets an already-read sender so it mutates no unread state).
- `tests/compose-draft.mjs` - webkit: draft autosave (reload restores fields, outside
  click does not dismiss, send clears the draft, Discard clears it). Self-targeted.
- `tests/ack.mjs` - webkit: mints a `requires_ack` self-message, verifies the inbox
  flag + Acknowledge control, acks it, verifies the flag clears. In `verify`.
- `tests/mcp-recovery.mjs` - standalone (no web server, imports `mail.mjs`): unit-checks
  the reconnect classifier against the SDK's error shapes; SIGKILLs the agent-comms
  child and calls in the same tick (in-flight path); kills it again and waits for the
  close event before calling (idle path); kills it a third time under a self-addressed
  `send_message` and expects `ConnectionLostError`, a fresh child, and zero copies of
  that message in the inbox (a replay would land one); a live-child unknown-tool call
  must not reconnect; asserts the spawn / closed / reconnect markers appended to
  `.mcp-child.log` by this run. In `verify`.
- `tests/triage.mjs` - webkit: mints a high-priority `requires_ack` self-message;
  checks unread total + title, priority badges, the three filters, reader To line and
  reply controls, Quote, the bulk "Close N read" tool, and closing from the reader.
  In `verify`.
- `tests/status.mjs` - webkit: status publish flow. NOT in `verify` (blocked: seat
  rejects `post_status`); kept for when the substrate supports it.
- `scripts/cleanup-tests.mjs` - close the self-test messages e2e leaves behind
  (matches the `mailbox self-test`, `mailbox e2e-*`, `mailbox compose-draft-*` markers).

## Run it

```bash
cd mailbox
npm install                       # @modelcontextprotocol/sdk + playwright
npm run check                     # step 0: connect as jac, list the real inbox
npm start                         # serve at http://127.0.0.1:4100
```

Open http://127.0.0.1:4100 - inbox on the left, message + thread + reply on the
right, Compose top-right, "acting as jac" always visible.

Stop it: press **Ctrl+C** in the server shell (clean - it shuts the MCP child down
and prints "Stopped."). If it is running in the background, `npm run stop`.

## Verify (e2e)

With the server running in one shell:

```bash
npm run verify                    # e2e + autocomplete + view-all, then cleanup
```

or run them individually:

```bash
npm run e2e                       # webkit: load -> compose+send -> open -> reply
npm run e2e:autocomplete          # webkit: roster + hard recipient validation
npm run e2e:view-all              # webkit: "View all from <sender>" reveal
npm run e2e:compose-draft         # webkit: inline compose draft autosave/restore
node scripts/cleanup-tests.mjs    # close the self-targeted test messages
```

A green run prints `PASS` and writes `tests/e2e-result.png`. The e2e sends only to
jac's own id; `cleanup-tests.mjs` closes anything whose subject matches the test
markers (`mailbox self-test`, `mailbox e2e-*`, `Re: mailbox e2e-*`) and nothing else.
`autocomplete` and `view-all` are read-only (no sends; view-all targets an
already-read sender), so they leave nothing to clean up.

## Notes / gotchas (learned building this)

- A human cannot launch the agent MCP server normally (`require_agent` gates on the
  `agents` table). The `operator_mailbox` wake policy is what allows the jac seat.
- `human-jac` is a DLQ sink, NOT the operator. The real jac is the ULID.
- The MCP function set has no recipient-independent thread tool, so thread ancestry
  is best-effort: parents that jac did not receive (e.g. messages jac sent) are
  skipped rather than shown.
- Opening a message marks it read (that is the read tool's behavior). Explicit triage
  (ack/close buttons) is the NEXT increment, not in this slice.
- `list_actors` is exposed read-only on the operator_mailbox seat (landed by
  agentcomms-architect, CONTRACT_VERSION 6). It returns the full actor roster because
  the seat runs as the human owner jac. If the app ever surfaces the roster beyond
  jac, ping agentcomms-architect for a minimal id/name projection tool. A client
  launched before the bump must be relaunched to see the tool (the server starts a
  fresh client each `npm start`, so this is automatic).
- "View all from <sender>" is one-sided on purpose: the seat exposes no sent-items
  tool, so it shows the sender's messages to jac, never jac's replies. A two-sided
  thread would need a sent-items capability added to the seat (an agentcomms ask).
