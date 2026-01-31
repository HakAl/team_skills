# Catalog Search: Base Skills for Personas

**Bead**: _skills-3rn.3
**Date**: 2026-01-31
**Purpose**: Library-first research per design spec Section 6

---

## Search Scope

Searched per protocol order:
1. anthropics/skills (official)
2. agentskills/agentskills (open standard reference)
3. skillmatic-ai/awesome-agent-skills (community)
4. Prat011/awesome-llm-skills (community)
5. Broad GitHub search

---

## 1. Security Audit Methodology (for Matt)

### What exists
- **No unified security audit methodology skill** found in any catalog
- **sickn33/antigravity-awesome-skills** has 112+ security-focused skills, but fragmented:
  - `vulnerability-scanner` — OWASP 2025, attack surface mapping
  - `stride-analysis-patterns` — STRIDE threat modeling
  - `threat-modeling-expert` — STRIDE, PASTA, attack trees
  - `ethical-hacking-methodology` — pentest lifecycle
  - `security-auditor` — DevSecOps, compliance frameworks
  - `pentest-checklist` — assessment checklists
- **Prat011/awesome-llm-skills**: Computer Forensics, Threat Hunting with Sigma Rules
- **anthropics/skills**: No security skills

### Gap
No skill sequences the full audit process (reconnaissance -> threat modeling -> testing -> reporting) as a unified methodology. Individual tools exist but no orchestrating framework.

### Decision
Build from scratch. Distill methodology, don't catalog tools.

---

## 2. System Design Patterns (for Neo)

### What exists
- **muratcankoylan/Agent-Skills-for-Context-Engineering** (13 skills, most relevant):
  - `tool-design` — architectural reduction, tool consolidation
  - `multi-agent-patterns` — supervisor/orchestrator, peer-to-peer, hierarchical
  - `project-development` — task-model fit, pipeline architecture
  - `context-fundamentals`, `context-optimization`, `memory-systems`
  - Focus: agent architectures specifically, not general system design
- **awesome-skills/code-review-skill** — architecture review guides (React 19, Vue 3, Rust, etc.)
- **ramziddin/solid-skills** — SOLID principles, TDD, clean architecture
- **macromania/adr-agent** — Architecture Decision Records

### Gap
No general-purpose architectural review process skill. Existing skills are either agent-specific (Context Engineering) or code-review focused. Missing: technology selection frameworks, scalability assessment, coupling/cohesion analysis, when-to-split heuristics.

### Decision
Build from scratch. Focus on decision frameworks, not pattern catalogs.

---

## 3. Accessible Component Patterns (for Gary)

### What exists (richest results)
- **wshobson/agents** — `accessibility-compliance/SKILL.md`
  - WCAG 2.2, React examples, ARIA, keyboard/focus, modal focus trapping
  - Most directly adaptable
- **nolly-studio/components-build-skill** — 16-category framework
  - "Accessibility by Default" principle, semantic HTML, keyboard nav
- **AIPexStudio/AIPex** — `wcag22-a11y-audit/SKILL.md`
  - Automated testing against 8 WCAG 2.2 criteria
  - Accessibility tree inspection, contrast analysis
- **majiayu000/claude-skill-registry** — `a11y-annotation-generator/SKILL.md`
  - Auto-adding a11y features: alt text, ARIA, forms, modals, dropdowns
  - React, Vue, HTML support
- **yonatangross/orchestkit** — `wcag-compliance/SKILL.md`
  - WCAG 2.2 AA implementation guide, code examples, anti-patterns
- **coveo/ui-kit** — `applying-wcag-guidelines/SKILL.md`
  - Persona-based approach (cognitive, keyboard, low vision, screen reader, voice)
  - Axe-core + Storybook integration
- **anthropics/skills**: No a11y skills

### Gap
Multiple good sources exist. None are persona-specific or distilled to building principles (they're compliance guides or generators). Gary needs hands-on component patterns, not audit checklists.

### Decision
Adapt from existing sources (wshobson, orchestkit, coveo). Distill to component-level building patterns.

---

## Summary

| Skill | Existing Sources | Approach |
|-------|-----------------|----------|
| Matt: security-audit-methodology | Fragmented tools, no unified methodology | Build from scratch |
| Neo: system-design-patterns | Agent-specific or code-review focused | Build from scratch |
| Gary: accessible-component-patterns | 6+ existing a11y skills | Adapt and distill |
