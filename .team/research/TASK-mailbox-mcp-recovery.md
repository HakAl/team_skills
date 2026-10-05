# Task: mailbox survives a dead agent-comms child

Project: `mailbox/` (buildless Node, one warm MCP stdio client to agent-comms as jac).

## Problem

`mail.mjs` caches one MCP client promise. The promise is reset only if the initial
connect fails. If the child server process dies later (crash, SIGKILL, agent-comms
upgrade), every subsequent call rejects until the operator restarts the server, and
the child's stderr is discarded (`stderr: "ignore"`), so there is nothing to read.

Also `npm run stop` is `pkill -f 'node server.mjs'`, which matches any process on
the machine whose command line contains that string.

## Outcome

- [ ] When the child transport closes or errors after connect, the next call creates
      a fresh client instead of failing forever (one reconnect per call, no retry loop).
- [ ] The child's stderr is captured to `mailbox/.mcp-child.log` (gitignored), not
      discarded, so a death leaves evidence.
- [ ] A test under `mailbox/tests/` proves recovery: kill the child, make a call,
      see it succeed. Runs against the live server like the other tests, or as a unit
      test of `mail.mjs` if that is cleaner.
- [ ] `npm run stop` only stops the server started from this directory (pidfile or
      port-based), never a pattern match across the machine.
- [ ] SKILL.md documents both behaviours. `npm run verify` stays green.

## Constraints

- Do not change the seat identity or launch policy in `config.mjs`.
- No new dependencies.
- No system temp paths anywhere (project hook blocks them).
