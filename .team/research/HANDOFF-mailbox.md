# Handoff: operator-console -> mailbox MVP (pivot + cleanup)

Date: 2026-06-27. Author: engineering-architect session.

## TL;DR

The "operator console" work was redirected to its real first slice: a **simple
local web mailbox** over the shared agent-comms instance, so `human-jac` can READ
and SEND messages (durable in the ledger) instead of operating from many chat
terminals. The earlier governance-heavy build toward the grand end-state was
abandoned and cleaned up. The live design doc to work from is
**`.team/research/mailbox-ux.md`** - it is not yet agreed; it has decisions + open
questions waiting on the operator.

## What happened (so we do not repeat it)

The operator came with the end-state vision (the four-gate operator console). Across
sessions the build sprinted toward that end-state through a governed worker-dispatch
cycle (briefs, DoD gates, substrate-contract spikes, dispatch-identity debates)
BEFORE the UX of the first small screen was ever settled. Result: a back-gate
governance view that the operator could not read and that did nothing for them. The
correction: settle the UX of ONE small screen first (in a durable file, not chat),
then plan, then build small and look at it running.

## Current state (after cleanup)

- **Abandoned cycle `operator-console-phase2`**: closed for good. Both its dispatches
  are `closed` (nothing in-flight). Brief + dod + review record moved to
  `agent-comms/local/dispatch/_abandoned/`. No active phase2 review/brief remains.
- **Branch `engineering/operator-console-phase2`**: deleted (was a8f4027). The
  worktree `_skills-operator-console` is parked back on
  `engineering/operator-console-phase1`.
- **Preserved**: the one useful artifact from that cycle, the verified substrate
  facts, copied to **`.team/research/mailbox-substrate-contract.md`** (schema, send
  API, status enum, thread walk, ledger-resolver findings). Reuse it for the build;
  do not re-derive.
- **Phase 1 console still exists** on master under `operator-console/` (the
  back-gate "cycles awaiting land" view + run scripts). It is a SEPARATE, working
  artifact, NOT the mailbox. The mailbox MVP may be a fresh small app or extend it -
  open (see mailbox-ux.md).

## Decisions of record (verified this session)

- **Integration surface = the agent-comms mail FUNCTION SET** (the MCP tools:
  `list_inbox`, `read_message`, `send_message`, later `ack`/`close`). Build against
  that, not raw DB pokes.
- **Sending is trivial**: `Mailbox.send_message(from_agent="human-jac", to_agents,
  subject, body, refs, ...)` is one Python call; `from_agent` is just an argument.
  The "identity blocker" raised earlier was wrong for a local single-user tool. (For
  remote/multi-user, identity would matter; not now.)
- **One shared agent-comms instance**: 13 teams, 36 actors, one DB, messages across
  all teams. So a single mailbox over it reaches every team - this IS the operator's
  "4 desktops to 1" goal, nearly free via an actor/team switcher.
- `human-jac` currently has only 5 received messages; **sending is how the operator
  joins the conversation graph.**
- **Process**: no worker cycles / governance machinery for this. Agree the UX file
  -> short build plan -> build the NOW slice small -> verify e2e with playwright ->
  iterate.

## Next step (do this)

1. Get the operator to settle **`.team/research/mailbox-ux.md`**: confirm/override
   the PROPOSED decisions (two-pane responsive; actor/team switcher; read+reply+
   compose first) and answer the three forks (Q1 transport: MCP-client vs underlying
   API behind an MCP-shaped interface [recommended]; Q2 always send as human-jac;
   Q3 playwright browser - chrome failed to launch here, needs `npx playwright
   install`).
2. Then add concrete build steps to the bottom of mailbox-ux.md and build the NOW
   slice: thin `mail` interface -> two-pane responsive UI -> live read/open/reply/
   compose -> playwright-MCP e2e happy path, captured as a reusable skill.
3. Do NOT build toward the four-gate end state yet; it is deferred on purpose
   (sketched at the bottom of mailbox-ux.md).

## Key files

- `.team/research/mailbox-ux.md` - the live UX agreement (work from here).
- `.team/research/mailbox-substrate-contract.md` - verified substrate facts.
- `agent-comms/local/dispatch/_abandoned/operator-console-phase2.*` - the closed cycle.
- `_skills-operator-console/operator-console/` (branch phase1) - the Phase 1 back-gate
  console (separate artifact).
