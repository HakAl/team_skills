# Research Spike: Persona Skill Augmentation Patterns

**Bead**: _skills-3rn.1
**Date**: 2026-01-31
**Status**: Complete

---

## Summary

Surveyed 15+ sources across academic papers, open-source frameworks, and practitioner resources to inform the `resume/` design for persona skill augmentation.

**Bottom line**: The concept is well-supported by research. Persona-specific learned skills fill a real gap between global memory (knowledge graph) and session state (handoff). The key risks are semantic confusability (overlapping skills), context overload (too many skills loaded), and role creep (skills drifting outside persona's lane).

---

## Findings by Question

### Q1: How do other multi-agent systems handle persona customization?

| System | Approach | Relevance |
|--------|----------|-----------|
| [PersonaAgent](https://openreview.net/forum?id=fgCOkyJG3f) (NeurIPS 2025) | Episodic + semantic memory, persona as intermediary. Memory informs actions, actions refine memory. | Closest to our design. Validates the persona-specific knowledge accumulation model. |
| [CrewAI](https://github.com/crewAIInc/crewAI), AutoGen, [ADK](https://google.github.io/adk-docs/agents/llm-agents/) | Skills = tool definitions assigned to agents | Different model. They assign tools, not learned knowledge. |
| [awesome-agent-skills](https://github.com/skillmatic-ai/awesome-agent-skills) | SKILL.md with progressive disclosure | Validates file-per-skill approach. Progressive disclosure = load metadata first, full content on demand. |
| [AnythingLLM](https://docs.anythingllm.com/agent/custom/introduction) | plugin.json + handler.js per skill | More code-oriented. Overkill for knowledge skills, relevant model for scripts. |

**Takeaway**: Our resume/ model aligns with PersonaAgent's research-backed approach. Knowledge files (not tool definitions) are the right primitive.

### Q2: Patterns for LLM agents retaining domain knowledge

| Paper | Key Insight | Design Implication |
|-------|-------------|-------------------|
| [ExpeL](https://arxiv.org/abs/2308.10144) | Two pools: raw experience trajectories + distilled insight rules. Importance scoring with pruning. | Validates our references/ (raw) + skills/ (distilled) split. Pruning = skill health. |
| [EvolveR](https://arxiv.org/abs/2510.16079) | Criticizes ExpeL for mimicking. Distills reusable principles instead. Dedup + quality scoring. | Skills (distilled) should be primary artifact. References are supporting evidence, not equal weight. |
| [MUSE](https://arxiv.org/abs/2510.08002) | Accumulated experience generalizes across tasks. | Skills built in one context can transfer. Good sign for portability. |
| [SAGE](https://arxiv.org/abs/2512.17102) | Skills = programmatic functions. Four lifecycle operations: Usage, Generation, Update, Save. | Lifecycle model is useful. We need at least create/update/deprecate. |

**Takeaway**: The raw-vs-distilled split (references vs skills) is validated by ExpeL. EvolveR says distilled knowledge > raw examples. Skills should be concise, principled, not encyclopedic.

### Q3: RAG vs memory vs skill libraries

The literature is clear: these are **complementary, not competing**.

| Layer | Purpose | Our Implementation |
|-------|---------|-------------------|
| RAG / Factual grounding | Up-to-date external knowledge | (Not currently used) |
| Memory (MAG) | Cross-session knowledge, relationships | Memory MCP (knowledge graph) |
| Session state | Current work context | handoff.md |
| Skill library | Persona-specific learned capabilities | **resume/** (proposed) |

**Takeaway**: resume/ fills a genuine gap. It's not duplicating Memory or handoff — it's the third leg.

### Q4: Right granularity for a "skill"

| Source | Finding |
|--------|---------|
| [arXiv 2601.04748](https://arxiv.org/abs/2601.04748) | Formal definition: "a schema-bounded operation characterized by a semantic descriptor, a well-defined input-output signature, and an execution policy." **Selection accuracy degrades from semantic confusability, not library size.** |
| [CUA-Skill](https://arxiv.org/abs/2601.21123) | 452 atomic skills across 17 apps. Atomic = too fine for us. |
| [Skill decomposition](https://arxiv.org/abs/2510.11313) | "Granularity gap" between high-level labels and fine decomposition is a real problem. |
| [STEPS](https://arxiv.org/abs/2601.03676) | Complex skill compositions follow a power law. Hierarchical taxonomy helps. |

**Takeaway**: Our sweet spot is domain-knowledge level:
- Good: "Tailwind patterns for our design system"
- Too fine: "Run npm build" (that's a script)
- Too coarse: "Frontend development" (that's a role)

**Critical finding**: Semantic confusability is the enemy, not library size. Each skill must be clearly distinct from every other skill the persona has.

### Q5: Agent self-improvement through accumulated experience

| Paper | Model |
|-------|-------|
| [SAGE](https://arxiv.org/abs/2512.17102) | Sequential rollout: skills from previous tasks accumulate for subsequent tasks. RL reward for skill generation + utilization. |
| [EvolveR](https://arxiv.org/abs/2510.16079) | Experience -> principles -> policy evolution. Quality scoring (success/usage). Pruning below threshold. |
| [Self-Improving Agents](https://arxiv.org/abs/2510.07841) | Test-time self-improvement. Identifies informative samples, discards mastered ones. |
| [Lifelong Learning survey](https://arxiv.org/abs/2501.07278) | Two challenges: continuous adaptation + mitigating catastrophic forgetting. |

**Takeaway**: Both user-triggered and organic skill creation are supported. Some quality/health signal prevents unbounded growth. Pruning (removing outdated skills) is a solved pattern.

### Q6: Failure modes

From [MAST taxonomy](https://arxiv.org/abs/2503.13657) (14 failure modes across 150 annotated multi-agent traces):

| Failure Mode | Risk to resume/ | Mitigation |
|-------------|----------------|------------|
| FM-1.2: Disobey role specification | Skills push persona outside its lane | Reba reviews: "Does this skill belong to this persona?" |
| FM-1.4: Loss of conversation history | Too many skills = context pressure | Keep skills concise. Soft cap ~5-10 per persona. |
| FM-2.4: Information withholding | Persona knows something but doesn't share | Cross-persona visibility (future) |
| FM-2.5: Ignored other agent's input | Skill confidence overrides collaboration | Skills inform, don't override team discussion |
| Semantic confusability (2601.04748) | Overlapping skills cause selection errors | Each skill clearly distinct. Merge if confusable. |
| Role collapse (practitioner lit) | Specialization degrades over time | Skills reinforce existing role, not expand into others |

**Takeaway**: Three primary risks: role creep, context overload, semantic overlap. All mitigatable with lightweight gates (Reba review, conciseness guideline, distinctness check).

---

## Design Recommendations

### 1. Three-Layer Knowledge Model
resume/ is the skill library layer, complementing Memory (global knowledge) and handoff (session state). Validated by RAG/Memory/Skill literature.

### 2. Domain-Knowledge Granularity
Not atomic actions (too fine), not roles (too coarse). A skill = a domain of expertise the persona has researched and internalized.

### 3. Semantic Distinctness Over Template Conformity
No rigid template. Guideline: "If you can't explain how this skill differs from every other skill in one sentence, merge them."

### 4. Skills Primary, References Supporting
Per EvolveR's critique of ExpeL: distilled knowledge (skills) matters more than raw research (references). References support, skills deliver.

### 5. Concise by Default
Context pressure is real (MAST FM-1.4). A skill file should be a page, not a book. Soft cap of ~5-10 skills per persona before reviewing for consolidation.

### 6. Role Boundary Protection
Skills reinforce the persona's existing role (MAST FM-1.2). Reba's review checks: "Does this skill belong to this persona?"

### 7. Scripts Are a Different Trust Level
Knowledge files (markdown) = low trust barrier. Scripts (executable) = Reba + Matt review. Per [skill injection research](https://github.com/skillmatic-ai/awesome-agent-skills), executable skills are a prompt injection surface.

### 8. Start Simple, Add Structure If Needed
Load all skills on invocation (simple). Add indexing/selection only when context pressure is measurable. Don't over-engineer.

### 9. Library-First Research Cycle
A growing ecosystem of curated skill libraries already exists ([Anthropic](https://github.com/anthropics), [OpenAI](https://github.com/openai), [Vercel](https://github.com/vercel), [Hugging Face](https://huggingface.co), [awesome-agent-skills](https://github.com/skillmatic-ai/awesome-agent-skills), [awesome-llm-skills](https://github.com/Prat011/awesome-llm-skills), and many more). The research cycle should check these first before building from scratch.

**Recommended flow**:
1. User requests "Persona, learn X"
2. Agent searches existing skill libraries for relevant skills
3. If found: evaluate, adapt if needed, Reba reviews, lands in resume/
4. If not found: original research from scratch
5. Same review gate regardless of source

**Trust consideration**: External skill files are a prompt injection surface (per [skill injection research](https://github.com/skillmatic-ai/awesome-agent-skills)). The Reba review gate applies equally to pulled and self-built skills. Scripts from external sources require Reba + Matt review.

---

## Open Questions for Design Phase

1. **Organic skill creation**: Should personas propose skills ("I keep encountering X, should I create a skill?") or only respond to user requests?
2. **Cross-persona visibility**: Should Neo see Gary's deploy pipeline skill when reviewing architecture?
3. **Skill file length guideline**: Recommend a specific limit (e.g., 50 lines)?
4. **Versioning**: Track changes to skills, or just overwrite?
5. **The "too many skills" threshold**: Soft cap at what number? Research suggests semantic confusability matters more than count.
6. **Library search scope**: Which skill catalogs should the agent check by default? Should this be configurable?

---

## Sources

### Academic Papers
- [SAGE: RL for Self-Improving Agent with Skill Library](https://arxiv.org/abs/2512.17102) (Dec 2025)
- [Self-Improving LLM Agents at Test-Time](https://arxiv.org/abs/2510.07841) (Oct 2025)
- [EvolveR: Self-Evolving LLM Agents](https://arxiv.org/abs/2510.16079) (Oct 2025)
- [MUSE: Experience-Driven Self-Evolving Agent](https://arxiv.org/abs/2510.08002) (Oct 2025)
- [ExpeL: LLM Agents Are Experiential Learners](https://arxiv.org/abs/2308.10144) (2023, updated 2024)
- [Lifelong Learning of LLM Agents: A Roadmap](https://arxiv.org/abs/2501.07278) (Jan 2025)
- [PersonaAgent: LLM Agents Meet Personalization](https://openreview.net/forum?id=fgCOkyJG3f) (NeurIPS 2025 workshop)
- [Why Do Multi-Agent LLM Systems Fail? (MAST)](https://arxiv.org/abs/2503.13657) (Mar 2025)
- [When Single-Agent with Skills Replace Multi-Agent Systems](https://arxiv.org/abs/2601.04748) (Jan 2026)
- [Automated Skill Decomposition: Bridging the Granularity Gap](https://arxiv.org/abs/2510.11313) (Oct 2025)
- [CUA-Skill: Skills for Computer Using Agent](https://arxiv.org/abs/2601.21123) (Jan 2026)
- [STEPS: Compositional Generalization via Skill Taxonomy](https://arxiv.org/abs/2601.03676) (Jan 2026)
- [Survey of Self-Evolving Agents](https://arxiv.org/abs/2507.21046) (Jul 2025)
- [Memory Mechanism of LLM Agents (ACM Survey)](https://dl.acm.org/doi/10.1145/3748302) (2025)

### Frameworks & Practitioner Resources
- [Anthropic skills catalog](https://github.com/anthropics/skills) — Official skills with canonical structure (SKILL.md + scripts/ + references/ + assets/)
- [Anthropic skill-creator](https://github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md) — Official guide for creating skills: progressive disclosure, YAML frontmatter, <500 line body, degrees of freedom
- [awesome-agent-skills](https://github.com/skillmatic-ai/awesome-agent-skills) — Modular SKILL.md framework
- [awesome-llm-skills](https://github.com/Prat011/awesome-llm-skills) — Cross-platform skill catalog
- [AnythingLLM Custom Skills](https://docs.anythingllm.com/agent/custom/introduction) — Plugin-based skill architecture
- [Google ADK Multi-Agent Patterns](https://developers.googleblog.com/developers-guide-to-multi-agent-patterns-in-adk/) (2025)
- [Memory vs RAG (Label Studio)](https://labelstud.io/learningcenter/memory-vs-retrieval-augmented-generation-understanding-the-difference/)

### Key Finding: Anthropic's Official Skill Structure

Anthropic's canonical skill format already mirrors our proposed resume/ structure:

```
skill-name/
├── SKILL.md          # Instructions (YAML frontmatter + markdown, <500 lines)
├── scripts/          # Executable code
├── references/       # Documentation loaded into context on demand
└── assets/           # Files used in output
```

**Progressive disclosure** (3 tiers): metadata always loaded, SKILL.md body on trigger, resources on demand.

**Design implication**: Resume skills should follow this same structure for ecosystem compatibility. No translation needed when pulling skills from catalogs. Personas building skills from scratch follow the same convention the ecosystem already uses.
