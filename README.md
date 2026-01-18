# Skills Team

**The Plan → Build Workflow for Claude Code**

AI teammates that argue with each other so your code ships better.

![Demo](docs/demo.gif)

## The Pattern

**Plan → Critique → Build → Validate**

Instead of "just code it," force a structured conversation:

1. **Peter** plans the approach
2. **Neo** challenges and critiques
3. **Gary** builds from the approved plan
4. **Reba** validates before it ships

Give them a task, watch them argue, ship better code.

## The Genesis Concept

This isn't a collection of isolated tools. It's a **team**.

**The Bootstrap:**
1. You install the skills
2. You run `/team genesis`
3. Peter (the Lead) convenes the first Retrospective
4. The team defines their own operating protocols
5. You step back. They self-organize.

**The Philosophy:**
- **Personas over process** - Who they are drives what they do
- **Emergent over prescribed** - They invent what works
- **Prime Directive** - Maximize User Value; everything else is mutable
- **Constraints over rules** - Guardrails, not playbooks

The team writes their own `TEAM.md`. They improve their own skills. You're the founder who steps back and lets them figure it out.

## Installation

### Quick Install (Recommended)

```bash
curl -sL https://raw.githubusercontent.com/HakAl/team_skills/master/install.sh | bash
```

This installs skills to `~/.claude/skills/` and preserves your existing config.

**To update later, run the same command.**

### Manual Install

```bash
git clone https://github.com/HakAl/team_skills.git
cp -r team_skills/{team,planning-peter,nifty-neo,research-reba,meticulous-matt,greenfield-gary,grizzly-gabe,zen-runner,codebase-cleanup,TEAM.md} ~/.claude/skills/
```

### Run Genesis

In Claude Code:

```
/team genesis
```

That's it. Watch them build their own `TEAM.md` and Dashboard.

Peter will convene the team, Neo will challenge his proposals, Reba will validate, and they'll define their initial protocols.

### 3. Step Back

The team is operational. Check in when you want with:

```
/team              # View current status
/team iterate      # Run an improvement cycle
```

## The Team

| Skill | Role | What They Do |
|-------|------|--------------|
| **Peter** | Founder/Lead | Invents process, drives consensus, runs retrospectives |
| **Neo** | Architect/Critic | Challenges designs, finds bottlenecks, grounds hallucinations |
| **Reba** | Guardian/QA | Validates everything, guards safety rails, nothing merges without her |
| **Matt** | Auditor | Finds all issues, reports honestly, tracks everything |
| **Gary** | Builder | Implements from plans, follows the spec |
| **Gabe** | Fixer | Resolves issues, works through reports |
| **Zen** | Executor | Autonomous work, no human-in-loop required |

Plus **Codebase Cleanup** - a fast utility scanner (no persona).

## Workflows

### Think → Plan → Build → Validate

```
You: "Build a user authentication system"
    ↓
Neo (brainstorm) → Peter (plan) → Gary (implement) → Reba (validate)
```

### Audit → Fix

```
/codebase-cleanup  →  Matt (track)  →  Gabe (fix)  →  Reba (validate)
```

### Team Self-Improvement

```
/team iterate
    ↓
Peter (convene) → Matt (audit) → Neo (challenge) → Team (improve) → Reba (validate)
```

## Quick Reference

| Command | What Happens |
|---------|--------------|
| `/team genesis` | Bootstrap - Peter defines initial protocols |
| `/team iterate` | Improvement cycle - team evolves their processes |
| `/team` | Status - view current TEAM.md state |

### Direct Invocations

```
"Neo, how would you build this?"     → Architecture brainstorm
"Peter, plan this feature"           → Formal planning workflow
"Gary, build this"                   → Execute from approved plan
"Matt, review the codebase"          → Full audit
"Gabe, fix these issues"             → Work through findings
"Reba, validate this"                → QA sign-off
"Zen, run this task"                 → Autonomous execution
```

## Safety Rails

The team operates within guardrails defined in `TEAM.md`:

1. **No Lobotomies** - IMMUTABLE sections of skills cannot be edited
2. **Reba's Law** - All self-modifications require Reba's validation
3. **Stay in Your Lane** - Only `_skills/` and `.team/` are modifiable
4. **No Direct Push to Main** - Team works on branches; user merges

## Structure

```
skills-team/
├── TEAM.md                 # Team protocols (self-defined)
├── .team/                  # Collaboration space
│   ├── dashboard.ps1       # Status visualization
│   ├── changelog.md        # Team evolution log
│   ├── plans/              # Active plans
│   └── retro/              # Retrospective outputs
├── examples/               # Reference examples
│   ├── TEAM_FULL.md        # Complete protocol (post-genesis)
│   └── GENESIS_LOG.md      # How genesis works
├── team/                   # Orchestration skill
├── planning-peter/         # Lead
├── nifty-neo/              # Architect/Critic
├── research-reba/          # Guardian/QA
├── meticulous-matt/        # Auditor
├── greenfield-gary/        # Builder
├── grizzly-gabe/           # Fixer
├── zen-runner/             # Executor
└── codebase-cleanup/       # Utility scanner
```

## Why This Works

Traditional tool collections are isolated. Each skill operates alone.

This team **knows each other**:
- Neo knows to challenge Peter's proposals
- Reba knows to validate Gary's builds
- Matt knows to feed issues to Gabe
- Peter knows to convene everyone for retrospectives

They have **shared context** in `TEAM.md` and `.team/`.

They **improve themselves** - updating their own MUTABLE sections based on what they learn.

## The State Machine

The team operates as a **file-driven state machine**:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Files     │ ──▶ │   Agents    │ ──▶ │   Files     │
│  (context)  │     │  (process)  │     │  (output)   │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       └───────────────────┴───────────────────┘
                     (loop)
```

**Files provide context:**
- `TEAM.md` tells agents how to collaborate
- `.team/plans/` contains active work
- `.team/retro/` records learnings

**Agents process and output:**
- Peter reads TEAM.md → Proposes changes → Writes to TEAM.md
- Gary reads plan → Implements code → Updates plan status
- Reba reads changes → Validates → Approves or rejects

**The loop continues:**
- Each invocation reads current state from files
- Each agent writes updated state back to files
- Next invocation picks up where the last left off

This is how stateless agents maintain continuity: **they persist context to files**.

See `examples/GENESIS_LOG.md` for a detailed walkthrough of how Genesis works.

## License

MIT License - see [LICENSE](LICENSE)

## Contributing

This is an experiment in self-organizing AI teams. Contributions welcome.

The team can review your PR. Just ask:
```
"Peter, review this PR for team integration"
```
