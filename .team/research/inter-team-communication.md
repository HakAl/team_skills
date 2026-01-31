# Research: Inter-Team Communication Patterns

**Bead**: _skills-73r
**Date**: 2026-01-31
**Researcher**: Engineering team (Peter led, Neo challenged)

---

## Research Question

How should autonomous AI agent teams communicate asynchronously across separate repositories?

## Context

Three teams exist (Engineering, Web Ops, QA & Compliance) in separate repos. Each runs only during interactive Claude Code sessions (not daemons). Need a protocol for cross-team work requests and cadence-triggered tasks.

---

## 1. Multi-Agent Communication Patterns

### Framework Survey

| Framework | Communication Model | Relevance |
|-----------|-------------------|-----------|
| **AutoGen** (Microsoft) | Conversational message-passing, chat-like exchanges | Low — assumes real-time |
| **CrewAI** | Role-based task delegation, shared context | Medium — similar role structure |
| **LangGraph** | Graph-based state machines, state transitions | Low — assumes single process |
| **MetaGPT** | Team simulation, shared memory pool | Medium — closest to our model |

### Four Canonical Patterns

From Confluent's analysis of event-driven multi-agent systems:

| Pattern | How It Works | Fit |
|---------|-------------|-----|
| **Orchestrator-Worker** | Central coordinator assigns tasks | No — we have peer teams |
| **Hierarchical** | Layered delegation | Partial — within teams only |
| **Blackboard** | Shared space agents read/write | **Best fit** |
| **Market-Based** | Agents bid on tasks | Overkill |

### The Blackboard Pattern

Our dispatch design IS a blackboard pattern. Key characteristics (Wikipedia, arxiv 2507.01701v1):
- Shared space where agents post and retrieve information
- No direct agent-to-agent communication — all flows through shared medium
- Agents decide autonomously whether to act on what they read
- Designed for "complex, ill-defined problems where the solution is the sum of its parts"

The `~/.team/dispatch/` directory is the blackboard.

### A2A Protocol (Google/Linux Foundation)

Agent2Agent Protocol (150+ organizations) defines how autonomous agents communicate as peers:
- **Agent Cards** — discovery documents (like team rosters)
- **Tasks** — fundamental work unit with lifecycle states
- **Messages** — communication turns
- **Artifacts** — results returned separately

HTTP-based, designed for networked agents. Conceptual alignment with our dispatch model (YAML frontmatter ≈ simplified Agent Card + Task hybrid).

**Source**: https://a2a-protocol.org/latest/

---

## 2. Maildir Pattern

### Background

Maildir (Daniel J. Bernstein, ~1995) solves crash-safe, lock-free message delivery on filesystems. "Two words: no locks."

Three-directory lifecycle:
```
tmp/   — message being written (never read by consumers)
new/   — delivered, not yet seen
cur/   — seen/processed
```

Delivery: write to `tmp/`, atomic `rename()` to `new/`. Reader moves `new/` to `cur/`.

### Prior Art: agent-message-queue

The `agent-message-queue` project (github.com/avivsinai/agent-message-queue) independently implements nearly our exact design:

```
.agent-mail/
  agents/
    claude/
      inbox/{tmp,new,cur}/
      outbox/sent/
      acks/{received,sent}/
```

Features: priority levels, message kinds (review_request, question, decision, status, todo), threading, acknowledgments. Format: JSON frontmatter + Markdown body.

**Key finding**: Independent convergence on the same design validates our approach.

### Recommendation

Adopt the `tmp/new/cur` lifecycle. It costs three subdirectories per team and gives crash safety + read tracking.

---

## 3. Event-Driven vs Polling

### Standard Advice

Literature (Confluent, HiveMQ, AWS) strongly favors event-driven for multi-agent systems:
- Reduced O(n²) connection complexity
- Real-time responsiveness
- Loose coupling via pub-sub

### Why Standard Advice Doesn't Apply

Our agents are:
- **Session-based** — exist only during interactive sessions
- **Not daemons** — no process runs between sessions
- **User-initiated** — human starts each session
- **Filesystem-bound** — no broker, no network services

**Polling on session start is correct** because:
1. No process to notify between sessions
2. Session start is the natural trigger (like checking email at work)
3. Latency is sessions (hours/days), not milliseconds
4. Zero infrastructure — no broker, no ports, no services

Microsoft multi-agent reference architecture acknowledges message-driven patterns introduce "complexity managing correlation IDs, idempotency, message ordering, and workflow state" — overhead that buys nothing in session-based models.

---

## 4. Cross-Team Coordination in Software Orgs

### What Works (Atlassian, engineering-ops.com)

- Shared visibility board — all teams see other teams' work
- Single prioritized backlog per team — never ask "which backlog?"
- Unifying metadata — consistent tags across projects
- Automation at boundaries — cross-team filing appears in target backlog

### Anti-Patterns (no-kill-switch.ghost.io)

| Anti-Pattern | Description | Our Mitigation |
|-------------|-------------|----------------|
| **Jira-as-communication** | Tickets as sole cross-team channel | Dispatches are notifications, not conversations |
| **Hot potato ownership** | Assigned = owned, kills shared responsibility | Dispatches are requests, receiver decides |
| **Ping-pong escalation** | Tickets bounced between teams | No reassignment mechanism |
| **Loss of visibility** | Individual views hide systemic problems | `ls ~/.team/dispatch/*/new/` shows all pending |

**Key insight**: Keep dispatches as notifications. If discussion is needed, it happens in-session via the user. Never let dispatches become conversation threads.

---

## 5. Filesystem-Based IPC

### The Gold Standard: Write-Then-Rename

1. Write complete message to temporary file in same directory
2. `rename()` to final path
3. `rename()` is atomic on all major OSes when same filesystem

This IS the Maildir pattern.

### Pitfalls

| Pitfall | Severity for Us | Mitigation |
|---------|----------------|------------|
| Partial reads (non-atomic write) | High | Maildir tmp→new pattern |
| Cross-filesystem rename | Low | ~/.team/ is one filesystem |
| NFS/network FS | Low | Local filesystem only |
| File lock contention | None | Maildir avoids locks |
| Stale tmp files | Medium | Cleanup: delete >1 hour old |
| Ordering | Low | Timestamp in filenames |
| Windows rename atomicity | Medium | Needs NTFS testing |

### Windows Note

`MoveFileEx` with `MOVEFILE_REPLACE_EXISTING` provides atomic-like rename on NTFS. Git Bash `mv` should work but needs verification on our specific setup.

---

## Conclusion

**Our dispatch design is validated.** It implements the blackboard pattern using Maildir conventions over a filesystem medium. Research confirms:

1. Blackboard is the right architecture for peer-team async communication
2. Filesystem-as-medium is time-tested for IPC
3. Polling on session start is correct for non-daemon agents
4. Notification-only dispatches avoid known cross-team anti-patterns
5. Independent convergence (agent-message-queue) validates the approach

**Three hardenings adopted**: Maildir lifecycle, timestamp filenames, session-start protocol.

**Full design**: `.team/designs/dispatch-protocol.md`

---

## Sources

### Multi-Agent Communication
- Confluent: Four Design Patterns for Event-Driven Multi-Agent Systems — https://www.confluent.io/blog/event-driven-multi-agent-systems/
- Blackboard System — https://en.wikipedia.org/wiki/Blackboard_system
- LLM Multi-Agent Blackboard Research — https://arxiv.org/html/2507.01701v1
- A2A Protocol Specification — https://a2a-protocol.org/latest/
- DataCamp: CrewAI vs LangGraph vs AutoGen — https://www.datacamp.com/tutorial/crewai-vs-langgraph-vs-autogen
- Microsoft Multi-Agent Reference Architecture — https://microsoft.github.io/multi-agent-reference-architecture/docs/agents-communication/Message-Driven.html

### Maildir Pattern
- Maildir — https://en.wikipedia.org/wiki/Maildir
- Maildir specification — http://qmail.org/man/man5/maildir.html
- agent-message-queue — https://github.com/avivsinai/agent-message-queue

### Event-Driven vs Polling
- Confluent: Future of AI Agents Is Event-Driven — https://www.confluent.io/blog/the-future-of-ai-agents-is-event-driven/
- AWS: Event-Driven Architecture for Agentic AI — https://docs.aws.amazon.com/prescriptive-guidance/latest/agentic-ai-serverless/event-driven-architecture.html
- Design Gurus: Event-Driven vs Polling — https://www.designgurus.io/course-play/grokking-system-design-fundamentals/doc/eventdriven-vs-polling-architecture

### Cross-Team Coordination
- Anti-Pattern: Jira as Cross-Team Communication — https://no-kill-switch.ghost.io/anti-pattern-jira-as-a-cross-team-communication-tool/
- Atlassian: Cross-Team Planning — https://www.atlassian.com/software/jira/templates/cross-team-planning
- Engineering Ops: Cross-Team Projects — https://engineering-ops.com/2020/07/how-to-manage-cross-team-projects-in-jira/

### Filesystem-Based IPC
- Opensource.com: IPC Shared Storage — https://opensource.com/article/19/4/interprocess-communication-linux-storage
- Things UNIX Can Do Atomically — https://rcrowley.org/2010/01/06/things-unix-can-do-atomically.html
