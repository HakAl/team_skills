---
name: system-design-patterns
description: >
  Architectural decision frameworks and system review patterns. When to choose
  monolith vs services, SQL vs NoSQL, sync vs async. Structured approach to
  evaluating tradeoffs and spotting architectural mistakes before they ship.
metadata:
  author: nifty-neo
  version: "1.0"
  created: "2026-01-31"
---

# System Design Patterns

## Decision Frameworks

Architecture is decisions. Good architects make them explicitly.

### When Monolith vs Services

Start monolith. Split only when you have evidence for ALL three:
1. **Independent deployment need**: teams ship on different cadences
2. **Independent scaling need**: one component needs 10x the resources
3. **Fault isolation need**: one component's failure must not cascade

If you can't name the specific component for all three, stay monolith. "Microservices for flexibility" is a premature abstraction.

### When SQL vs NoSQL

| Signal | Choose SQL | Choose NoSQL |
|--------|-----------|-------------|
| Data has relationships | Yes — joins are free | No — you'll denormalize anyway |
| Schema is evolving rapidly | Migrations are friction | Schema-less helps |
| Need transactions across entities | ACID is a feature | Distributed transactions are pain |
| Read pattern is "get by key" | Overkill | Document/KV stores excel |
| Write volume is extreme | Sharding SQL is hard | Built for horizontal scale |
| Need full-text search | Bolted on (fine for most) | Elasticsearch/dedicated |

Default: Postgres. It handles 90% of workloads. Add specialized stores when Postgres can't.

### When Sync vs Async

- **Sync** (request/response): when the caller needs the result to continue
- **Async** (queue/event): when the work can happen later or the caller doesn't need the result
- **Hybrid**: sync for the user-facing response, async for side effects (email, analytics, notifications)

Rule: if the user is waiting, be sync. If the user doesn't care when it happens, be async.

### When to Cache

Cache when ALL of these are true:
1. Data is read far more than written (>10:1 ratio)
2. Data can be stale for some period without harm
3. Computing/fetching the data is expensive
4. You have a clear invalidation strategy

No invalidation strategy = no cache. Stale data bugs are worse than slow responses.

## Architectural Review Checklist

When reviewing a system design or plan:

### 1. Boundaries
- Are service/module boundaries at natural domain seams?
- Does each component have a single reason to change?
- Are boundaries enforced (API contracts, not shared databases)?

### 2. Data Flow
- Trace a request from user to storage and back. How many hops?
- Where does data transform? Is validation at the boundary?
- Are there circular dependencies?

### 3. Failure Modes
- What happens when each dependency is down?
- Is there retry logic? Is it idempotent?
- What's the blast radius of the most likely failure?
- Are there circuit breakers where needed?

### 4. Scale Bottlenecks
- What's the first thing that breaks at 10x load?
- Are there N+1 patterns (queries, API calls, file reads)?
- Is there a single writer bottleneck?
- Can the hot path be cached or precomputed?

### 5. Coupling
- Can you deploy component A without redeploying B?
- Can you test component A without standing up B?
- If you change A's internal implementation, does B break?
- Are shared libraries creating hidden coupling?

### 6. Security Surface
- Is auth at the edge or scattered through the codebase?
- Are secrets in config, not code?
- Is the principle of least privilege applied (services, DB users, IAM roles)?

## Common Architectural Mistakes

### Distributed Monolith
Services that must be deployed together, share a database, or fail together. You got the complexity of microservices with none of the benefits. Fix: merge them back or establish real boundaries.

### Premature Abstraction
Building a "plugin system" for one plugin. Creating an "event bus" for two events. Writing a "generic data layer" before you have two data sources. Fix: inline it. Abstract when you have three concrete examples.

### Shared Database
Two services reading/writing the same tables. Any schema change requires coordinating both teams. Fix: each service owns its data. Expose via API, not shared tables.

### Synchronous Chain
A -> B -> C -> D, all synchronous. Latency is the sum. Failure in D fails A. Fix: go async where the user doesn't need an immediate result. Add timeouts and fallbacks.

### God Service
One service that "orchestrates everything." It knows about every other service. It's the bottleneck for every change. Fix: distribute decision-making. Each service handles its own domain logic.

## Scalability Analysis

When asked "will this scale?", work through:

1. **Identify the hot path**: what gets called most? (usually <5% of code handles >95% of traffic)
2. **Measure, don't guess**: profile before optimizing
3. **Scale reads and writes separately**: reads are usually cacheable, writes usually aren't
4. **Look for state**: stateless components scale horizontally. Stateful ones need coordination.
5. **Check the database**: it's almost always the bottleneck. Indexes, query plans, connection pools.
