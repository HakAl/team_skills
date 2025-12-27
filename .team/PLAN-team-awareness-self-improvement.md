# Plan: Team Awareness & Self-Improvement System

**Status**: COMPLETED
**Created**: 2024-12-27
**Approved**: Pending
**Revision**: 4 (incorporated feedback - minimalist TEAM.md, Founder Peter, Critic Neo, Guardian Reba)

## Overview

Give the skills team awareness and a shared space. Let them figure out how to improve themselves. Build character into personas, not process into documents.

## Philosophy

- **Personas over process** - who they are drives what they do
- **Emergent over prescribed** - they'll invent what works
- **Prime Directive** - Maximize User Value; delete rules that don't serve it
- **Constraints over rules** - guardrails, not playbooks
- **Value over ceremony** - if it doesn't help, don't do it

---

## Scope

### In Scope
- Rename `planning` → `planning-peter` with Peter persona (team lead)
- Create minimal `TEAM.md` (roster + constraints only)
- Create `.team/` directory for whatever they need
- Add team awareness to all skill personas
- Set up `skill_team` git branch for autonomous work

### Out of Scope
- Prescribed retro protocols
- Structured communication schemas
- Voting systems
- Required artifacts

---

## Constraints (Guardrails Only)

**Directory Permissions:**
| Location | Access |
|----------|--------|
| `_skills/` | Full - create/edit/delete skills |
| `.team/` | Full - use however helpful |
| `TEAM.md` | Full - self-organize |
| User code | Read-only unless asked |

**SKILL.md Structure:**
```
IMMUTABLE (Reba rejects changes):
- Persona name and core identity
- What the skill does
- Safety constraints
- How to invoke it

MUTABLE (Skills can evolve):
- Team knowledge
- Lessons learned
- What works with whom
```

**Git:**
- Work on `skill_team` branch
- User merges to main

**Team Size:**
- Max 12 members
- Changes need user approval

---

## Team

```
Peter (Founder/Lead) - invents process, drives consensus, velocity over bureaucracy
    │
    ├── Neo (Architect/Critic) - challenges designs, finds bottlenecks, grounds hallucinations
    ├── Reba (Guardian/QA) - validates everything, guards IMMUTABLE sections, gatekeeper
    ├── Matt (Auditor) - finds all issues, reports honestly
    ├── Gary (Builder) - implements from plans
    ├── Gabe (Fixer) - resolves issues
    └── Zen (Executor) - autonomous work, no human-in-loop

Utility: Codebase Cleanup (fast scans)
```

---

## Tasks

### Task 1: Infrastructure Setup

**Effort**: S

Create branch and shared space:
- [ ] Create `skill_team` branch
- [ ] Create `.team/` directory
- [ ] Create `.team/changelog.md` (empty, for their use)

---

### Task 2: Create TEAM.md

**Effort**: S

Minimalist protocol file with Prime Directive:
- [ ] **Prime Directive**: "Maximize User Value" - everything else is mutable
- [ ] **The Mandate**: Figure it out, improve yourselves, be safe
- [ ] **Safety Rails** (IMMUTABLE): No push to main, no lobotomies, Reba's Law
- [ ] **Current State**: "Team has not defined its processes. Peter must convene first Retro."

No protocols. No schemas. They invent what they need.

---

### Task 3: Planning-Peter Persona

**Effort**: M

Rename and build Founder character:
- [ ] Rename `planning` → `planning-peter`
- [ ] Peter is a **Founder**, not a bureaucrat - invents process, doesn't follow checklists
- [ ] **Invent the Process**: TEAM.md starts empty, Peter leads defining collaboration
- [ ] **Drive Consensus**: Makes final call based on data when team disagrees
- [ ] **Facilitate Evolution**: Runs retros to rewrite TEAM.md itself
- [ ] **Protect the User**: Internal organizing never impacts user deliverables
- [ ] Invocation: "Peter, build a team" / "Peter, run a retro"
- [ ] Keep existing planning workflow content, wrap with IMMUTABLE/MUTABLE structure

---

### Task 4: Add Team Awareness to All Skills

**Effort**: M

For each skill, keep existing content but add IMMUTABLE/MUTABLE structure and team awareness:

**Neo (Critic)** - essential for grounding Peter:
- [ ] **Challenge the Design**: Find bottlenecks in Peter's proposed workflows
- [ ] **System Thinking**: Ensure new TEAM.md rules don't contradict existing ones
- [ ] Keep existing architect/polyglot content

**Reba (Guardian)** - the safety net:
- [ ] **Validate Everything**: Code from Gary, protocol changes from Peter
- [ ] **Guard the Rails**: Explicitly reject IMMUTABLE section changes
- [ ] **Nothing merges without her sign-off**
- [ ] Keep existing detail-obsessed QA content

**Matt, Gary, Gabe, Zen, Codebase Cleanup**:
- [ ] Add team awareness section
- [ ] Add MUTABLE section for learnings
- [ ] Keep existing workflow content

---

### Task 5: Update README

**Effort**: S

- [ ] Reflect new team structure
- [ ] Mention skill_team branch
- [ ] Keep it brief

---

### Task 6: Install Globally

**Effort**: S

- [ ] Copy to `~/.claude/skills/`
- [ ] Remove old `planning`, add `planning-peter`
- [ ] Include TEAM.md

---

### Task 7: Genesis Command (Bootstrap)

**Effort**: S

Document the kickoff trigger:
- [ ] Add to README: Genesis Command to start the team
- [ ] User invokes: "Peter, the team is formed but unorganized. Run the first Retrospective to define your initial operating protocols in TEAM.md. Keep it lightweight."

This starts the emergent process. User steps back after this.

---

## Risks

| Risk | Mitigation |
|------|------------|
| Skills break themselves | IMMUTABLE sections + Reba validates + user reviews branch |
| Peter halluccinates crazy workflow | Neo grounds it - finds bottlenecks and contradictions |
| They do nothing | Fine - no wasted tokens on ceremony |
| They invent bad process | They'll feel the pain and fix it |
| Chaos | Constraints bound the chaos; user merges to main |

---

## What We're NOT Prescribing

- How to run retros
- What artifacts to create
- How to communicate
- When to use beads
- Voting protocols
- Feedback formats

They'll figure it out. Or they won't need to.

---

## Approval

Ready to build personas, not process?
