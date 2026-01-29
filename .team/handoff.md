# Session Handoff

---
last_session: 2026-01-29
status: active
---

## Current Session (2026-01-29)
**Theme: Research-backed cold critic agent (bead _skills-fcu)**

### Completed
- **Research survey** — 7+ papers on multi-agent debate, self-preference bias, hybrid routing
- **Feature design** — Neo spawns anonymous Task agent for adversarial plan review, interprets in context
- **Neo SKILL.md updated** — Cold Critic Mode added to MUTABLE section (lines 188-231)
- **Two beads created and closed** — _skills-fcu (feature), _skills-wx1 (blog)
- **Memory updated** — Cold Critic Mode entity with full research basis
- **Real test on Langley Request Replay plan** — Cold critic found 3 critical issues + 1 conceptual gap Neo missed (SSRF, circular credential exposure, lossy reconstruction, modified replay)
- **Blog published** — https://hakal.github.io/team_skills/blog/cold-critic.html
- **Dev.to cross-post** — manual (API key issue with Varnish CDN, frontmatter provided)

### Key Research Findings
- Models rate own output higher (arxiv 2404.13076) — self-preference bias
- Authorship visibility increases self-voting (arxiv 2509.23537) — strongest evidence for context isolation
- Multiagent debate improves reasoning (Du et al., ICML 2024) — foundational
- Hybrid routing optimal (arxiv 2505.18286) — don't use universally
- Counterpoint: multi-persona may match multi-agent (arxiv 2601.15488) — mitigated by Neo interpreting in context

### Design Decisions
- Neo decides when to spawn (not Peter) — avoids self-preference in trigger decision
- Cold agent is anonymous (non-persona agent type) — not Neo-in-exile
- Trigger is comfort ("agreeing too easily"), not complexity threshold
- No TEAM.md changes — Rail #5 intact, this is Neo using a tool
- Principles over templates — Neo crafts prompts per situation

### Team Discussion
- User cited two arxiv papers, asked about multi-agent planning
- Analysis revealed first paper (2404.13076) was about self-preference, not planning — but relevance holds via extrapolation
- User proposed Neo runs the agent herself (preserves context) — key insight
- Peter caught wrong subagent type (was "nifty-neo", corrected to non-persona)
- Neo pushed for principles over rigid template, comfort-based trigger
- Reba reviewed: approved, two nits (subagent type hardcoding, bare arxiv IDs) — both fixed
- Reba confirmed IMMUTABLE section untouched

### Open
- [ ] Dev.to cross-post (user posting manually, API key blocked by Varnish CDN)
- [ ] Langley Request Replay needs revised plan incorporating cold critic findings before build

---

## Previous Session (2026-01-25)
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
