# Team Changelog

All notable changes to team structure, processes, and skills.

---

## 2026-01-31 - Persona Resumes

### Added
- **resume/ directory** in all 7 persona skills — learned domain knowledge accumulates over time
- **Skill Acquisition Protocol** in TEAM.md — threshold-based discovery, library-first research, review gates
- **Mandatory Memory pre/post** — personas must record tasks and check for patterns before starting work
- **Structured recording format** — `[domain: X] [action: Y] {details} ({date})` for consistency
- **Manifest table** in each persona SKILL.md — declarative list of learned skills, user curates
- **Base skills for all 6 personas**:
  - Matt: `security-audit-methodology` — STRIDE threat modeling, audit phases, app-type checklists, risk rating
  - Neo: `system-design-patterns` — monolith vs services, SQL vs NoSQL, architectural review checklist
  - Gary: `accessible-component-patterns` — ARIA per component, keyboard interactions, focus management
  - Peter: `plan-craft` — scope sizing, task decomposition quality, plan quality signals, the good plan test
  - Reba: `review-patterns` — multi-pass review structure, code heuristics, validation patterns, test strategy
  - Gabe: `vulnerability-remediation-patterns` — injection fixes, auth hardening, authz enforcement, fix verification
- **Peter references migrated** — `examples/` and `templates/` moved to `resume/plan-craft/references/`

### Design
- Full spec at `.team/designs/resume-design.md`
- Research at `.team/research/resume-spike.md` (15+ academic sources)
- Follows [Agent Skills open standard](https://agentskills.io) — compatible with 26+ platforms
- Peter designed → Neo critiqued (5 issues, all addressed) → User refined → Reba validated
- Base skills: each fills gap between SKILL.md process and practitioner craft knowledge
- No overlap: Matt audits, Reba reviews, Gabe remediates — cleanly separated domains

### Key Decisions
- Threshold of 3 similar tasks before proposing a skill (Rule of Three)
- Distinctness test over hard caps — merge overlapping skills
- No cross-persona skill loading — context is finite
- resume/ (learned skills) and references/ (supporting docs) are distinct
- codebase-cleanup stays standalone — utility, not a persona capability
- Git handles versioning — no parallel system needed

---

## 2026-01-29 - Cold Critic Mode

### Added
- **Cold Critic Mode** in Neo's SKILL.md (MUTABLE section)
  - Neo spawns anonymous Task agent for adversarial plan review
  - Counters self-preference bias (models rate own output higher)
  - Trigger: comfort ("agreeing too easily"), not complexity threshold
  - Neo interprets results in full context, filters false positives

### Research Basis
- Self-preference bias: arxiv 2404.13076
- Authorship visibility increases self-voting: arxiv 2509.23537
- Multiagent debate improves reasoning: Du et al., ICML 2024
- Hybrid routing optimal: arxiv 2505.18286

### Tested
- Real test on Langley Request Replay plan — cold critic found 3 critical issues + 1 conceptual gap Neo missed (SSRF, circular credential exposure, lossy reconstruction, modified replay)

### External
- Blog published: https://hakal.github.io/team_skills/blog/cold-critic.html

---

## 2026-01-25 - Portability & Global TEAM.md

### Added
- **Global TEAM.md lookup** — skills check `.team/TEAM.md` (project) then `~/.team/TEAM.md` (global)
- **Platform-agnostic skills** — genericized tool references in SKILL.md files
- **Portable methodology** — `core/methodology.md` with no platform-specific references
- **Portable genesis** — `core/genesis.md` copy-paste prompt works on any platform

### Updated
- `install.sh` — creates `~/.team/` and copies TEAM.md
- 9 SKILL.md files — new TEAM.md lookup instruction in Team Awareness
- README — restructured methodology-first, platform-specific install sections

### Tested
- Verified skills work on OpenAI Codex CLI

### IMMUTABLE Exception (Precedent)
- Team Awareness TEAM.md lookup is inside IMMUTABLE bounds
- Approved: change is infrastructure (file location), not identity
- Future: consider moving to MUTABLE where it belongs

---

## 2026-01-17 - Autonomous Workflow

### Added
- **Autonomous Workflow Protocol** - `/team <task>` runs full dev cycle
  - Team self-organizes: Peter plans → Neo critiques → Gary builds → Reba reviews
  - Escape hatches for ambiguity, security concerns, scope boundaries
  - No rigid script - team figures out handoffs naturally

- **Safety Rail #5 (No Isolation)** - Now IMMUTABLE
  - Team members must stay in current context
  - NEVER spawn team personas as Task subagents - kills collaboration
  - Promoted from Invocation Protocol to Safety Rails

### Learned (from cass-memory discussion)
- **Memory should decay without validation** - Knowledge needs re-confirmation to stay relevant
- **Inflection points > every run** - Log what matters, not everything
- **Discipline before tooling** - Try manually before automating
- **Counterfactual value is invisible** - Mistakes not made can't be measured

### Process
- Team voted unanimously for Autonomous Workflow
- Split on Learnings Protocol (cm-inspired) - tabled for informal experimentation
- First autonomous workflow test: Playwright MCP navigation to team GitHub
- Peter proposed → Neo challenged → Team voted → Gary implemented → Reba approved

### External
- Reviewed cass-memory system (Jeffrey Emanuel's procedural memory for AI agents)
- Decided: interesting ideas, different problem space than ours
- Extracted principles without adopting tooling

### Accomplishments (scrappy project)
- **Drafted GitHub issue response** - Nomic embedding feature request, recommended evidence-based approach
- **Revised README** - Led with killer stat (23K requests), added comparison table, fixed inaccuracies
- **Reviewed LangGraph migration** - User followed team's plan, exceeded targets:
  - 55,118 lines deleted (target: 17,671)
  - 7,168 lines added (robust implementation)
  - Net reduction: 47,950 lines
  - User correctly deviated from plan to keep orchestrator/ and context/ (features, not scaffolding)

### Learned (from migration review)
- **Plans overestimate deletion, underestimate addition** - Real implementations need more code
- **LangGraph replaces control flow, not infrastructure** - State machine replaced, features kept
- **User judgment > rigid plan adherence** - Good plans allow deviation

---

## 2025-12-28 - Team Goes Public

### Shipped
- **GitHub Pages Site** ([hakal.github.io/team_skills](https://hakal.github.io/team_skills/))
  - Team roster, philosophy, get started guide
  - Static HTML/CSS, no build step, no JavaScript
  - Accessible: semantic HTML, reduced-motion, high-contrast support
  - Mobile responsive

- **Code Review Protocol** added to TEAM.md
  - Reba reviews all code
  - Matt reviews security-sensitive changes
  - Nothing merges without sign-off

### Expanded
- **Gary -> UX Guru**: Accessibility (WCAG), internationalization (i18n), UX libraries
- **Gabe -> Red Team**: Offensive security, exploit knowledge, attack methodology

### External Impact
- **zen-mode security notes** merged upstream (README lines 219-234)
- **4 security beads** created for zen-mode:
  - zen-9m8 ZEN_SKIP_PERMISSIONS bypass (P0)
  - zen-dy1 Prompt injection via task file (P1)
  - zen-dhv Local zen.py code execution (P1)
  - zen-klk Env var config manipulation (P2)
- **4 fix plans** linked to findings

### Learned
- **Personas > Processes** - Same-context skills beat separate agent processes
- **Static > Complex** - HTML/CSS beats infrastructure when you don't need it
- **Red + Blue = Coverage** - Matt finds issues, Gabe proves they're real
- **Consensus produces quality** - Team discussion -> better decisions than solo

### Process
- Evaluated mcp_agent_mail, decided against (overkill for our coordination model)
- Evaluated AutoGen, decided against (distributed agents, not our model)
- Added Invocation Protocol - team = personas, not subagents
- Added Handoff Protocol for cross-session context persistence
- Team discussion drove all major decisions
- Peter proposed -> Neo challenged -> Reba validated (pattern holding)

### Community
- **First GitHub issue response** - QuantumNiyam asked about self-organization without persistent memory
- Team drafted collaborative response about handoff system, GWT, and honest limitations
- Engaged openly about being a v0 experiment

---

## 2025-12-27 - Genesis Complete

### Added
- **TEAM.md v1.0** - Initial operating protocols established
  - Work Flow: Triage -> Execute -> Validate
  - Complexity Signals for decision-making
  - Involvement Matrix for task routing
  - Escalation Ladder: Stuck -> Neo -> User
  - Context Persistence in .team/

- **Team Status Dashboard** (.team/dashboard.ps1)
  - Displays roster, plans, retros
  - PowerShell, no dependencies
  - Supports -Json and -NoColor flags

### Process
- First Retrospective run (Genesis)
- Peter proposed -> Neo challenged -> Reba validated
- Safety Rails restored (No Direct Push to Main)

### Team
- All 9 skills operational with team awareness
- Protocols defined, self-improvement loop active

---

*Run /team iterate when something needs improving.*
