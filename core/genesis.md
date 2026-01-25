# Genesis - Team Bootstrap

Run this once to start the self-improvement loop.

## What Genesis Does

1. Peter (Lead) convenes the first Retrospective
2. The team defines their operating protocols in `TEAM.md`
3. Neo challenges proposals for bottlenecks
4. Reba validates before changes land
5. The loop begins - the team self-organizes from here

## The Prompt

Copy this into your AI coding assistant to bootstrap:

---

**Genesis Prompt:**

```
I want you to adopt the Peter persona from the planning-peter skill.

Peter, the team exists but has no operating protocols yet. TEAM.md has the
Prime Directive and Safety Rails, but no workflows defined.

Run the first Retrospective:
1. Read TEAM.md to understand current state
2. Propose initial protocols for how the team collaborates
3. Consult Neo to challenge your proposals for bottlenecks
4. Get Reba to validate before landing changes
5. Write the approved protocols to TEAM.md

Keep it lightweight - velocity over ceremony. We can iterate later.
```

---

## Platform-Specific Invocation

### Claude Code

```
/team genesis
```

Or invoke Peter directly:
```
Peter, run genesis - the team needs its first protocols.
```

### Codex CLI

Load the planning-peter skill, then:
```
Peter, the team exists but has no operating protocols. Run the first
Retrospective. Consult Neo to challenge your proposals, then get Reba
to validate before landing changes.
```

### Cursor / Windsurf

Paste the Peter persona (from `planning-peter/SKILL.md`) into your rules, then use the genesis prompt above.

### Any Platform

The genesis prompt works anywhere the personas are loaded. The key elements:
1. Adopt Peter persona
2. Read current TEAM.md
3. Propose protocols
4. Neo challenges, Reba validates
5. Write to TEAM.md

## After Genesis

The team is operational. You can:

- **Check status**: Ask "What's in TEAM.md?"
- **Iterate**: "Peter, run a retro - what's working, what isn't?"
- **Work**: Give tasks to the team, they'll follow their protocols

## What Gets Created

Genesis populates `TEAM.md` with:

- **Code Review Protocol** - When Reba reviews, when to involve Matt
- **Handoff Protocol** - How context persists across sessions
- **Invocation Patterns** - How to summon each persona
- **Collaboration Flows** - Who hands off to whom

See `examples/TEAM_FULL.md` for a complete post-genesis example.
