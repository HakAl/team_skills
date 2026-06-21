# Handoff: Operator Console Phase 1 build (mid-cycle)

**From:** engineering-architect (Claude session, 2026-06-20/21)
**To:** the next engineering-architect session (resume this build)
**Why this exists:** the prior session's context filled up. This is the durable
bridge (substrate invariant #7). Read this + the docs it points to and you can
resume without the prior conversation. Operator has paused to review before
proceeding; do NOT auto-dispatch work on resume -- confirm with the operator first.

---

## 1. What this is

Building **Operator Console Phase 1 (Work back-gate)** in an isolated worktree of
`_skills`, through the governed agent-comms dispatch-review cycle, dogfooding the
loop. You are the architect: plan, brief, dispatch `engineering-codex-worker`,
review its diff adversarially, commit NAMED files, run gates, and hand the
operator the terminal land. You do NOT hand-write the worker's code.

The single source-of-design docs (read in this order on resume):
1. This file.
2. `operator-console/docs/substrate-contract.md` (in the worktree) -- the pinned
   substrate field map, state set, lane/DLQ rules, input-validation, and the
   stage-and-reflect display contract. Build to THIS.
3. `/Users/home/dev/agent-comms/local/dispatch/briefs/operator-console-phase1.md`
   -- the CYCLE BRIEF (authoritative spec we build against; what `review open`
   is bound to). Plus `.dod.json` beside it.
4. `/Users/home/dev/agent-comms/docs/team_architect_runbook.md` -- cycle mechanics.
5. Background (rationale only): `_skills/.team/research/PHASE1-build-brief-work-backgate.md`,
   `PHASE1-eng-team-startup.md`, `MVP-operator-console.md`,
   `HANDOFF-phase1-engineering-architect.md`.

## 2. Two-repo layout (this confused the operator once -- internalize it)

- **agent-comms repo** (`/Users/home/dev/agent-comms`): the local governance tool.
  Holds the review CLI, the CYCLE BRIEF + dod.json + review record, `cycle-land.sh`.
  These live under its **gitignored `local/`**, so they never show in git status
  and never push. Paths:
  - brief:  `local/dispatch/briefs/operator-console-phase1.md`
  - dod:    `local/dispatch/briefs/operator-console-phase1.dod.json`
  - record: `local/dispatch/reviews/operator-console-phase1.json`
- **_skills worktree** (`/Users/home/dev/gh-public/_skills-operator-console`,
  branch `engineering/operator-console-phase1`): the CONSOLE CODE under
  `operator-console/`. This is the `review --repo` target and where the worker
  spawns. ff-merges into `_skills` master (LOCAL) at the very end.
- **Do not `git push` any of this.** It is all local (operator directive).

## 3. Current state (snapshot 2026-06-21)

- **Cycle `operator-console-phase1`**: state `dispatched`, respawn_count **1/3**,
  findings `[F1 blocking OPEN]`, brief_checks 3 rounds (codex r1, codex r2,
  cold-review -- all converged + recorded). repo + target_branch correct.
- **Worktree commits** (local only, no push):
  - `f74ccfa` work-item 2 (config + read adapter)
  - `46ea629` work-item 3 (shell + rail + focus)
  - (plus a docs commit landing this handoff + the stage-and-reflect substrate-contract revision)
- **Built + verified (gate green, 11 tests under py3.11):**
  - wi1 spike (substrate-contract.md)
  - wi2 `console/config.py`, `console/adapter.py`, `config.example.json`, tests
  - wi3 `console/app.py`, `static/htmx.min.js` (vendored), `static/app.css`, tests
- **F1 (blocking) is FIXED in code but the finding is still status=OPEN** in the
  record (resolved_by_dispatch_id already set to ...impl-wi2-r2 via the respawn).
  RESOLVE it at the final review (`review resolve --finding F1`), which needs
  state `execution_reviewed`.

## 4. Design decisions of record (do not re-litigate)

- **Approve path = STAGE-AND-REFLECT** (operator-directed pivot 2026-06-21,
  SUPERSEDES build-brief section 5's PTY helper). The web app is a read-only
  observer + intent-stager: it stages the exact `<agent_comms_root>/local/bin/
  cycle-land.sh <id>` command (copy-to-clipboard "Action Required" block), the
  OPERATOR runs it in their own terminal (passphrase on /dev/tty there), and the
  console REFLECTS record state on the 5s poll. NO POST/mutation endpoints, NO
  helper daemon, NO socket, NO stdout capture. Rationale: deletes daemon/PTY
  fragility; forward-compatible with the runbook's deferred separate-privilege
  approver (the terminal is that seam today). The brief/dod/substrate-contract are
  already revised to this.
- **"No external network" governs app RUNTIME, not dependency provisioning**
  (operator ruling). The gate may pull deps via uv.
- **Gate command** (the dod `extra` check, architect runs it):
  `cd operator-console && uv run --with fastapi --with httpx --no-project
  --python 3.11 python -m unittest discover -s tests -t . -v`. Stdlib unittest
  runner; fastapi/httpx provisioned by uv. Currently 11/11 OK.
- **Worker has NO network** (by design) so it cannot run the fastapi web tests or
  pull deps; it writes code + runs stdlib/compileall self-checks. THE ARCHITECT
  RUNS THE FULL GATE to verify. (Architect env HAS network + warm uv cache.)
- **Serial, not parallel.** One worker actor in one worktree; two concurrent codex
  dispatches would clobber the shared tree. Dispatch wi-by-wi, commit each.
- **Frontend is local/offline:** vendored `htmx.min.js` (committed) + hand-written
  `static/app.css` (no Tailwind build, no CDN). Copy-to-clipboard via a few lines
  of built-in `navigator.clipboard` JS (no library).
- **codex is IN-CERT at 0.141.0 exact** (agentcomms-architect confirmed; the
  0.131-0.135 range in the runbook was stale prose). Proceed.
- Substrate facts already pinned in substrate-contract.md: nested
  `approval.signature`; states `review_clean -> human_approved -> merged ->
  verified` (success only on verified); DLQ is a ledger join (dispatch_ledger,
  status in dlq/spawn_failed_message_landed), NOT a review state; lane from
  record `repo` vs config repo_roots {air,pi,eng} else [other]; input validated
  by regex `^[a-z0-9][a-z0-9-]*$` + allowlist-resolve against existing stems.

## 5. IMMEDIATE next step (pending operator OK)

Dispatch **work-item 4 (intent staging)** on the revised stage-and-reflect spec.
It MODIFIES the wi3 focus panel (does not add endpoints):
- In `console/app.py` `_focus(...)`: replace the `<form hx-post="/approve/...">`
  APPROVE button with an "Action Required" block showing the exact full-path
  `cycle-land.sh <dispatch-id>` command (already computed there) in a <code>/<pre>
  + a copy-to-clipboard button (a few lines of local vanilla JS in the shell or a
  small static/app.js, no library, no CDN).
- No POST routes. No helper. Keep everything html-escaped.
- Tests: assert the focus partial contains the exact staged command and the copy
  control, and that NO POST/approve route exists on the app.
- Worker can't run web tests; architect runs the gate.

Operator offered two options before dispatch: (1) dispatch wi4 now, or (2) one
quick codex brief-check on the revised approve-path spec first. CONFIRM which.

## 6. Remaining work after wi4

- **wi5 state reflection:** add `GET /focus/{work_item}/status` returning the
  state banner (success on verified; in-progress on human_approved/merged; loud
  halt on a stuck state or ledger DLQ) from the record, validated same as focus;
  focus panel polls it every 5s; rail reflects too. No stdout capture.
- **wi6 DoD gate:** ensure the suite asserts wi4/wi5 (staged command exact, no
  mutation endpoint, status reflects fixtures). Most of DoD #1/#2/#6/#7 is already
  covered by test_adapter + test_app.
- **Final governed review + land** (one time, wraps the whole console):
  1. `review mark-executed` (needs state `dispatched`; sets reviewed_head = the
     worktree HEAD -- so commit all wi4-6 NAMED files FIRST).
  2. Adversarial full-diff review; record any findings; RESOLVE F1
     (`review resolve --finding F1 --resolution-note ...`) and any others. Note:
     resolve needs state `execution_reviewed` (reach via `gates` or `finding`).
  3. `review gates --check extra` (runs the uv/unittest gate against the worktree).
  4. `review clean` -> state `review_clean` (land-ready).
  5. `review summary`; hand the operator the staged `cycle-land.sh
     operator-console-phase1` to run in THEIR terminal (the dogfood land).
  6. After they land: it goes human_approved -> merged -> verified; gate-merge +
     ff-merge into _skills master are handled by cycle-land.sh. Verify state.
- Report to operator: (a) spike result [done], (b) DoD pass + checklist,
  (c) time-to-Phase-1 via the loop vs by-hand estimate (the receipt).

## 7. Cycle mechanics + gotchas (learned)

- State machine (review.py): open->drafted_brief; brief-check->brief_reviewed;
  mark-dispatched->dispatched; mark-executed (needs dispatched, reads git_head as
  reviewed_head)->executed; gates (needs executed)->execution_reviewed; finding
  (needs executed/execution_reviewed, prints Fid)->execution_reviewed; respawn
  (needs execution_reviewed, increments respawn_count, escalates at >=max)->
  dispatched; resolve (needs execution_reviewed); clean->review_clean.
- `review finding` REQUIRES `--severity --loc --problem --impact --fix` (not
  `--note`). `review respawn` REQUIRES `--finding Fid --respawn-dispatch-id <id>
  --note`. The runbook's simplified examples are wrong on these args.
- **respawn_count cap is 3.** Use INFORMAL `dispatch_agent` re-dispatches for
  routine iteration (no finding/respawn); reserve formal finding/respawn for
  substantive blocking issues you want on the record. If the final review needs
  more rework rounds than the budget, raise `max_respawns` in the record
  deliberately (it is a multi-work-item cycle, not the single-change shape the
  cap assumes).
- **Commit NAMED files only**, never `git add -A` (the worktree has untracked
  `.agent-comms/` semaphore state at its root; never stage it). `git add
  operator-console/` is safe (a `.gitignore` for __pycache__ is in place).
- **No em/en dashes** in any committed file (operator hook blocks writes with
  them; this also bit a worker once). Use ASCII hyphen.
- Commit trailer: `Co-Authored-By: Claude Opus 4.8 (1M context)
  <noreply@anthropic.com>`. The `bd command not found` pre-commit warning is benign.
- **/mcp reconnect** only after a commit to the agent-comms REPO (stale_module
  guard). The brief/dod/record edits are under gitignored local/ = NOT repo
  commits, so no reconnect needed for those. agentcomms-architect holds the
  runbook-version scrub UNCOMMITTED and will ping before any agent-comms commit.
- Dispatch via MCP `dispatch_agent` (architect -> own-team worker, pattern A2);
  idempotency_key per dispatch (e.g. `operator-console-phase1-impl-wi4-r1`).
  `wait_for_reply` after. Worker replies on-thread, closes, exits.
- Contact: **agentcomms-architect** (live) via agent-comms send_message for
  substrate questions; it did the worker project_root re-point + cert ruling.

## 8. How to resume (concrete)

1. Read this + substrate-contract.md + the cycle brief.
2. `git -C /Users/home/dev/gh-public/_skills-operator-console log --oneline -5`
   and check `status --porcelain` (expect only `.agent-comms/`).
3. Re-run the gate to confirm green:
   `cd /Users/home/dev/gh-public/_skills-operator-console/operator-console &&
   uv run --with fastapi --with httpx --no-project --python 3.11 python -m
   unittest discover -s tests -t . -v` (expect 11 OK).
4. Confirm the record state: `python3 -c "import json;
   print(json.load(open('/Users/home/dev/agent-comms/local/dispatch/reviews/
   operator-console-phase1.json'))['state'])"` (expect `dispatched`).
5. Ask the operator: dispatch wi4 now, or brief-check the revised approve-path
   first? Then proceed per section 5.
