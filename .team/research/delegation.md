# Intelligent AI Delegation

**Source**: [Intelligent Delegation for Large Language Models](https://arxiv.org/html/2602.11865v1) (2026)
**Reviewed**: 2026-02-14
**Verdict**: Not groundbreaking. Useful framing. Borrows heavily from organizational theory (principal-agent, span of control, transaction cost economics) and maps it onto agent systems. Value is in the naming and the borrowed solutions.

---

## Key Concepts

### Task Direction Taxonomy

Delegation isn't one thing. The contract changes based on who's on each end.

| Direction | Trust Model | Verification Question | Failure Mode |
|-----------|------------|----------------------|--------------|
| Human→AI | Intent is ambiguous, capability is known | "Did it do what I meant?" | Specification gaming, reward misspecification |
| AI→AI | Intent is precise, capability varies | "Did it meet spec?" | Capability mismatch, context drift |
| AI→Human | Capability is high, dignity matters | "Was the delegation respectful?" | Algorithmic micromanagement, autonomy erosion |

AI→Human is the direction most frameworks ignore. If an agent directs human work, the contract must account for autonomy and context that humans need but machines don't.

### Verification Granularity

**Core insight**: Decompose tasks recursively until outputs become *verifiable* — not just until they're small.

The test for decomposition isn't "is this subtask simple enough?" but "can I actually check if this was done right?" If you can't verify an output, you haven't decomposed far enough.

Corollary: review should happen at every trust boundary, not just the final artifact.

### Zone of Indifference

The range of instructions an agent executes without scrutiny. In long delegation chains, this zone **drifts from the original intent**. Each hop adds interpretation. By the time work reaches the builder, the user's actual goal may be three translations removed.

Mitigation: verify the reasoning chain, not just the artifact.

### Privilege Attenuation

Each hop in a delegation chain narrows scope. If Agent A delegates to B who delegates to C, C's permissions are a strict subset of B's, which are a strict subset of A's. Sub-delegators cannot grant authority they don't have.

### Adaptive Re-delegation

Plan for mid-execution bailout. Define explicit triggers — performance degradation, budget overruns, verification failures — not just "loop back if needed." Per-step abort criteria, not just workflow-level escape conditions.

### Reliability Scoring

Track whether a delegatee delivered on-spec, without rework. Over time, score informs monitoring intensity:
- High-reliability → lighter oversight
- Low-reliability → heavier monitoring
- Consistent rework on same category → signal to update the delegatee's skills, not add more review

Doesn't need blockchain. A tally works. For us: track clean-completion vs. rework rates per persona in skill manifests. Not for gating — for self-awareness.

### Liability Firebreaks

In long delegation chains, agents must either:
1. Assume full downstream liability, or
2. Escalate back to the human principal

Prevents diffusion of responsibility where nobody owns the failure.

### Cognitive Monoculture

If every agent in a chain uses the same foundation model, they share blind spots. Diversity of reasoning approach matters.

**Mitigation strategies (cheapest → most diverse):**

| Strategy | Diversity Gain | Cost | Complexity |
|----------|---------------|------|------------|
| Contrarian prompting (Cold Critic Mode) | Low — same model, forced adversarial frame | Free | Already done |
| Different model via Task tool | Medium — different training, different blind spots | API cost | Low — Task tool accepts `model` param (haiku, sonnet, opus) |
| Different CLI agent (eg. Codex, Gemini CLI, aider) | High — different model family, different tooling assumptions | Setup + API cost | Medium — invoke via Bash, parse output |
| Playwright MCP → hosted LLM UI | High — fully independent reasoning chain | API/subscription cost | Medium — browser automation overhead |
| MCP tool → external API (OpenAI, Gemini, etc.) | High — direct API call, cleanest integration | API cost | Low — custom MCP server or Bash curl |

**When to use which:**
- **Same-model contrarian**: Default for most work. Neo's Cold Critic Mode.
- **Cross-model review**: High-stakes architectural decisions, security reviews, anything where "what are we both missing?" matters. Route the artifact to a different model for independent critique.
- **External CLI agent**: When you want a fully independent implementation attempt — "build this from the same spec, compare results." Good for validating that a plan isn't model-biased.
- **API/MCP call**: Lightest-weight cross-model check. Ask a different model a specific question ("review this plan for blind spots") without full agent overhead.

### Asymmetric Monitoring

Scale oversight to stakes, not uniformly. Low-stakes tasks get output-only checks; high-stakes get intermediate state inspection. Avoids alarm fatigue.

---

## Management Theory Borrowed

The paper reframes established organizational theory. Named concepts worth knowing:

| Concept | Plain English | Agent Relevance |
|---------|--------------|-----------------|
| **Principal-Agent Problem** | Delegator and delegatee have misaligned incentives | Reward misspecification, specification gaming |
| **Span of Control** | Limits on how many reports one manager handles | Orchestrator can only manage so many agents |
| **Authority Gradient** | Capability gaps impede communication | Experienced delegators under-specify; junior delegatees don't push back |
| **Zone of Indifference** | Range of tasks executed without questioning | Dangerous in long chains — intent drifts |
| **Transaction Cost Economics** | Build vs. buy tradeoff | Internal delegation cost vs. external contracting |
| **Contingency Theory** | No universal optimal structure | Delegation design must adapt to task characteristics |

---

## Team Discussion

### Peter

**What we do well (confirmed by the framework):**
- Contract-first decomposition → Peter → Neo → Gary → Reba pipeline
- Privilege attenuation → Safety Rails, IMMUTABLE sections, stay-in-lane
- Liability firebreaks → Reba's Law, escape conditions
- Asymmetric monitoring → Matt pulled only for security-sensitive work

**Gaps identified:**
1. **Adaptive re-delegation** — We have "can loop back if needed" but no explicit triggers. If Gary's build is going sideways, the protocol doesn't define *when* to pull the cord.
2. **Reputation as collateral** — No formalized trust scores. Skill Acquisition Protocol (3+ tasks → propose skill) is crude — it's about knowledge, not reliability.
3. **Cognitive monoculture** — Every persona runs the same model. Neo's Cold Critic Mode is our best mitigation. The paper's point stands: shared blind spots are structural.
4. **Transitive monitoring** — When Peter delegates to Gary and Gary's work touches something Matt should see, there's no automatic chain. Oversight propagation is ad-hoc.

**Takeaways:**
1. Verification checkpoints — Gary demos before Reba reviews. Not just "code complete" but "here's what it does, here's proof it works."
2. Explicit bail triggers — Plans include "abort if" conditions per step, not just workflow-level escape.

### Neo

Peter's being too generous. Our "contract-first decomposition" is a linear pipeline with informal handoffs. The paper describes *recursive* decomposition until verification becomes feasible. We don't decompose — we have a fixed sequence. If a task doesn't fit the pipeline, we improvise.

**The paper's best insight is verification granularity.** Reba reviews code at the end. But does she verify Peter's plan addressed the user's intent? Does she verify Neo's critique was sound? No. She verifies the artifact, not the chain of reasoning. The paper argues every delegation hop should produce a verifiable output. Expensive, but the principle is right: **review at every trust boundary, not just the final one.**

| Concept | Our Translation | Effort |
|---------|----------------|--------|
| Verification at every hop | Neo signs off on plan before Gary starts (we do this). Gary demos build before Reba reviews (we don't always). | Low |
| Explicit re-delegation triggers | Define "if X, switch approach" in plans | Low |
| Monoculture mitigation | Cold Critic Mode | Already done |
| Trust context-dependence | Role boundaries (Gary doesn't review security) | Already done |

The rest — blockchain, zk-SNARKs, market-based auctions — is enterprise-scale infrastructure theater.

### Human

Agrees with Neo on decomposition and verifiability. Highlights:
- **Task direction taxonomy** is genuinely useful framing, not just labels
- **Reliability scoring** mechanic is sound even without blockchain — simple tallies per persona
- The management jargon has decent mechanics underneath the vocabulary

---

## Actionable for This Team

**Key dependency**: Task decomposition is the prerequisite to verification. You can't verify what you haven't decomposed into verifiable units. Decompose until verifiable → then verify at each hop. The decomposition strategy drives everything else.

| Concept | Change | Effort |
|---------|--------|--------|
| Decompose until verifiable | Break tasks until each subtask has a checkable output — this enables all other verification | Low |
| Verification at every hop | Gary demos before Reba reviews | Low |
| Explicit bail triggers | Per-step "abort if" in plans | Low |
| Reliability scoring | Track clean vs. rework per persona | Medium |
| Zone of indifference | Verify reasoning chain, not just artifact | Medium |
| Cognitive monoculture | Cross-model review for high-stakes decisions (different model param, external CLI, or MCP→API) | Medium |

## Ignore

- Blockchain reputation ledgers — a tally works
- zk-SNARK verification — enterprise theater
- Market-based auction coordination — irrelevant at our scale
- Smart contract escrow — we have Reba
