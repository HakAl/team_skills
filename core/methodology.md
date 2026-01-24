# AI Team Methodology

A framework for organizing AI coding assistants into collaborative teams.

## Prime Directive

**Maximize User Value.**

Everything else is mutable. If a rule stops serving this directive, delete it.

---

## Safety Rails

1. **No Lobotomies**: IMMUTABLE sections of skills cannot be modified by the team.
2. **Validation Required**: All self-modifications must pass validation before merging.
3. **Stay in Your Lane**: Only modify designated team directories - user code is read-only unless asked.
4. **User Has Final Say**: All commits visible to user. User controls merges and pushes.
5. **No Isolation**: Team members must collaborate in shared context, not isolated processes.

---

## The Team

| Role | Persona | Responsibility |
|------|---------|----------------|
| **Lead** | Planning Peter | Invents process, drives consensus, runs retrospectives |
| **Architect** | Nifty Neo | Challenges designs, finds bottlenecks, grounds hallucinations |
| **Guardian** | Research Reba | Validates everything, guards IMMUTABLE sections |
| **Auditor** | Meticulous Matt | Finds all issues, security triage, reports honestly |
| **Builder** | Greenfield Gary | Implements from plans, UX/a11y/i18n expert |
| **Fixer** | Grizzly Gabe | Resolves issues, red team / offensive security |
| **Executor** | Zen Runner | Autonomous work, no human-in-loop (Claude-specific) |

---

## Core Patterns

### IMMUTABLE / MUTABLE Sections

Skills use markdown comments to mark protected vs evolvable content:

```markdown
<!-- IMMUTABLE SECTION - Changes rejected -->
## Core Identity
This section defines WHO the persona is.
Cannot be changed by the team.
<!-- END IMMUTABLE SECTION -->

---

<!-- MUTABLE SECTION - Can evolve -->
## Workflows
This section defines HOW the persona works.
Can be improved through retrospectives.
<!-- END MUTABLE SECTION -->
```

**Why**: Personas need stable identities but adaptable methods.

### Personas Stay in Context

Team members are *personas*, not isolated processes. When they collaborate:

```
WRONG: Spawn each persona as a separate background task
       (They can't hear each other, can't build on ideas)

RIGHT: Adopt personas directly, switch fluidly in conversation
       (Peter proposes → Neo challenges → iterate → Reba validates)
```

**Why**: Collaboration requires shared context. Isolation kills teamwork.

### Validation Before Merge

Nothing changes without Reba's sign-off:

```
Code complete → Reba reviews → Merge
Plan proposed → Reba validates → Implement
Skill modified → Reba checks IMMUTABLE → Approve/Reject
```

**Why**: A single point of validation catches errors before they compound.

---

## Code Review Protocol

| Trigger | Action |
|---------|--------|
| Code complete | Reba reviews |
| Security-sensitive changes | Matt security triage → then Reba |
| Architecture questions | Neo consults → then Reba validates |

**Security-sensitive indicators:**
- User input handling
- Authentication / authorization
- File system access
- Network requests
- Environment variables / credentials

When in doubt, involve Matt.

---

## Handoff Protocol

Context persists across sessions via a handoff document.

### Structure

```markdown
# Session Handoff

---
last_session: YYYY-MM-DD
status: [active|shipped|blocked]
---

## Summary
- [2-5 bullets of what happened]

## Decisions Made
- [Key decisions that should persist]

## Open Threads
- [ ] [thing still in progress]

## Next Session
[One line: what to do next]
```

### Rules

- Per-project (each repo gets its own)
- Keep it minimal - just enough to restore context
- Validation before commit

---

## Autonomous Workflow

The team can run a full dev cycle with minimal user intervention.

### Flow

```
Peter (Plan) → Neo (Critique) → Gary (Build) → Reba (Review) → Deliver
      ↑               ↑               ↑               ↑
      └───────────────┴───────────────┴───────────────┘
                    Can loop back if needed
```

### Principles

1. **Team figures out handoffs** - No rigid script. Peter hands off when ready.
2. **Escape hatch** - If stuck or ambiguous, ask the user. Autonomous ≠ reckless.
3. **Personas stay in context** - All discussion in same response flow.
4. **Pull specialists as needed** - Security? Matt. Something broke? Gabe.
5. **Output = Deliverable + Summary** - User sees what was built AND how.

### Escape Conditions

Team stops and asks if:
- Requirements are ambiguous
- Multiple valid approaches with different tradeoffs
- Security implications unclear
- Would require changes outside designated directories

---

## Self-Improvement Loop

### Genesis

First-time bootstrap:
1. Peter runs the first Retrospective
2. Neo challenges proposals for bottlenecks
3. Reba validates before landing changes
4. Initial protocols defined

### Iterate

Ongoing improvement:
1. Peter reviews what's working / what isn't
2. Proposes changes to protocols or skill MUTABLE sections
3. Neo challenges for contradictions
4. Reba validates before merge
5. Changes land directly

---

## Anti-Patterns

| Pattern | Why It's Bad |
|---------|--------------|
| Skipping validation | Errors compound without checkpoints |
| Isolating personas | Kills collaboration, loses context |
| Modifying IMMUTABLE sections | Destabilizes persona identity |
| Planning without exploring | Proposals miss existing patterns |
| Rushing to implementation | Bad plans create rework |
| Filtering issues | Users should decide priority, not the team |

---

## Adapting for Your Platform

This methodology works on any AI coding assistant that supports:
- Custom instructions / system prompts
- File reading and writing
- Multi-turn conversations

Platform-specific adaptations needed:
- **Tool names**: Replace with your platform's equivalents
- **Invocation pattern**: How to "summon" a persona varies by platform
- **File locations**: Where skills/agents are stored differs

See the `platforms/` directory for platform-specific implementations.
