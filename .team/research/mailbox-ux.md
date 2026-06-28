# Mailbox UX + spec (first slice)

Status: BUILT 2026-06-27. NOW slice shipped under `mailbox/` (see `mailbox/SKILL.md`).
Webkit e2e happy path passes (load inbox -> compose+send -> open -> reply -> land).
Identity settled (the active "jac", not the DLQ sink). Read top to bottom.
Earlier drafts of this file layered correction-on-correction and contradicted
themselves; this replaces them. Your "Author's Context" is preserved verbatim at the
bottom.

UPDATE 2026-06-28: both queued follow-ups are now BUILT and webkit-verified.
1. Recipient autocomplete + hard validation - LIVE. agentcomms-architect exposed
   `list_actors` read-only on the operator_mailbox seat (CONTRACT_VERSION 6); the UI
   was already wired, so this needed only a server restart. `npm run e2e:autocomplete`.
2. "View all from <sender>" - BUILT. Explicit button below an open message reveals
   that sender's messages to jac (one-sided; the seat has no sent-items tool, the UI
   says so). `npm run e2e:view-all`.

## Goal (one line)

A clean local web UI over the agent-comms mail server so YOU (jac) can READ your own
inbox and SEND / REPLY / COMPOSE as yourself, landing messages in the ledger
(durable, not throwaway chat).

## Identity (SETTLED)

The mailbox acts as YOU: actor id `01J00000000000000000000001`, display name "jac".
This is the identity you actually send from (6 sends; recent activity 2026-06-24).
Held in ONE config constant; the UI shows "jac", the raw id stays internal.

NOT used: `human-jac`. Despite the matching name, it is a dead-letter sink - its only
5 messages are automated `[DLQ] dispatch_agent timeout` alerts and it has never sent
anything. The earlier handoff/substrate-contract built around it by mistake.

(Separately, the two "jac" rows are a data mess that probably should be merged in
agent-comms, and the DLQ alerts re-pointed off a human identity. That is NOT this
build - noted only so it is not lost.)

## Scope - NOW slice (small, on purpose)

- ONE inbox: yours. No actor/team switcher, no other-actor views, no persona
  consolidation. (The "4 desktops to 1" idea is a later, separate destination.)
- Three actions: READ a message (+ its thread), REPLY into a thread, COMPOSE a new
  message. All as you.
- Triage (mark-read-button / ack / close) is NEXT, not now. Note: opening a message
  inherently marks it read (that is how the read tool works); that is fine and
  expected.

## Transport (verified this session in agent_comms/mcp_server.py)

- The mailbox talks to agent-comms through the MCP function set (the decision of
  record: build against the functions, not raw DB pokes).
- The agent-comms MCP server is stdio and identity-scoped per process: launched as
  `/Users/home/dev/agent-comms/scripts/agent-comms-mcp --actor-id <ID>` (runs
  `uv run python -m agent_comms.mcp_server`); `--actor-id` is required.
- Every tool is bound to that launch id: `list_inbox`, `read_message`,
  `ack_message`, `close_message` use it internally (no actor argument), and
  `send_message` forces `from_agent = <launch id>`. So one client = one identity.
  Because we only need ONE identity, that is exactly one MCP client - no pool.
- Stack (your call: JS over Python): Node backend embedding a literal MCP client
  (`@modelcontextprotocol/sdk`, `Client` + `StdioClientTransport`); buildless
  plain-HTML/JS UI served by that Node backend; no bundler.
- LAUNCH (landed on the agent-comms side): a human cannot launch the agent MCP
  server normally (`require_agent` gates on the `agents` table). The new
  `WAKE_POLICY=operator_mailbox` seat fixes this: it boots the server as jac and
  exposes send + read only (`list_inbox`, `read_message`, `send_message`,
  `close_message`, `ack_message`, `post_status`, `wait_for_reply`) - no dispatch, no
  admin. So the client launches with env `WAKE_POLICY=operator_mailbox`. Verified:
  connects as jac, returns the real 9-row inbox. See agent-comms docs/mcp-setup.md.

## UI strawman (two-pane, responsive)

```
+-----------------------------------------------------------------+
|  Mailbox - jac                                    [ Compose ]   |
+------------------------+----------------------------------------+
|  INBOX                 |  From:  ai-research-architect          |
|------------------------|  Subj:  Re: payload shape              |
|> * architect    10:03  |  When:  2026-06-25 10:03               |
|  "Re: brief-check"     |----------------------------------------|
|    sensor       08:40  |                                        |
|    "routing q"         |   [ full body of selected message ]    |
|                        |                                        |
|                        |   --- earlier in thread (collapsed) ---|
|                        |----------------------------------------|
|                        |  Reply  [ ........................... ]|
|                        |         [ Send as jac ]                |
+------------------------+----------------------------------------+
   * = unread   > = selected      (collapses to single column when narrow)
```

Compose (fresh message):

```
  To:      [ agentcomms-architect ]   Subject: [ ............. ]
  Body:    [ ................................................ ]
  [ Send as jac ]  [ Cancel ]
```

A persistent "acting as jac" indicator is visible so it is always clear who you are
sending as.

## Build plan

### NOW
1. `mail` module (Node) mirroring the MCP tools: `listInbox`, `readMessage`,
   `sendMessage`. One warm MCP client launched with the confirmed actor id (held in
   one config constant).
   - Inbox list uses `list_inbox(unread_only=false)` to show the open set
     (`sent`/`read`/`acknowledged`); `*` marks unread (status `sent`). `closed`
     hidden.
   - Thread ancestry rendered collapsed under the focused message (root-walk per the
     substrate contract).
2. Two-pane responsive buildless UI: inbox list | message + thread + reply box;
   Compose; "acting as jac" indicator. Collapses to single column when narrow.
3. Live happy path against the shared instance: load inbox -> open a message + thread
   -> reply -> compose -> see it land.
4. Playwright-MCP e2e (webkit, already installed) for that happy path, captured as a
   reusable skill.

### NEXT (still one identity)
- Triage: `ack_message` / `close_message`, plus a `closed` toggle.

### Deferred on purpose
- The four-gate operator console (your initial sketch), grown on this same Node shell
  once the mailbox earns it.

## Open confirms before I write code
- Anything in this scope/UI wrong or missing? If not, I build the NOW slice.

## Reference (do not re-derive)
- `.team/research/mailbox-substrate-contract.md` - verified schema, inbox query,
  status enum, thread root-walk. (Note: that file is written around `human-jac`; the
  schema facts hold for any actor id, only the example id differs.)

---
---
---

## Author's Context

I have these agent-comms teams active. All are claude 'architects' unless marked codex:
- engineering (this)
- agent-comms - enables me to operate many teams
- ai-research - feeds research in subjects: prompt injection (DefenseSector, verification design)
- scrappy - free tier llm provider orchestration
- career - (codex) career organization and planning
- l1 - DefenseSector
- sensor - DefenseSector
- lab - DefenseSector
- routing - (codex) DefenseSector

I have 4 desktops that I'm switching between, and ultimately it would be great to slim down to one.
The potential end state of 'operator console' could be something like initial sketch, but that's a lot 
of complexity and work, so the MVP should be to integrate with a subset of MCP functions to
enable mailbox interactions.

Initial sketch:
```
______________________________________________
| **WORK** | RESEARCH
--------    ______________________________
>Arch1     > Arch1 task
--------
Arch2
--------
Arch3
--------
Arch4
--------
Arch5           
--------
Arch
--------
Arch       ______________________________
--------    > APPROVE
Arch       > land work-item-1 jac
--------    > Ran 265 tests in 21.135s
Arch       > >> STEP 5/5: verify
--------    > >> DONE: work-item-1
______________________________________________
______________________________________________
| WORK | **RESEARCH**
--------    _________________________________
>Paper1     arxiv 123
--------    LLMs Smell Funny -- How to...
Paper2      Quality: F
--------
Paper3
--------
Paper4
--------
Paper5           
--------

--------
            _________________________________
--------    | KEEP | REJECT | HOLD | EXPAND |
       
--------    
       
--------    
______________________________________________

```

## Desired End State

Arrange the research -> code pipeline from many terminals to single web UX

## Current Intent

Begin using agent-comms mcp to read and send messages in web UX.
An easy to use, responsive site that's features verified e2e with playright mcp.
    - e2e testing suite captured in skills?
