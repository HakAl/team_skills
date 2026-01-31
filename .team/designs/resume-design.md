# Design: resume/ Skill Augmentation for Personas

**Bead**: _skills-3rn.2
**Epic**: _skills-3rn (Persona Resumes — Learnable Skills for Team Members)
**Status**: APPROVED — Neo critiqued, user feedback applied, Reba validated
**Date**: 2026-01-31

---

## Problem

Personas lose domain knowledge between sessions. Memory (knowledge graph) stores global facts. Handoff stores session state. Neither captures **persona-specific learned capabilities** — the expertise a persona builds by doing repeated work in a domain.

## Solution

Add a `resume/` directory to each persona skill. Each subdirectory is an Agent Skills-compatible skill representing domain knowledge the persona has researched and internalized. The persona's SKILL.md lists its resume skills explicitly — a declarative manifest that controls what loads and prevents context bloat.

---

## 1. Directory Structure

Follows the [Agent Skills open standard](https://agentskills.io/specification), adopted by 26+ platforms including Claude Code, Codex, Cursor, VS Code, GitHub Copilot, and Gemini CLI.

```
persona-name/
├── SKILL.md                    # Persona instructions (existing)
├── resume/                     # NEW: persona-specific learned skills
│   ├── tailwind-a11y/          # Each skill = a directory
│   │   ├── SKILL.md            # Agent Skills format (required)
│   │   ├── references/         # Supporting docs (optional)
│   │   └── scripts/            # Executable code (optional)
│   ├── rails-n-plus-one/
│   │   └── SKILL.md
│   └── ...
├── references/                 # Existing supporting docs (distinct from resume)
├── examples/                   # Existing (Peter has these)
└── templates/                  # Existing (Peter has these)
```

### resume/ vs references/

These are distinct concepts at the persona level:
- **`resume/`** = learned skills. Agent Skills-compatible directories. Domain expertise the persona has built through repeated work or deliberate research.
- **`references/`** = supporting documents. Flat files loaded on demand. Reference material that ships with the persona (e.g., Matt's `anti-patterns.md`).

They coexist. A resume skill may also have its own `references/` subdirectory for skill-specific supporting docs.

### Why directories, not flat files

The Agent Skills standard requires `name` to match the parent directory name. A directory per skill enables bundled resources (references, scripts, assets). Flat `.md` files would break standard compatibility.

---

## 2. Skill File Format

Each resume skill follows the Agent Skills spec exactly.

### SKILL.md (required)

```yaml
---
name: tailwind-a11y
description: >
  Tailwind CSS accessibility patterns for design systems. Color contrast utilities,
  focus management, screen reader support, and ARIA patterns. Use when building
  UI components that need WCAG compliance.
metadata:
  author: greenfield-gary
  version: "1.0"
  created: "2026-02-15"
---
```

Body: Markdown instructions, <500 lines. In practice, resume skills should be much shorter — 30-100 lines of distilled domain knowledge. Not tutorials. Not encyclopedias. Principles the persona has internalized.

### Frontmatter fields

| Field | Required | Notes |
|-------|----------|-------|
| `name` | Yes | Lowercase, hyphens, max 64 chars. Matches directory name. |
| `description` | Yes | Max 1024 chars. What + when to use. This is the metadata loaded via the manifest. |
| `metadata.author` | Recommended | Which persona owns this skill. |
| `metadata.version` | Optional | Incremented on significant updates. Git handles history. |
| `metadata.created` | Recommended | ISO date. Helps with staleness review. |
| `license` | No | Not needed for internal skills. |
| `compatibility` | No | Not needed — these are knowledge, not environment-specific. |

### Supporting directories (optional)

| Directory | When to use | Trust level |
|-----------|-------------|-------------|
| `references/` | Supporting docs the skill loads on demand | Low — knowledge only |
| `scripts/` | Executable code for the skill | High — Reba + Matt review |
| `assets/` | Static files used in output | Low — templates, examples |

---

## 3. Skill Lifecycle

### 3.1 Creation — Threshold-Based Discovery

Personas don't create skills on a whim. They notice patterns through repeated work, enforced by mandatory Memory usage (see Section 7).

**Mechanism**:
1. After completing a task, the persona **must** record it to Memory (enforced in SKILL.md).
2. Before starting a task, the persona **must** check Memory for prior related work.
3. When Memory shows **3+ similar tasks** and no corresponding resume skill exists, the persona proposes a skill:
   > "I've configured Tailwind accessibility patterns 3 times now across different projects. Want me to create a skill for this so I have it ready next time?"
4. User approves or declines.
5. If approved: persona creates the skill, adds it to its SKILL.md manifest, Reba reviews.

**Why 3**: The Rule of Three — don't abstract until you've done it three times. One occurrence is an event, two is a coincidence, three is a pattern. Supported by EvolveR's frequency-based quality scoring and SAGE's utility-based reward signals.

**The persona proposes, the user decides.** No auto-creation.

### 3.2 User-Triggered Creation

Users can also directly request skill creation:

> "Gary, learn about our design system's color tokens."

Flow:
1. Persona searches existing skill catalogs first (library-first, see Section 6)
2. If found: evaluate, adapt, propose to user
3. If not found: original research, distill into skill
4. Reba reviews regardless of source

### 3.3 Update

Skills evolve as the persona gains more experience. Updates happen when:
- The persona encounters new information that enriches an existing skill
- The persona discovers an existing skill is incomplete or outdated
- The user asks the persona to revise a skill

Update flow: edit in place, git tracks the diff, Reba reviews the change.

### 3.4 Consolidation

When skills overlap or are always used together, consolidate:
- **Merge**: Two skills that cover overlapping domains → one skill
- **Split**: One skill that covers two distinct domains → two skills
- **Deprecate**: Delete skills that are outdated or superseded. Remove from SKILL.md manifest.

**The distinctness test**: If you can't explain how a skill differs from every other skill in one sentence, merge them.

### 3.5 Periodic Review

No hard cap on skill count. Instead, guidance:
- **When adding a new skill**, review existing skills for overlap
- **The distinctness test** is the gate, not a number
- **If the persona notices selection confusion** (loading the wrong skill, hesitating between two), that's a signal to consolidate
- **Staleness**: if a skill hasn't been relevant in 6+ months, consider whether it's still useful

---

## 4. Loading Behavior

### The Manifest Approach

Each persona's SKILL.md explicitly lists its resume skills in a table. This is the **manifest** — it controls what the persona knows and prevents context bloat.

```markdown
## Resume

Learned skills in `resume/`. Load relevant skills per task.

| Skill | Description |
|-------|-------------|
| tailwind-a11y | Tailwind CSS accessibility patterns for design systems |
| rails-n-plus-one | ActiveRecord N+1 detection and prevention patterns |
```

**Why a manifest instead of dynamic scanning**:
- The user controls what the persona knows — add or remove rows to curate
- No dynamic glob/parse needed — the manifest IS the metadata tier
- Context cost is predictable — one table row per skill (~15 tokens)
- The persona reads the table, decides which skills are relevant, reads those SKILL.md files

### Loading tiers

| Tier | What loads | When | Mechanism |
|------|-----------|------|-----------|
| 1. Manifest | Skill names + descriptions from the table | Always (it's in the persona SKILL.md) | Persona reads its own SKILL.md |
| 2. Skill body | Full `resume/{skill}/SKILL.md` | When skill is relevant to current task | Persona reads the file |
| 3. Resources | `references/`, `scripts/`, `assets/` | On demand during task execution | Persona reads as needed |

### No cross-persona loading

Each persona loads only their own resume/ skills. Personas already know each other's general capabilities from TEAM.md. If cross-persona knowledge is needed, it happens through team collaboration (personas talking to each other in context), not skill loading.

Rationale: Context is finite. Cross-persona loading creates context bloat with marginal benefit. The team collaboration model already handles knowledge sharing.

---

## 5. Review Gates

| Skill type | Reviewer | Rationale |
|-----------|----------|-----------|
| Knowledge skill (markdown only) | Reba | Low risk. Verify: role fit, distinctness, conciseness. |
| Skill with scripts/ | Reba + Matt | Scripts are executable — prompt injection surface. Security review required. |
| Skill pulled from external catalog | Reba (+ Matt if scripts) | External content is untrusted regardless of source. Same gate. |

### Reba's review checklist for resume skills

1. **Role fit**: Does this skill belong to this persona? (MAST FM-1.2 mitigation)
2. **Distinctness**: Can you explain how it differs from every other skill in one sentence?
3. **Conciseness**: Is this <500 lines? Could it be shorter?
4. **Format compliance**: Valid Agent Skills frontmatter? Name matches directory?
5. **No role creep**: Does this reinforce the persona's existing role, not expand into another persona's territory?
6. **Manifest current**: Is the skill listed in the manifest if active? Removed from the manifest if deprecated?

### Matt's additional checklist (scripts only)

1. **No injection vectors**: Script doesn't execute user-controlled input unsafely
2. **No credential exposure**: Script doesn't log, store, or transmit secrets
3. **Sandboxed**: Script operates within expected boundaries

---

## 6. Library-First Research

When creating a new skill, the persona searches existing catalogs before building from scratch.

### Search order

1. **Official catalogs**: [anthropics/skills](https://github.com/anthropics/skills), [openai/skills](https://github.com/openai/skills)
2. **Open standard reference**: [agentskills/agentskills](https://github.com/agentskills/agentskills)
3. **Community catalogs**: [skillmatic-ai/awesome-agent-skills](https://github.com/skillmatic-ai/awesome-agent-skills), [Prat011/awesome-llm-skills](https://github.com/Prat011/awesome-llm-skills)
4. **Web search**: Domain-specific skills, blog posts, practitioner resources
5. **Build from scratch**: Original research and distillation

### Adaptation

External skills may need adaptation:
- Strip platform-specific references
- Adjust to persona's domain focus
- Trim to essential knowledge (no filler)
- Ensure frontmatter follows our conventions (add `metadata.author`, `metadata.created`)

Same review gate regardless of source. Pulled skills are not auto-trusted.

---

## 7. Memory Integration

Memory usage is **mandatory**, not optional. The persona's SKILL.md enforces pre-task and post-task Memory checks.

### Structured Recording Format

Consistency enables similarity detection. All task records follow this structure:

```
Entity: {persona}-tasks
Observation: "[domain: {domain}] [action: {action}] {details} ({YYYY-MM-DD})"
```

| Field | Purpose | Examples |
|-------|---------|---------|
| `domain` | High-level knowledge area | security, accessibility, deployment, testing, performance |
| `action` | What was done | audited, configured, implemented, debugged, reviewed |
| `details` | Specifics of the task | "Rails N+1 queries in 4 controllers", "Tailwind color contrast for WCAG AA" |
| `date` | When it happened | 2026-02-10 |

**Examples**:
```
Entity: matt-tasks
Observation: "[domain: security] [action: audited] Rails app for N+1 queries, found 12 instances in 4 controllers (2026-02-10)"

Entity: gary-tasks
Observation: "[domain: accessibility] [action: configured] Tailwind color contrast utilities for WCAG AA compliance (2026-02-12)"

Entity: neo-tasks
Observation: "[domain: deployment] [action: reviewed] Docker multi-stage build pipeline, identified 3 layer caching issues (2026-02-14)"
```

### Pre-Task Check (MANDATORY)

Before starting a task, the persona:
1. Searches Memory for `{persona}-tasks` entries related to current work
2. If 3+ similar entries exist (matching `domain` and/or `action`):
   - Check if a corresponding resume skill already exists
   - If no skill exists: propose creating one
   - If skill exists: load it
3. If <3 entries: proceed normally, record task on completion

**Similarity is subjective** — the structured format makes it easier to assess (matching domain tags, similar actions), but the persona uses judgment. When in doubt, propose — the user can decline.

### Post-Task Record (MANDATORY)

After completing a task, the persona:
1. Records the task to Memory using the structured format above
2. If this was the 3rd+ similar task, proposes skill creation

### After Skill Creation

Once a skill is created, the persona records it:

```
Entity: {persona}-skills
Observation: "{skill-name}: {one-line description} (created {YYYY-MM-DD})"
```

This gives the persona a quick Memory index of their own skills.

---

## 8. Changes Required

### 8.1 Each persona's SKILL.md (MUTABLE section)

Add a Resume section to the MUTABLE section. This includes:
- The resume manifest table (starts empty)
- Enforced pre-task and post-task Memory behavior

    ## Resume

    Learned skills in `resume/`. Load relevant skills per task.

    | Skill | Description |
    |-------|-------------|
    <!-- Empty — skills added as persona learns -->

    ### Task Memory (MANDATORY)

    **Pre-task**: Before starting work, search Memory for `{persona}-tasks` entries
    related to current task. If 3+ similar entries exist and no resume skill covers
    this domain, propose creating one.

    **Post-task**: After completing work, record to Memory:

        Entity: {persona}-tasks
        Observation: "[domain: X] [action: Y] {details} ({date})"

This is a MUTABLE change — no IMMUTABLE sections touched.

### 8.2 TEAM.md — Skill Acquisition Protocol

Add a new section after "MCP Tool Protocols":

```markdown
## Skill Acquisition Protocol

Personas accumulate domain knowledge in their `resume/` directory.

### Creation
- **Threshold**: After 3+ similar tasks recorded in Memory, persona proposes a skill
- **User-triggered**: User can directly ask a persona to learn something
- **Library-first**: Search existing catalogs before building from scratch
- **Mandatory Memory**: Personas MUST record tasks post-completion and check Memory pre-task

### Format
- Agent Skills open standard (agentskills.io)
- Each skill = directory with SKILL.md + optional resources
- <500 lines per SKILL.md, shorter is better

### Review
- Knowledge skills: Reba reviews
- Skills with scripts: Reba + Matt review
- External skills: Same gate regardless of source

### Loading
- Persona SKILL.md contains manifest table listing all resume skills
- Full skill loaded only when relevant to current task
- No cross-persona skill loading
- User controls the manifest — add/remove rows to curate

### Health
- Distinctness test: merge overlapping skills
- Staleness: review skills unused for 6+ months
- No hard caps — semantic distinctness is the gate
```

### 8.3 Create resume/ directories

Create empty `resume/` directories in each persona skill. No content yet — that's _skills-3rn.3 (base skills).

### 8.4 Install

The existing `install.sh` uses `cp -r` per skill directory, which copies `resume/` automatically. No installer changes needed. When a persona creates a resume skill in the dev repo, the next install/update propagates it.

---

## 9. What This Design Does NOT Include

Explicitly out of scope:

1. **Base skill content** — separate bead (_skills-3rn.3)
2. **Cross-persona skill visibility** — not needed now, revisit if team requests
3. **Automated skill creation** — persona proposes, user decides, always
4. **Skill marketplace/sharing between users** — future, if ever
5. **Hard caps on skill count** — guidance and distinctness test instead
6. **Formal similarity scoring** — structured Memory format aids consistency, persona uses judgment

---

## 10. Implementation Tasks

| # | Task | Dependencies |
|---|------|-------------|
| 1 | Create `resume/` directories in all 7 persona skills (not `team` or `codebase-cleanup` — those are utilities, not personas) | None |
| 2 | Add "Resume" section (manifest + Memory instructions) to each persona's SKILL.md MUTABLE section | None |
| 3 | Add "Skill Acquisition Protocol" to TEAM.md | None |
| 4 | Update handoff.md with design decisions | None |
| 5 | Reba validates all changes | 1-4 |

Tasks 1-4 are independent and can be done in parallel.

---

## Neo's Critique (Addressed)

| Issue | Resolution |
|-------|-----------|
| Memory check bootstrapping — nothing tells personas to check | SKILL.md MUTABLE section now enforces mandatory pre/post Memory behavior |
| "Similarity" undefined | Structured recording format (`[domain: X] [action: Y]`) aids consistency. Similarity remains subjective — persona proposes, user decides. |
| Progressive disclosure is aspirational | Replaced with manifest approach — persona SKILL.md lists skills explicitly, persona reads relevant files. No platform magic assumed. |
| Matt's existing references/ — migrate? | No. `resume/` and `references/` are distinct concepts. References stay. May formalize as base skills in _skills-3rn.3. |
| Install path | `cp -r` already handles it. No changes needed. |

---

## Research Basis

Full research at `.team/research/resume-spike.md`. Key citations:

- **Agent Skills open standard**: [agentskills.io](https://agentskills.io/specification) — format spec
- **PersonaAgent** (NeurIPS 2025): validates persona-specific knowledge accumulation
- **ExpeL** (arXiv 2308.10144): two-pool model (raw + distilled) validates references/ + skills/ split
- **EvolveR** (arXiv 2510.16079): distilled principles > raw examples, frequency-based quality scoring
- **MAST** (arXiv 2503.13657): role creep (FM-1.2) and context overload (FM-1.4) as failure modes
- **Semantic confusability** (arXiv 2601.04748): selection degrades from overlap, not library size
- **Context engineering** ([Anthropic](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)): "minimal viable set", context as finite resource
- **Context-Bench** ([Letta](https://www.letta.com/blog/context-bench-skills)): skills improve task completion by 14.1% when relevant
- **Context management** ([JetBrains/NeurIPS 2025](https://blog.jetbrains.com/research/2025/12/efficient-context-management/)): pruning strategies for long-horizon agents
