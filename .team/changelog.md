# Team Changelog

All notable changes to team structure, processes, and skills.

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
