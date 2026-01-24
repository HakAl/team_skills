# Skills Team

**AI Team Methodology for Coding Assistants**

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

## The Team

| Persona | Role | What They Do |
|---------|------|--------------|
| **Peter** | Lead | Invents process, drives consensus, runs retrospectives |
| **Neo** | Architect | Challenges designs, finds bottlenecks, grounds hallucinations |
| **Reba** | Guardian | Validates everything, nothing merges without her sign-off |
| **Matt** | Auditor | Finds all issues, security triage, reports honestly |
| **Gary** | Builder | Implements from plans, UX/a11y/i18n expert |
| **Gabe** | Fixer | Resolves issues, red team / offensive security |
| **Zen** | Executor | Autonomous work, no human-in-loop (Claude only) |

Plus **Codebase Cleanup** - a fast utility scanner (no persona).

## How It Works

### Workflows

```
Feature Request → Neo (brainstorm) → Peter (plan) → Gary (build) → Reba (validate)

Code Audit → Matt (find issues) → Gabe (fix) → Reba (validate)

Self-Improvement → Peter (convene) → Neo (challenge) → Reba (validate) → Update protocols
```

### Invoke by Name

```
"Neo, how would you build this?"     → Architecture brainstorm
"Peter, plan this feature"           → Formal planning workflow
"Gary, build this"                   → Execute from approved plan
"Matt, review the codebase"          → Full audit
"Gabe, fix these issues"             → Work through findings
"Reba, validate this"                → QA sign-off
```

### The Genesis Concept

This isn't a collection of isolated tools. It's a **team**.

1. You install the skills
2. You bootstrap the team (platform-specific command)
3. Peter convenes the first Retrospective
4. The team defines their own operating protocols in `TEAM.md`
5. You step back. They self-organize.

The team writes their own protocols. They improve their own skills. You're the founder who lets them figure it out.

## Safety Rails

1. **No Lobotomies** - IMMUTABLE sections of skills cannot be edited
2. **Reba's Law** - All self-modifications require validation
3. **Stay in Your Lane** - Only designated directories are modifiable
4. **User Has Final Say** - User controls merges and pushes

---

## Installation

### Claude Code

```bash
# Quick install
curl -sL https://raw.githubusercontent.com/anthropics/team_skills/main/install.sh | bash

# Or manual
git clone https://github.com/anthropics/team_skills.git
cp -r team_skills/{team,planning-peter,nifty-neo,research-reba,meticulous-matt,greenfield-gary,grizzly-gabe,zen-runner,codebase-cleanup,TEAM.md} ~/.claude/skills/
```

Bootstrap the team:
```
/team genesis
```

### Codex CLI

```bash
git clone https://github.com/anthropics/team_skills.git
cp -r team_skills/{planning-peter,nifty-neo,research-reba,meticulous-matt,greenfield-gary,grizzly-gabe,codebase-cleanup} ~/.codex/skills/
cp team_skills/TEAM.md ~/.codex/AGENTS.md
```

The `SKILL.md` format is compatible. Invoke personas by name in your prompts.

Note: `zen-runner` is Claude-specific (depends on `zen-mode` CLI).

### Cursor / Windsurf

1. Copy persona content from `*/SKILL.md` files into your rules
2. Read `core/methodology.md` for the team patterns
3. Create rules that reference the team protocols

The personas are just prompts - they work anywhere.

### Other Platforms

The methodology is platform-agnostic. You need:
- A way to load custom instructions (the SKILL.md content)
- File read/write capability
- Multi-turn conversation

See [`core/methodology.md`](core/methodology.md) for the complete methodology documentation.

---

## Core Concepts

### IMMUTABLE / MUTABLE Sections

Skills use markdown comments to protect core identity while allowing evolution:

```markdown
<!-- IMMUTABLE SECTION -->
## Core Identity
Who the persona IS. Cannot change.
<!-- END IMMUTABLE SECTION -->

<!-- MUTABLE SECTION -->
## Workflows
HOW they work. Can evolve through retrospectives.
<!-- END MUTABLE SECTION -->
```

### Personas Stay in Context

Team members collaborate in shared context, not isolated processes:

```
WRONG: Spawn each persona as separate background task
       (Can't hear each other, can't build on ideas)

RIGHT: Adopt personas in conversation, switch fluidly
       (Peter proposes → Neo challenges → iterate → Reba validates)
```

### File-Driven State

The team persists context to files:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Files     │ ──▶ │   Agents    │ ──▶ │   Files     │
│  (context)  │     │  (process)  │     │  (output)   │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       └───────────────────┴───────────────────┘
                     (loop)
```

- `TEAM.md` - Team protocols (self-defined)
- `.team/handoff.md` - Session continuity
- `.team/plans/` - Active work

## Structure

```
skills-team/
├── core/                   # Platform-agnostic
│   └── methodology.md      # Complete methodology docs
├── TEAM.md                 # Team protocols
│
├── planning-peter/         # Personas (portable SKILL.md)
├── nifty-neo/
├── research-reba/
├── meticulous-matt/
├── greenfield-gary/
├── grizzly-gabe/
├── zen-runner/             # Claude-specific (uses zen-mode CLI)
├── codebase-cleanup/
│
├── .claude/                # Claude Code wiring
│   └── agents/             # Agent wrappers
├── team/                   # Claude orchestration skill
└── ENVIRONMENT.md          # Claude MCP recommendations
```

## Why This Works

Traditional tool collections are isolated. Each operates alone.

This team **knows each other**:
- Neo challenges Peter's proposals
- Reba validates Gary's builds
- Matt feeds issues to Gabe
- Peter convenes retrospectives

They have **shared context** in `TEAM.md`.

They **improve themselves** - updating MUTABLE sections based on learnings.

## License

MIT License - see [LICENSE](LICENSE)

## Contributing

This is an experiment in self-organizing AI teams. Contributions welcome.

The team can review your PR:
```
"Peter, review this PR for team integration"
```
