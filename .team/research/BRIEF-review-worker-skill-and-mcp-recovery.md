# Review brief: worker skill + mailbox MCP recovery (commit 206681a)

Role: independent reviewer. Read-only. Report only. Do not modify any file, do not
run git write commands, do not dispatch anyone. Reply on this thread, then close the
dispatch satisfied with delta=false.

## What to review (absolute paths, read with your file tools)

Repository: /Users/home/dev/gh-public/_skills (master, HEAD 206681a).

1. /Users/home/dev/gh-public/_skills/worker/SKILL.md (85 lines). A personal worker
   skill: routes defect vs feature, author-side hats (Peter scout/plan, Gary build),
   reviewer-side lenses (Neo on plans, Reba on changes) that must run in an external
   context, dialog file per task under .worker/. Lineage: tiger's AGENTS.md routing,
   the duet skill's partner dialog, the team persona skills reduced to lenses.
2. The mailbox change in the same commit (`git -C /Users/home/dev/gh-public/_skills
   show 206681a --stat` lists it): mailbox/mail.mjs, mailbox/server.mjs,
   mailbox/scripts/stop.mjs, mailbox/tests/mcp-recovery.mjs, mailbox/SKILL.md.
   Task it implements: /Users/home/dev/gh-public/_skills/.team/research/TASK-mailbox-mcp-recovery.md
   Context: @modelcontextprotocol/sdk 1.29.0 under mailbox/node_modules (client/stdio.js,
   shared/protocol.js) if you need to verify a claim about transport behaviour.

## Questions, in priority order

A. worker/SKILL.md: is the "author context never reviews its own work" rule
   enforceable as written, or merely stated? Where would a Claude session following
   it most likely drift (skip the review, review itself, misroute)? What is missing
   that tiger or duet had and this dropped? Is anything in it wrong for a Codex
   runtime following it (it is meant to be runtime-agnostic)?
B. mail.mjs call(): the reconnect decision is by error type (McpError with a code
   other than ConnectionClosed = live child, pass through; anything else = one
   reconnect). Find a case where that misclassifies: a transport failure that
   arrives as a coded McpError, or a live-child answer that arrives as a plain Error
   and causes an unnecessary child teardown.
C. Replay policy: list_*/read_message replayed, send/ack/close/status throw
   ConnectionLostError. Is read_message safe to replay (it marks read)? Is
   list_inbox replay safe if the first call succeeded server-side?
D. stop.mjs and the pidfile: any way `npm run stop` kills a process that is not the
   mailbox, or fails to stop one that is?
E. tests/mcp-recovery.mjs: which of its 18 assertions could pass while the feature
   is broken?

## Output format

- [!] blocker: <claim> at <path:line>; evidence; fix.
- [ ] suggestion: same shape.
- One paragraph: what you did NOT verify and why.
Keep it under 900 words. No praise.
