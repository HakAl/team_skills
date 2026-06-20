# Substrate contract (work-item 1 spike result)

Pinned 2026-06-20 against the real record
`agent-comms/local/dispatch/reviews/pi-satellite-verify-linkpaths-004.json`
(state `verified`) and `agent-comms/local/bin/cycle-land.sh`. These are the
ACTUAL field names and command signature. Do not invent fields; this file is
the source of truth for the read adapter (work-item 2).

## A. Review record field map (`reviews/<dispatch-id>.json`)

Authoritative for the Work back gate (land lifecycle). Confirmed top-level keys:

| Field | Type | Notes |
|-------|------|-------|
| `dispatch_id` | str | the cycle id; the route `{work_item}` param. Filename stem == this. |
| `state` | str | land lifecycle state. THE rail/awaiting key. See state set below. |
| `repo` | str | absolute worktree path. Lane tag derives from this (see D). |
| `target_branch` | str | source branch carrying the reviewed commit (here `master`). |
| `base_commit` | str(40) | diff base. Repo evidence = `git -C <repo> diff <base_commit>..<reviewed_head>`. |
| `reviewed_head` | str(40) | reviewed commit. |
| `approved_head` | str(40) | top-level mirror of `approval.approved_head`. |
| `approval` | obj or null | nested: `approved_head`, `approver`, `mechanism`, `signature`, `timestamp`. |
| `findings` | list[obj] | id, problem, impact, fix, loc, severity (`blocking`/`should`/...), status, resolution_note, respawn_note, resolved_by_dispatch_id. |
| `gate_runs` | list[obj] | check_id, argv_or_registry_name, branch, cwd, started_at, ended_at, exit_code, verdict (`pass`/`fail`), stdout_excerpt, stderr_excerpt, git_head, timeout_s, env_policy. |
| `respawn_count` / `max_respawns` | int | the "respawns" evidence (here 2 / 3). |
| `dod` | list[obj] | check objects: argv, check_id, claim, expected, id, required, scope, evidence. |
| `brief_checks` | list[obj] | brief_sha256, by, finding, timestamp, verdict. |
| `brief_path`, `brief_revision`, `brief_sha256` | | the brief identity. |
| `history` | list[obj] | full lifecycle timeline: `{event, timestamp, ...}`. |
| `verification` | obj | by, note, timestamp. |
| `skips` | list | empty here. |
| `trigger_closed` | bool | |
| `worker_reply` | str or null | |
| `schema_version` | int | `1`. |
| `created_at` / `updated_at` | str | ISO-8601 Z. |

### CONFIRMED corrections vs the build brief assumptions
- **`approval.signature` is NESTED** under `approval`, NOT top-level
  `approval_signature`. The brief was right; this is now verified against a real
  record. `approval` is `null` until approved.
- **Diff base is `base_commit`** (top-level). Use
  `git -C <repo> diff <base_commit>..<reviewed_head>` for the committed delta,
  PLUS dirty-tree evidence (`git -C <repo> diff`, `diff --staged`,
  `status --porcelain`) per the brief.
- **`repo` is in the record** -- the worktree path is read from the record, not
  guessed. Config `repo_roots` is the allowlist that BOUNDS which repos are
  permitted and supplies the lane tag mapping; the record says which one.

### Land state sequence (from `review.py`, confirmed)
Record `state` advances:
`drafted_brief` -> (brief-check rounds) -> ... -> `review_clean` ->
`human_approved` -> `merged` -> `verified`.
**`human_approved` and `merged` are REAL intermediate land states, not errors**
(confirmed in `agent_comms/review.py`). Rendering rules for the read adapter:
- **`review_clean`** = land-ready / **awaiting you**. `cycle-land.sh` refuses
  unless `state == review_clean`. Rail "awaiting land" filter is exactly this;
  pin these to the top.
- **`human_approved` / `merged`** = land IN PROGRESS (post-approve, pre-verify).
  Render as transient/in-flight, NOT done and NOT failed.
- **`verified`** = land complete (success). Key success off this, nothing else.
- Earlier `history` events: open -> brief-check -> mark-dispatched ->
  mark-executed -> gates -> (finding -> respawn -> ... -> resolve)* -> clean.
- A genuine halt = a cycle stuck in a pre-`verified` state past its land attempt,
  OR a worker DLQ in the ledger (section E). **DLQ is NOT a review state**
  (see E); never infer it from "absence of verified". Never interpret terminal
  stdout as the success signal (see C).

## B. Land command signature (`local/bin/cycle-land.sh`)

```
cycle-land.sh <dispatch-id> [approver]
```

- `approver` optional, defaults to `$USER`.
- Env: `AGENT_COMMS_MAIN` (default `/Users/home/dev/agent-comms`), `UV_CACHE_DIR`.
- Precondition: record `state == review_clean` (else fail-fast, nothing merged).
- `set -euo pipefail`; five steps:
  1. `review approve` -- reads **/dev/tty** directly (the real human gate; a
     non-tty invocation makes approve refuse). THIS is why the console needs a
     PTY helper, not a FastAPI shell-out.
  2. `review gate-merge` -- clean tree + HEAD==approved==reviewed + signature verify.
  3. ff-merge `target_branch` into main, guarded by SRC_TIP==reviewed_head before
     and POST_HEAD==reviewed_head after (no-op-merge footgun guard).
  4. full substrate suite from main (python 3.11 + 3.14).
  5. `review verify`.
- The console's PTY helper runs the **script path** (`local/bin/cycle-land.sh`),
  never the `land` shell alias. `approve` / `push_approval create` stay
  non-allowlisted.

## C. The cosmetic merge line (#4 pending item) -- spike finding

The build brief flags a PENDING question: is the operator-observed
`fatal: Needed a single revision` at STEP 3/5 a cosmetic display artifact or a
real halt? Spike evidence from this record:

- This cycle's record reached **`state: verified`** with a COMPLETE `history`
  (... gate-merge -> verify), `respawn_count` within bounds, no DLQ, no error
  recorded in the record body.
- `cycle-land.sh` is `set -e`: a real fatal at STEP 3 (ff-merge) aborts BEFORE
  STEP 4/5, so the record could not reach `verified`. It did. Therefore for THIS
  cycle the land completed; any `fatal:` line seen in the terminal did not
  prevent completion.

**Display contract (safe regardless of the formal #4 ruling):** the console
displays whatever `cycle-land.sh` emits verbatim (including any `fatal:` line)
AND surfaces the record `state` plainly. Success == `state == verified`
(record-authoritative). `human_approved` / `merged` are normal transient land
states (not a halt); a halt is a cycle stuck below `verified` past its land
attempt, or a ledger DLQ (section E), and must be visible. Never interpret
terminal text as the success signal. (Formal cosmetic-vs-distinct confirmation
remains agent-comms's to make; this contract does not depend on it.)

## D. Lane tag derivation

Lane comes from the record `repo` path matched against config `repo_roots`:
- `/Users/home/dev/ai-research...`  -> `[Air]`
- `/Users/home/dev/DefenseSector/prompt_injection...` -> `[Pi]`
- `/Users/home/dev/gh-public/_skills-operator-console...` -> `[Eng]` (the
  console's OWN dogfood cycle; REQUIRED so the console can show + land its own
  work per DoD #6). This is why `repo_roots` must include the build worktree.

A `repo` outside ALL configured roots renders under a neutral `[other]` group,
counted and surfaced, never silently dropped (invariant #5); APPROVE is enabled
only for configured roots. The reviews dir holds many out-of-lane records
(`agent-comms-dogfood`, etc.); they belong in `[other]`, not a known lane.

## E. DLQ + worker lifecycle (SQLite ledger, NOT the review record)

DLQ is a **dispatch-ledger** status, not a review state. Confirmed in
`agent_comms/dispatch_ledger.py:22`:
`DISPATCH_TERMINAL_STATUSES = {"closed", "dlq", "spawn_failed_message_landed"}`,
with `dlq_at` and `failure_reason` columns.

So "DLQ flagged" on the rail (DoD #1) is a **join**, not a review-record field:
- read the SQLite DB at `config.db_path` (resolves via
  `agent_comms.paths.db_path()` = `REPO_ROOT/data/agent-comms.sqlite`),
- key on the cycle's `dispatch_id` (== review record `dispatch_id`),
- flag when ledger `status in ('dlq', 'spawn_failed_message_landed')`; show
  `failure_reason` + `dlq_at`.

The ledger remains "supporting status only" for timing; for the **DLQ signal
specifically** it is authoritative (the review record has no DLQ state). Read it
read-only; it is one of the configured, bounded reads (no writes).

Join-key reliability: `dispatch_id` is a top-level review-record field present
from `open` onward and equals the filename stem (verified across records in
`review_clean` / `human_approved` / `verified`), so the reviews->ledger join is
reliable at every state including `review_clean`.

## F. Input handling (no path traversal)

The route param `{work_item}` reaches file reads (`reviews/<id>.json`) and shell
(`git -C <repo>`). Defenses (BOTH, defense-in-depth):
- validate against `^[a-z0-9][a-z0-9-]*$` (confirmed dispatch-id charset), and
- resolve ONLY by exact match against the enumerated existing `reviews/*.json`
  stems (an allowlist). Never interpolate raw input into a path or argv.
- `<repo>` for any `git -C` comes from the record, and must be a configured root
  (section D); never from request input. Unknown/non-matching id -> 404.
