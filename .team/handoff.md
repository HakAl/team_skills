# Session Handoff

---
last_session: 2026-01-25
status: active
---

## Current Session (2026-01-25)
**Theme: Global TEAM.md lookup (bead _skills-bsh)**

### Completed
- **Global TEAM.md location** - Skills now look in `.team/TEAM.md` (project) then `~/.team/TEAM.md` (global)
- **install.sh updated** - Creates `~/.team/` and copies TEAM.md there
- **9 SKILL.md files updated** - New lookup instruction in Team Awareness section
- **README updated** - Documented the convention

### IMMUTABLE Exception (Precedent)
**Issue**: The "Team Awareness" section containing the TEAM.md lookup instruction is inside IMMUTABLE bounds.

**Decision**: Approved the change despite IMMUTABLE boundary.

**Justification**:
1. Change is purely infrastructural (file location), not identity
2. Doesn't change WHO personas are or WHAT they do
3. Necessary for skills to function when installed globally
4. Intent of IMMUTABLE (protect persona identity) is preserved
5. Only the letter (don't touch that section) is violated

**Future action**: Consider moving "where to read TEAM.md" instruction to MUTABLE section where it belongs. This is infrastructure, not identity.

### Team Discussion
- Peter planned, Neo simplified ("Option A - explicit lookup")
- Reba flagged IMMUTABLE violation, ruled it acceptable as infrastructure fix
- User confirmed approach before execution

---

## Previous Session (2026-01-25)
**Theme: Portability - Share methodology beyond Claude**

### Completed
- **Platform-agnostic skills** - Genericized tool references in SKILL.md files
  - `Glob`, `Grep`, `Task` → capability language ("search for files", "explore codebase")
  - planning-peter, meticulous-matt, codebase-cleanup updated
- **core/methodology.md** - Platform-agnostic team methodology docs
  - Team roles, IMMUTABLE/MUTABLE pattern, protocols
  - No Claude-specific references
- **core/genesis.md** - Portable bootstrap prompt
  - Copy-paste prompt works on any platform
  - Platform-specific invocation instructions
  - README updated with genesis for Claude, Codex, Cursor
- **README restructured** - Methodology-first, not Claude-first
  - Universal concepts lead
  - Platform-specific install sections with genesis instructions
  - zen-runner marked as Claude-specific
- **Tested on Codex CLI** - User verified skills work on OpenAI's platform
- **MCP server reliability fix** - Global npm install instead of npx
  - `npm install -g @modelcontextprotocol/server-memory`
  - `npm install -g @modelcontextprotocol/server-sequential-thinking`
  - Servers now start instantly (no download delay)
- **Housekeeping** - Stopped tracking `.claude/settings.local.json`

### Decisions Made
- Skills ARE the portable versions (no duplication needed)
- SKILL.md format already compatible with Codex
- `.claude/agents/` is the only Claude-specific wiring
- zen-runner stays Claude-only (depends on zen-mode CLI)
- Lead with methodology, platforms are implementation details
- Genesis is a key feature - made it portable with copy-paste prompt

### Team Discussion
- Peter: Initially conservative ("stay Claude-native")
- Neo: Pushed back ("complexity tax is imaginary, formats are 90% compatible")
- User clarified: "sharable methodology, not a product"
- Peter revised: "Make core portable, let others adapt"
- User: "genesis is one of the few features and it's fun" → made it portable
- Reba validated all changes (IMMUTABLE sections untouched)

## Previous Session (2026-01-18)
- Site redesign around Plan→Build pattern
- Demo GIF created and embedded
- Blog post published to Dev.to
- Install script created
- MCP servers configured and tested
- Community engagement started

## Assets
| Asset | Location |
|-------|----------|
| Portable methodology | core/methodology.md |
| Portable genesis | core/genesis.md |
| Site | https://hakal.github.io/team_skills/ |
| Blog | https://hakal.github.io/team_skills/blog/ |
| Dev.to | https://dev.to/theskillsteam |

## Next Session
- Test global TEAM.md lookup in another repo (verify Reba finds `~/.team/TEAM.md`)
- Consider restructuring SKILL.md to move infrastructure instructions to MUTABLE
- Monitor Codex/Cursor adoption
