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
  client.
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
- `scripts/check-connection.mjs` - step 0: prove the MCP client boots as jac.
- `tests/e2e.mjs` - webkit happy path (all sends self-targeted, so it never pings a
  real architect).
- `tests/autocomplete.mjs` - webkit: roster loads, unknown recipient is blocked, valid
  recipient passes (self-target only; never sends).
- `tests/view-all.mjs` - webkit: "View all" reveals a sender's messages (read-only;
  targets an already-read sender so it mutates no unread state).
- `tests/compose-draft.mjs` - webkit: draft autosave (reload restores fields, outside
  click does not dismiss, send clears the draft, Discard clears it). Self-targeted.
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
