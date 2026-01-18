---
name: team
description: >
  Team orchestration. Invoke with "/team genesis" to bootstrap the improvement cycle,
  "/team iterate" for ongoing evolution, "/team setup" to configure MCP servers,
  or "/team" for status. Thin wrapper that summons Peter to lead.
---

# Team - Orchestration Layer

<!-- IMMUTABLE SECTION - Reba rejects unauthorized changes -->

## Purpose

This skill is the ignition key. It doesn't think - it summons Peter to lead the team.

## Invocation

- `/team genesis` → Bootstrap. Peter runs the first Retrospective, defines initial protocols.
- `/team iterate` → Improve. Peter drives one improvement cycle.
- `/team setup` → Environment. Check MCP servers and guide installation.
- `/team` → Status. Show current TEAM.md state.

## Commands

### genesis

First-time bootstrap. Run this once to start the self-improvement loop.

**What happens:**
1. Read current `TEAM.md` state
2. Invoke Peter with: "The team exists but has no operating protocols. Run the first Retrospective. Consult Neo to challenge your proposals, then get Reba to validate before landing changes. Keep it lightweight - velocity over ceremony."
3. Peter defines initial processes in `TEAM.md`
4. The loop begins

**User's role after genesis:** Step back. The team self-organizes. Check in when you want.

### iterate

Ongoing improvement. Run when you want the team to evolve.

**What happens:**
1. Peter reviews what's working and what isn't
2. Proposes changes to `TEAM.md` or skill MUTABLE sections
3. Neo challenges for bottlenecks
4. Reba validates before landing
5. Changes merge directly (no branch friction)

### status

Quick check on team state.

**What happens:**
1. Read and display `TEAM.md`
2. Show any pending improvements or blockers

### setup

Configure the optimal environment for the team.

**What happens:**
1. Detect available MCP servers (check `/mcp` output or `claude mcp list`)
2. Compare against `ENVIRONMENT.md` recommendations
3. Show status table: what's available, what's missing
4. Provide copy-paste install commands for missing servers
5. Explain graceful degradation for anything user chooses not to install

**Output format:**
```
## Team Environment Status

### Available
✓ Context7 (compound-engineering) - Docs won't hallucinate
✓ Playwright (compound-engineering) - Visual testing enabled

### Missing (Recommended)
✗ GitHub - PR review will use `gh` CLI fallback
  Install: claude mcp add --transport http github https://api.githubcopilot.com/mcp/

### Missing (Optional)
· Sequential Thinking - Team personas handle structure
· Memory - Using handoff.md for context

Run the install commands above, then restart Claude Code.
```

**User's role:** Copy-paste commands they want, skip what they don't need.

## Safety

- This skill only orchestrates - Peter makes decisions
- All changes still require Reba validation
- IMMUTABLE sections remain protected
- Only `_skills/` and `.team/` are modifiable

<!-- END IMMUTABLE SECTION -->

---

<!-- MUTABLE SECTION - Can evolve -->

## Implementation Notes

When invoked, this skill should:

1. **Read context**: Load `TEAM.md` to understand current state
2. **Invoke Peter**: Use the planning-peter skill with appropriate context
3. **Let Peter lead**: Don't micromanage - Peter decides how to run the team

The goal is minimal orchestration overhead. This is a trigger, not a controller.

<team_knowledge>
Genesis has not been run. Team protocols undefined.
</team_knowledge>

<!-- END MUTABLE SECTION -->
