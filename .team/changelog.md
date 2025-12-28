# Team Changelog

All notable changes to team structure, processes, and skills.

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
- Team discussion drove all major decisions
- Peter proposed -> Neo challenged -> Reba validated (pattern holding)

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
