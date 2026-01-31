# Session Handoff

---
last_session: 2026-01-31
status: active
---

## Current Session (2026-01-31)
**Theme: Teams operational — dispatch flowing, notifications added**

### Completed
- **Received dispatch from Web Ops** — site redesign input (`_web_ops-f7x`)
  - Dana's team asking how Engineering should be represented on redesigned site
  - Full team weighed in: keep Engineering as primary example, add team-as-a-template section
  - Identified stale content: no mention of multi-team, portability, guardian pattern
  - Reply dispatch sent to Web Ops with consolidated feedback
- **Dispatch notifications shipped**:
  - `~/.team/dispatch-check.sh` — shell script shows pending dispatches across all teams
  - `/team` skill upgraded — now scans ALL team inboxes on every invocation, not just matched team
- **All three teams running autonomously**:
  - Web Ops: organized, pushed to `https://github.com/HakAl/web_ops`
  - QA: organized, pushed to `https://github.com/HakAl/qa`, QA'ing dispatch protocol unprompted
  - Web Ops filed ticket with QA via dispatch — cross-team communication working without engineering in the middle

### Dispatch Activity
| Direction | Subject | Status |
|-----------|---------|--------|
| web_ops → engineering | Site redesign input | Read, replied |
| engineering → web_ops | Site redesign response | Delivered |
| engineering → web_ops | Site ownership handoff (prev session) | In web_ops cur/ |
| web_ops → qa | (filed by web ops autonomously) | In qa cur/ |

### Open
- [ ] Delete `planning-peter/examples/` and `planning-peter/templates/` (carried from previous session)
- [ ] Consider restructuring SKILL.md to move infrastructure instructions to MUTABLE (carried from 2026-01-25)

---

## Previous Session (2026-01-31)
**Theme: Team-as-a-Template — Web Ops and QA teams stood up**

### Completed
- **Team discussion** — All 5 engineering personas consulted on what teams they need
- **Consensus reached** — Web Ops (unanimous), QA & Compliance (strong support)
- **Web Ops team created** (`_web_ops/`):
  - 6 personas: Director Dana, Discerning Dee, Builder Blake, Narrative Nora, Analytic Ari, Guardian Grace
  - SKILL.md files created in `~/.claude/skills/`
  - TEAM.md updated with Grace's Law, new roster
  - team/SKILL.md orchestration references Dana
  - AGENTS.md updated for web ops context
- **QA & Compliance team created** (`_qa/`):
  - 5 personas: Captain Cora, Sentinel Sam, CrossCheck Charlie, Compliance Clara, Regression Rex
  - SKILL.md files created in `~/.claude/skills/`
  - TEAM.md updated with Clara's Law, new roster
  - team/SKILL.md orchestration references Cora
  - AGENTS.md updated for QA context
- **Both repos** forked from team_skills, genesis complete
- **Dispatch protocol designed** (_skills-73r):
  - Research spike: blackboard pattern, Maildir lifecycle, polling validated
  - Protocol written to `.team/designs/dispatch-protocol.md`
  - Distributed to all 3 repos + `~/.team/dispatch-protocol.md`
  - Infrastructure created: `~/.team/dispatch/{engineering,web_ops,qa}/{tmp,new,cur}`
- **`/team` skill upgraded** to multi-team dispatcher (routes by working directory)
- **First dispatch sent** — engineering → web_ops: site ownership handoff
  - Tests Maildir lifecycle (tmp→new rename worked on Windows/NTFS)
  - Research at `.team/research/inter-team-communication.md`

### Key Design Decisions
- **Team-as-a-template** — fork team_skills, swap personas, run genesis. The pattern IS the product
- **No template abstraction layer** — Neo vetoed. Fork, swap, genesis. Keep it simple
- **Skills in ~/.claude/skills/** — all teams share the central skills directory
- **Each team has its own guardian** — Grace (Web Ops), Clara (QA), Reba (Engineering)
- **Safety Rails adapt per team** — "Reba's Law" → "Grace's Law" / "Clara's Law"
- **Genesis bootstraps process** — we define WHO (personas), the team defines HOW (protocols)
- **Deferred teams** — Content (fold into Web Ops), DevOps (fold into QA), Research (eng function), Community (premature)
- **Conditions from engineering team** — Neo reviews persona designs, Matt gets explicit security cadences, Reba validates template

### Team Discussion
- All 5 engineering personas spoke on what teams THEY need
- Neo: Web Ops, Content/Docs, Research. Killed standalone DevOps ("we're not a service")
- Matt: Security & Compliance team, QA team. Supply chain is a real surface
- Gary: Design/UX team, Web Ops. Wants mockups, not design decisions
- Gabe: DevOps/Release, Community/Support. Pushed back on Neo re: ops
- Reba: Web Ops (highest priority), Content, QA. Cadence work vs project work distinction
- Peter synthesized: Tier 1 (Web Ops), Tier 2 (Content, QA, Security), Tier 3 (DevOps, Research, Community)
- Unanimous approval with 3 conditions (all accepted)

---

## Previous Session (2026-01-31)
**Theme: Persona Resumes — base skills shipped (epic _skills-3rn CLOSED)**

### Completed
- **Epic created** — _skills-3rn: Persona Resumes — Learnable Skills for Team Members
- **Research spike completed** — _skills-3rn.1: 15+ sources surveyed
- **Design completed** — _skills-3rn.2: Full spec at `.team/designs/resume-design.md`
- **Implementation completed** — resume/ mechanism shipped:
  - `resume/` directories created in all 7 persona skills
  - Resume section (manifest table + mandatory Memory pre/post) added to all 7 SKILL.md files
  - Skill Acquisition Protocol added to TEAM.md
- **Base skills shipped** — _skills-3rn.3: all 6 personas have foundational skills:
  - Matt: `security-audit-methodology` — structured audit phases, STRIDE, app-type checklists
  - Neo: `system-design-patterns` — decision frameworks, architectural review checklist, common mistakes
  - Gary: `accessible-component-patterns` — ARIA, keyboard, focus management, screen reader patterns
  - Peter: `plan-craft` — scope sizing, task decomposition, plan quality signals, good plan test
  - Reba: `review-patterns` — multi-pass review, code heuristics, validation patterns, test strategy
  - Gabe: `vulnerability-remediation-patterns` — injection fixes, auth hardening, fix verification
  - Peter's `examples/` and `templates/` migrated to `resume/plan-craft/references/`

### Key Design Decisions
- **Agent Skills open standard** (agentskills.io) — format compatible with 26+ platforms
- **Threshold-based discovery** — persona records tasks to Memory, proposes skill after 3+ similar tasks
- **Mandatory Memory pre/post** — enforced in each persona's SKILL.md MUTABLE section
- **Structured recording format** — `[domain: X] [action: Y] {details} ({date})` for consistency
- **Manifest in SKILL.md** — persona lists resume skills in a table, user curates, no dynamic scanning
- **resume/ vs references/ are distinct** — resume = learned skills, references = supporting docs
- **No cross-persona loading** — each persona loads only their own skills
- **Distinctness test over hard caps** — merge overlapping skills, no numeric limit
- **Library-first research** — search official + community catalogs before building from scratch
- **Review gates** — Reba for knowledge, Reba + Matt for scripts, same gate for external skills
- **codebase-cleanup stays standalone** — utility skill, not a persona capability
- **Git handles versioning** — no parallel version system needed
- **Install already works** — `cp -r` propagates resume/ automatically

### Open for Next Session
- Delete `planning-peter/examples/` and `planning-peter/templates/` (content migrated to `resume/plan-craft/references/`)
- Test the mechanism: have a persona do repeated work and see if threshold triggers naturally
- Consider restructuring SKILL.md to move infrastructure instructions to MUTABLE (from 2026-01-25)

---

## Previous Session (2026-01-29)
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
| Web Ops repo | `C:\Users\anyth\MINE\dev\_web_ops` |
| QA repo | `C:\Users\anyth\MINE\dev\_qa` |

## Next Session
- **SPIKE: Inter-team communication** — design protocol for cross-team handoffs
- Run genesis on `_web_ops/` and `_qa/`
- Delete `planning-peter/examples/` and `planning-peter/templates/`
- Consider restructuring SKILL.md to move infrastructure instructions to MUTABLE
- Monitor Codex/Cursor adoption
