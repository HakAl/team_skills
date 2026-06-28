# Mailbox substrate contract

Pinned 2026-06-25 for Operator Console Phase 2 work-item 1 against a read-only
copy of the live database at `/Users/home/.agent-comms/agent-comms.sqlite`.
The source DB could not be opened in place by `sqlite3` in this sandbox, so it was
copied to `/tmp/agent-comms-wi1.sqlite` and queried with
`file:/tmp/agent-comms-wi1.sqlite?mode=ro&immutable=1`.

This file is the source of truth for the Phase 2 mailbox read adapter. Do not
invent fields or resolver behavior beyond what is pinned here.

## A. Tables and field map

### `messages`

Confirmed schema:

| Field | Type | Notes |
|-------|------|-------|
| `id` | text primary key | Message id. Example: `msg_20260625_101047_bd317941`. |
| `from_agent` | text | Foreign key to `actors.id`. |
| `subject` | text | Rail subject and thread badge subject source. |
| `body` | text | Focus body; HTML escape before rendering. |
| `refs_json` | text | JSON array of `{path, summary}` objects. It is a refs display source, not a cycle resolver. |
| `priority` | text | Rail priority. |
| `requires_ack` | integer | Surface loudly while recipient status is open. |
| `created_at` | text | Rail sort key. |

### `message_recipients`

Confirmed schema:

| Field | Type | Notes |
|-------|------|-------|
| `message_id` | text | Foreign key to `messages.id`; primary key part. |
| `to_agent` | text | Foreign key to `actors.id`; primary key part. |
| `status` | text | Recipient-local status. Confirmed live values: `sent`, `read`, `acknowledged`, `closed`. |
| `read_at` | text | Set by `read`; may be null. |
| `acked_at` | text | Set by `ack`; may be null. |
| `closed_at` | text | Set by `close`; may be null. |
| `ack_response` | text | Optional response captured by `ack` or non-empty `close --response`. |

Recipient status is keyed by `(message_id, to_agent)`. Never infer a status for
one actor from another recipient row.

Live status counts in the copied DB:

| Status | Count |
|--------|------:|
| `acknowledged` | 98 |
| `closed` | 698 |
| `read` | 76 |
| `sent` | 229 |

### `message_threads`

Confirmed schema:

| Field | Type | Notes |
|-------|------|-------|
| `message_id` | text primary key | Message in the thread index. |
| `parent_message_id` | text nullable | Parent message. Null means root. |

Thread ancestry is recipient-independent. Walk only `message_threads` and
`messages`; do not join through `message_recipients` for ancestry.

### `actors`

Use `actors.display_name` to render `from_agent` and `to_agent` names when
available. Confirmed fields are `id`, `kind`, `display_name`, `system_class`,
`system_instance`, `project_root`, `runtime`, `spawn_json`,
`capabilities_json`, `team`, `role`, `last_seen_at`, `dispatch_cap`, and
`protected`.

### `dispatch_ledger`

Confirmed schema fields:

| Field | Notes |
|-------|-------|
| `dispatch_id` | Primary key for the worker dispatch row. Current rows use generated `dispatch_...` ids. |
| `parent_dispatch_id` | Present but null for all 397 live rows inspected. |
| `idempotency_key` | Ledger idempotency key. |
| `message_id` | Unique link to `messages.id`; all 397 live rows had a message id. |
| `thread_ref` | Dispatch thread reference. Current rows inspected match the trigger message id. |
| `spawn_handle` | Spawn handle, nullable. |
| `recipient_actor_id` | Worker or recipient actor. |
| `producer_actor_id` | Actor that produced the dispatch. |
| `originating_actor_id` | Originating actor. |
| `policy_name`, `policy_version`, `policy_issued_by` | Dispatch policy fields. |
| `expected_close_by` | Deadline or expected close timestamp. |
| `status` | Ledger status. Live counts: `closed` 382, `dlq` 14, `in_flight` 1. |
| `created_at`, `spawned_at`, `closed_at`, `dlq_at` | Timing fields. |
| `override_reason`, `failure_reason` | Failure and override context. |
| `observed_values_json` | JSON details such as adapter, pid, worker log, expected close, recipient close timestamp. |

Real current row:

| Field | Value |
|-------|-------|
| `message_id` | `msg_20260625_101047_bd317941` |
| `dispatch_id` | `dispatch_20260625_101047_a24c7c31` |
| `recipient_actor_id` | `engineering-codex-worker` |
| `producer_actor_id` | `engineering-architect` |
| `originating_actor_id` | `engineering-architect` |
| `status` | `in_flight` |
| `thread_ref` | `msg_20260625_101047_bd317941` |
| `created_at` | `2026-06-25T10:10:47+00:00` |
| `expected_close_by` | `2026-06-25T11:10:47+00:00` |

## B. Inbox query contract

The rail reads:

```sql
SELECT ...
FROM message_recipients mr
JOIN messages m ON m.id = mr.message_id
LEFT JOIN actors from_actor ON from_actor.id = m.from_agent
LEFT JOIN actors to_actor ON to_actor.id = mr.to_agent
LEFT JOIN dispatch_ledger dl ON dl.message_id = m.id
WHERE mr.to_agent = ?
  AND mr.status IN (...)
ORDER BY m.created_at DESC
```

The actor must be validated against `inbox_view_actors` before querying.

Default filter is open recipient states:

```text
sent, read, acknowledged
```

`closed` is hidden by default and shown only behind an explicit closed toggle.
This is not empty for real actors:

| Actor | Open count | Closed count | Total |
|-------|-----------:|-------------:|------:|
| `engineering-architect` | 20 | 0 | 20 |
| `human-jac` | 5 | 0 | 5 |

The default is also not noisy for the checked actors: `engineering-architect`
has 20 open rows and `human-jac` has 5 open rows in the live copy.

Unread pinning is `mr.status = 'sent'`. `requires_ack` pinning is
`m.requires_ack = 1 AND mr.status IN ('sent', 'read', 'acknowledged')`.

## C. Ledger to review-record resolver

Concrete resolver decision: no clean resolver from a mailbox `message_id` to a
Phase 1 review record exists in the live substrate.

The only reliable mailbox-to-ledger link is:

```text
messages.id -> dispatch_ledger.message_id
```

Given a mailbox `message_id`, load the optional ledger row where
`dispatch_ledger.message_id = messages.id` and display only the ledger context
available in that row:

```text
dispatch_id, status, recipient_actor_id, producer_actor_id,
originating_actor_id, thread_ref, expected_close_by, created_at,
spawned_at, closed_at, dlq_at, failure_reason, observed_values_json
```

Do not try to resolve `dispatch_ledger.dispatch_id` to
`local/dispatch/reviews/<dispatch_id>.json` for mailbox context. Recent ledger
rows carry generated worker dispatch ids, not the cycle review id. Example:
`msg_20260625_101047_bd317941` joins to
`dispatch_20260625_101047_a24c7c31`, while the governing review record for the
cycle is `operator-console-phase2.json`; the ledger row carries no
`operator-console-phase2` field, no parent dispatch id, and no refs entry.

Quantified against the 50 most recent inbox recipient rows:

| Category | Count |
|----------|------:|
| Recent inbox recipient rows inspected | 50 |
| Rows whose message joins a `dispatch_ledger` row | 20 |
| Rows that resolve from ledger dispatch id to a review JSON record | 0 |

Across the whole live ledger, 397 of 397 rows had `message_id`, but 0 ledger
`dispatch_id` values matched a review JSON filename in
`/Users/home/dev/agent-comms/local/dispatch/reviews`.

`messages.refs_json` remains a display-only list of referenced paths and
summaries. It does not generally carry cycle or dispatch ids. Live counts:
238 messages had non-empty refs, and 19 messages had both non-empty refs and a
ledger row.

## D. Thread root walk and rail badge

One root-walk algorithm is shared by the focus ancestry and the rail badge:

1. Start at the focused or rail message id.
2. Look up `message_threads.parent_message_id` for the current id.
3. If parent is null or no row exists, the current message is the root.
4. Otherwise move to the parent id and repeat.
5. Fetch root `messages.subject` for display.

The focus view renders the full ancestry from root to focused message. This walk
is independent of the viewed actor and must not filter by recipient.

The rail remains flat and sorted by `messages.created_at DESC`; it does not group
or collapse threads in Phase 2. For each row, show a thread-root badge:

```text
<root message id> <root subject>
```

Use a shortened subject in the UI, but keep the id exact. If the row is already
the root, the badge still points to that root.

Confirmed real thread:

| Depth | Message id | Parent id | Subject |
|------:|------------|-----------|---------|
| 0 | `msg_20260625_100336_9b063afc` | `msg_20260625_100056_14b9bc61` | `Re: Brief-check: operator-console-phase2 (Work-lane mailbox)` |
| 1 | `msg_20260625_100056_14b9bc61` | null | `Brief-check: operator-console-phase2 (Work-lane mailbox)` |

For rail row `msg_20260625_100336_9b063afc`, the badge root is:

```text
msg_20260625_100056_14b9bc61 Brief-check: operator-console-phase2 (Work-lane mailbox)
```

Current work item `msg_20260625_101047_bd317941` is a root row with null parent,
so its badge root is itself.

## E. Triage command contract

The web app must stage these commands only; it must not execute them:

```text
read <agent_id> <message_id>
ack <agent_id> <message_id>
ack --response '<ack-response>' <agent_id> <message_id>
close <agent_id> <message_id>
close --response '<close-response>' <agent_id> <message_id>
```

Confirmed parser signatures in `agent_comms/cli/commands/read.py`,
`ack.py`, and `close.py`:

| Command | Positional args | Optional flags |
|---------|-----------------|----------------|
| `read` | `agent_id message_id` | none |
| `ack` | `agent_id message_id` | `--response`, default `""` |
| `close` | `agent_id message_id` | `--response`, default `""` |

Bare `ack` and bare `close` are valid. The `--response` variants are
edit-before-run options, not required positional arguments.

## F. Brief over-claims found

The Surface section says that where a ledger row carries a dispatch or cycle id,
the console can resolve to the review record via the Phase 1 adapter. The live
rows inspected do not carry that clean review-record id. For Phase 2 mailbox
context, the pinned contract is therefore narrower: show the ledger row fields
listed in section C and degrade the review-record panel to "no review record
resolver available" unless a future substrate field explicitly supplies the
review record id.

The DoD line "resolved refs_json ledger context via the Phase 1 adapter" is also
too strong for the live substrate. `refs_json` is path and summary display data,
not the ledger or cycle resolver. The authoritative ledger link is
`dispatch_ledger.message_id = messages.id`.
