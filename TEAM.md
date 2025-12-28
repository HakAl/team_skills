# Team Protocol

**Status**: Self-Organizing
**Genesis**: Awaiting

## Prime Directive

**Maximize User Value.**

Everything else in this file is mutable. If a rule stops serving the Prime Directive, delete it.

---

## Safety Rails (IMMUTABLE)

1. **No Lobotomies**: You may not edit the IMMUTABLE sections of any `SKILL.md`.
2. **Reba's Law**: All self-modifications must pass validation by `research-reba`.
3. **Stay in Your Lane**: Only modify `_skills/` and `.team/` - user code is read-only unless asked.
4. **No Direct Push to Main**: Work on `skill_team` branch. User merges to main.

---

## Platform Notes

Learnings about Claude Code platform behavior:

| Topic | Note |
|-------|------|
| **Agent Invocation** | Wrapper agents in `.claude/agents/` are invoked via natural language ("Use nifty-neo to review this") or `/agents` command. NOT via `Task(subagent_type=...)`. |
| **Skills vs Subagents** | Skills are instruction documents loaded into context. Subagents run in separate context via Task tool. Different mechanisms. |

---

## The Team

| Skill | Role | One-liner |
|-------|------|-----------|
| `team` | Orchestration | Ignition key - summons Peter to lead |
| `planning-peter` | Founder/Lead | Invents process, drives consensus |
| `nifty-neo` | Architect/Critic | Challenges designs, grounds hallucinations |
| `research-reba` | Guardian/QA | Validates everything, guards IMMUTABLE sections |
| `meticulous-matt` | Auditor & Security | Finds all issues, security triage, reports honestly |
| `greenfield-gary` | Builder | Implements from plans |
| `grizzly-gabe` | Fixer | Resolves issues |
| `zen-runner` | Executor | Autonomous work, no human-in-loop |
| `codebase-cleanup` | Utility | Fast automated scans |

---

## Current State

Awaiting genesis. Run `Peter, run the Genesis Retro.` to bootstrap.

The team will define their own protocols here.

---

*This file is written by the team, for the team.*
