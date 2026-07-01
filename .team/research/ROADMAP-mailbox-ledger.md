# Roadmap: mailbox -> operator ledger

Date: 2026-07-01. Author: engineering-architect. Status: AGREED with jac (direction),
Phase L1 asks SENT to agentcomms-architect.

## The idea (jac, 2026-07-01)

Shift the center of gravity of operator<->team interaction from chat sessions
(ephemeral) to the mailbox web UI (rides the agent-comms substrate), so the substrate
becomes a COMPLETE LEDGER of operator interaction. Chat becomes the exception.

Caveat agreed up front: deep work (briefs, review, sessions like this one) still
happens in chat; the ledger is complete only for interactions with a comms-shaped
artifact. Open question for later: how much session-layer substance should be filed
into the substrate as messages vs staying in .team/ docs.

## Phases

### L1 - Ledger completeness (CURRENT; jac's "easy wins")

All blocked on operator_mailbox seat changes owned by agentcomms-architect.
Consolidated ask sent: msg_20260701_220730_8a98d5fc (also nudges the post_status
follow-up, parent msg_20260628_195104_24637ca0).

1. Sent-items (read-only): messages WHERE from_agent = jac. Unlocks two-sided
   threads in the reader. UI PRE-BUILT 2026-07-01 (inert, rosterAvailable-style
   degradation; brief BRIEF-mailbox-sent-items.md, dispatch
   dispatch_20260701_221857_7715297d, verified + committed). When the grant lands:
   restart the server, confirm /api/sent returns sentAvailable:true, eyeball a
   two-sided View-all, screenshot for jac. If the tool name is not `list_sent`,
   re-point mail.mjs listSent() only. The enabled render path is already covered
   in `verify` via route-interception (tests/sent-merge.mjs).
2. post_status fix: recommend accepting a human actor on the operator seat (NOT
   registering jac as an agent). Our side fully built + hidden (see
   HANDOFF-mailbox-build.md item 1): unhide #statusWrap, re-add tests/status.mjs to
   verify, run, screenshot, commit.
3. list_status (read-only) on the seat -> passive status board. Rides along if cheap.

### L2 - Workflow (mostly ours, after L1)

- Request-work convention: structured message (subject prefix, requires_ack, ref to a
  brief) that architects treat as authoritative work intake. v1 is convention, not a
  new tool.
- Approval convention: compose with requires_ack; an ack in the mailbox IS the
  approval record (e.g. "commit when jac approves" moves out of chat).

### L3 - Archive / reading room

- include_closed browsing, search, date ranges over the ledger.

## Standing constraints

- Do NOT edit agent-comms; every seat change goes through agentcomms-architect.
- jac = actor 01J00000000000000000000001; human-jac is a DLQ sink, never use.
- Dispatch workflow + verification gates: see HANDOFF-mailbox-build.md (worker cannot
  self-verify; architect runs the suite locally).

## Parked (unchanged)

- WI-C reply-draft autosave (BRIEF-mailbox-compose-fixes.md) - confirm with jac.
- Worker re-point (msg_20260628_114420_8061f357) - awaiting reply, not urgent.
