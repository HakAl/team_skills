# Handoff: Operator Console Phase 1 -- COMPLETE (post-land state)

**From:** engineering-architect (session 3, 2026-06-21)
**To:** the next engineering-architect session
**Status:** Phase 1 is BUILT, governed-reviewed, LANDED, VERIFIED, and observed
RUNNING live. One post-land decision remains (see section 4).

---

## 1. What shipped

Operator Console Phase 1 (Work back-gate): a local read-only FastAPI + HTMX
console that shows cycles awaiting land, their review evidence + real git diff,
stages the exact `cycle-land.sh` command (stage-and-reflect; no mutation
endpoint, no signer spawn), and reflects record state on a 5s poll.

All six work-items done. The cycle `operator-console-phase1` went the full
governed path and is **`state: verified`** (approved + signed by `jac`,
gate-merged, ff-merged into `_skills` master, verified). The console renders its
own landed cycle as verified -- the loop, closed.

## 2. Git state (IMPORTANT -- read before resuming)

- **`_skills` master HEAD: `fa3a2dd`** -- the verified Phase-1 tip (work-items
  2-6). The governed cycle ff-merged to here.
- **Branch `engineering/operator-console-phase1` HEAD: `22ec767`** -- ONE commit
  AHEAD of master: the post-land run/integration path + a bug fix (section 3).
  **Master does NOT yet contain `22ec767`.**
- Worktree: `/Users/home/dev/gh-public/_skills-operator-console`, clean except
  the expected untracked `.agent-comms/` (semaphore state; now in
  `_skills/.git/info/exclude` so `review gate-merge` sees a clean tree) and the
  gitignored local `config.json` / `.console.log`.

## 3. Post-land work in commit `22ec767` (on the branch, not yet in master)

- **Run/integration path** (the console can actually be served now):
  - `console/__main__.py` -- `python -m console --config <path> --host --port`
    (binds 127.0.0.1; lazy uvicorn import).
  - `scripts/console.sh {start|stop|status}` -- backgrounds via uv, pid+log,
    `lsof` port-fallback on stop. Verified start AND stop work; clean shutdown.
  - `README.md` -- run recipe.
  - `tests/test_e2e.py` -- a REAL over-the-socket e2e (subprocess server + httpx).
    `skipUnless(uvicorn)` so the no-network worker run skips cleanly.
- **Bug fix the e2e caught** (TestClient missed it): `/focus` returned **500**
  whenever a cycle's git evidence could not be read (unreadable worktree /
  missing commits) -- `load_evidence` let `subprocess.CalledProcessError` escape
  the route's `(KeyError, ValueError)` handler. Fixed with graceful degradation:
  `CycleEvidence.git_available`; the git reads are wrapped (catch
  `CalledProcessError`/`FileNotFoundError` only -- validation `ValueError` still
  surfaces); `_focus` renders a "git evidence unavailable" notice. Never 500,
  never 404 (#5 no-silent-failure).
- **Gate at `22ec767`: 18 tests green** (`uv run --with fastapi --with httpx
  --no-project --python 3.11 python -m unittest discover -s tests -t .`) PLUS the
  real uvicorn e2e green (`... --with uvicorn ... python -m unittest tests.test_e2e`).

## 4. THE open decision for resume (operator deferred this)

`22ec767` (run path + the 500 fix) is committed on the branch but NOT in master,
so a console run FROM master still 500s on an unreadable repo. To make it real,
pick one:
- **(a) Lightweight ff:** `git -C /Users/home/dev/gh-public/_skills merge
  --ff-only engineering/operator-console-phase1`. The commit only touches
  `operator-console/`, so the line-ending-dirty files in master (section 5) do
  NOT block `--ff-only`. Recommended -- this is post-release tooling + a bugfix.
- **(b) Govern it:** open a fresh review cycle for the fix and run it through
  brief-check -> dispatch -> review -> land. Heavier; choose if you want the
  bugfix on the record.

## 5. Housekeeping notes

- **The 30 "dirty" files in `_skills` master are NOT real edits** -- pure
  LF->CRLF line-ending noise (`git -C /Users/home/dev/gh-public/_skills diff
  --ignore-cr-at-eol` is empty). `git restore .` in master clears them safely.
  Plus untracked planning docs under `.team/research/*` and a `duet/` skill dir
  -- the operator's to keep/commit separately. None touch the console.
- **Running it:** `cd operator-console`, `config.json` already exists (gitignored,
  real paths: agent_comms_root, reviews_dir, db_path `~/.agent-comms/agent-comms.sqlite`,
  repo_roots air/pi/eng). `scripts/console.sh start` -> http://127.0.0.1:8765 ->
  `scripts/console.sh stop`. Live run rendered 78 real cycles ([Air]31/[Pi]6/[Eng]1/[other]40).
- **Minor tidy (optional):** `tests/test_e2e.py` emits a cosmetic
  `ResourceWarning` (unclosed subprocess stdout pipe in teardown). Harmless;
  close the pipe in tearDown if you touch it.

## 6. Phase 2 (still deferred, per the build brief)

Work FRONT gate (brief + dispatch-strategy approval), Research tab/funnel,
EXPAND/similarity, multi-DB. Not started. The substrate contract
(`docs/substrate-contract.md`) and the stage-and-reflect trust boundary carry
forward.

## 7. Cycle record + land mechanics (learned this session)

- The console is a `_skills` cycle but `cycle-land.sh` is agent-comms-centric
  (`$MAIN` defaults to agent-comms; STEP 4 runs agent-comms `tests/substrate`).
  Do NOT run it as-is for a `_skills` cycle. We landed via the ai-research
  pattern: `review approve` (tty) -> `review gate-merge` -> manual `git merge
  --ff-only` into `_skills` master -> `review verify`. (Decided NOT to generalize
  the land script -- only one team uses the full flow.)
- `review.py` auto-reverts a pre-approval cycle to `brief_revised` if the brief
  file sha changed since the last brief-check (`maybe_revert_for_brief_change`).
  That fired this session (the brief had db-config scrubs); resolved with a fresh
  codex brief-check (rev3). Expect it if the brief is edited mid-cycle.
- `review gate-merge` requires a clean `git status` on the cycle `repo`; the
  untracked `.agent-comms/` tripped it until added to `_skills/.git/info/exclude`.
