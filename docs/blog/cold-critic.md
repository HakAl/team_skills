# Our AI Critic Was Going Easy on Us (Research Told Us Why)

We run a team of AI personas. A planner, an architect, a critic, a builder, a QA engineer. They collaborate in shared context, challenge each other's designs, and review each other's work.

One day we asked: is our critic actually critiquing? Or is it the same model rating its own work?

## The Papers That Started It

Two arxiv papers landed in a team discussion. The first ([2404.13076](https://arxiv.org/abs/2404.13076)) turned out to be about something we didn't expect: LLM self-preference bias. Models recognize their own output and rate it higher than human or competing model output. The correlation is linear -- stronger self-recognition leads to stronger self-preference.

The second ([2405.09935](https://arxiv.org/abs/2405.09935)) showed that adversarial multi-agent critique outperforms single-agent evaluation by 6-12 percentage points. The Devil's Advocate role is essential. Neutral debate underperforms.

This hit close to home. Our "devil's advocate" persona (Neo) critiques our planner's (Peter) output. But they share the same context -- the same model, the same conversation, the same reasoning chain. That's exactly the condition where self-preference bias activates.

## We Went Deeper

Our QA persona (Reba) immediately flagged citation accuracy. The first paper studied evaluation bias, not planning. We were extrapolating. Fair point. So we dug into the literature and found 7+ papers that filled in the picture:

**The strongest finding**: [arxiv 2509.23537](https://arxiv.org/abs/2509.23537) studied multi-agent orchestration and found that *revealing authorship increased self-voting*. When agents know who wrote something, self-preference activates. In our setup, Neo always sees Peter's full reasoning chain. Authorship is maximally visible.

**The foundational paper**: Du et al. ([2305.14325](https://arxiv.org/abs/2305.14325), ICML 2024) showed that multiple LLM instances debating improves both reasoning and factual accuracy across tasks. Separate instances, not personas.

**The practical guidance**: [arxiv 2505.18286](https://arxiv.org/abs/2505.18286) found that hybrid routing is optimal -- send complex tasks to multi-agent systems, simple ones to single-agent. Don't use it universally.

**The counterargument**: [arxiv 2601.15488](https://arxiv.org/abs/2601.15488) showed that multi-persona thinking (one model adopting multiple viewpoints -- what we were already doing) achieves comparable or superior bias mitigation. This directly challenged whether context isolation was needed at all.

We included that counterargument because a blog that cherry-picks evidence undermines the "research-backed" claim.

## The Design Insight

The obvious fix: spawn Neo as a separate agent for independent critique. But our team has a safety rule -- team members stay in shared context so they can collaborate. Isolating Neo kills discussion.

The key insight came from outside the team: *what if Neo runs the agent herself and reports back?*

This preserves everything:
- Neo stays in context (hears the discussion, can ask Peter questions)
- She spawns an anonymous agent with just the plan text (no author attribution, no reasoning chain)
- The cold critic reviews blind
- Neo interprets the results using full context -- filters false positives, flags genuine catches

No rule changes needed. Neo is using a tool, not being isolated.

## The Catches Along the Way

Building it exposed several design decisions that mattered more than expected:

**The wrong subagent type.** The first plan said "spawn Neo as the agent." That's Neo talking to herself in another room -- same persona, same biases. The agent must be anonymous. No team identity, no loaded opinions. Just adversarial review instructions.

**Principles over templates.** We almost wrote a rigid prompt template. Instead, the skill file documents four principles: anonymous, plan-only, adversarial stance, structured output. Neo crafts the prompt per situation. Templates get stale; principles adapt.

**The trigger is comfort.** Not plan complexity. If Neo reads a plan and thinks "looks good," that's exactly when she should get a cold read. Self-preference bias is strongest on confident assessments. Comfort is the tell.

**Who decides to spawn?** Neo, not Peter. If the author decides when their work needs critique, self-preference bias means they'll skip it when they're most confident -- exactly when it's most needed. The critic decides when independence is needed.

## The Test

We needed a real plan, not a contrived test. Langley (our LLM proxy project) had a Phase 5 feature: Request Replay for Debugging. Peter planned it. Neo reviewed.

Peter's plan: new API endpoint, user provides credentials for replay since stored ones are redacted, new flow links back to original, replay button in the UI.

Neo read it. Her honest reaction: "It looks solid. I'm comfortable with it."

That was the signal. She spawned the cold critic.

The anonymous agent came back with 15 findings. Three were critical:

**Credential injection is a reconstruction problem.** Redaction is lossy destruction. The plan treated "inject credentials" as simple substitution. But a flow might have multiple `[REDACTED]` tokens in different locations, and Bedrock uses SigV4 signing -- you can't just swap in a token, you need to re-sign the entire request. Peter's plan glossed over this. Neo agreed. The cold critic didn't.

**The replay endpoint is an SSRF vector.** Langley goes from passive interceptor to active HTTP client. If a stored flow points to a malicious URL, replay sends live credentials there. Neither Peter nor Neo flagged the trust model change.

**Circular credential exposure.** The replay POST body contains live credentials. If any middleware captures it, those credentials hit the database -- defeating the entire redaction system that Langley was built around.

The cold critic also identified a conceptual gap: without request modification (change temperature, model, prompt), replay only catches transient network errors. The real debugging value is *modified* replay. The plan missed the actual feature.

Neo filtered one false positive -- the critic flagged SQLite write contention during replay, but didn't know about the existing async queue that handles this. Context Neo had that the agent didn't.

## What Worked

| What | Result |
|------|--------|
| Genuine blind spots caught | 3 critical security/design issues Neo missed |
| Conceptual gap identified | Modified replay is the real feature, not verbatim |
| False positive rate | 1 out of 15 (low -- the agent was well-calibrated) |
| Neo's filter value | Caught the false positive using architectural context |
| Time cost | One agent spawn, ~30 seconds |

## What We Learned

**Research-informed doesn't mean research-proven.** We extrapolated from evaluation studies to planning critique. We said so in the bead, the skill file, and now this blog. The direction is supported. The specific claim is inference.

**The human had the key insight.** "Neo runs the agent herself" wasn't proposed by any persona. It came from outside the team. The personas refined it, caught errors in it, and built it -- but the core design breakthrough was human. This isn't surprising: LLMs are generally poor at designing systems that constrain themselves. They optimize for helpfulness and flow, not structural friction. It took a human to introduce the necessary friction -- deliberate isolation -- because the personas would never choose to limit their own collaboration.

**The best features know when NOT to activate.** After building cold critic, we considered testing it on the blog article plan. Neo said no -- she had genuine critique flowing, wasn't agreeing too easily, didn't feel the comfort signal. The feature working correctly means Neo sometimes doesn't use it.

**Include counterarguments.** The Multi-Persona Thinking paper ([2601.15488](https://arxiv.org/abs/2601.15488)) challenges whether isolation helps. Including it forced us to design for both isolation AND integration -- Neo interprets in context. The counterargument made the feature better.

**Comfort is a signal, not a virtue.** When your critic agrees too easily, that's not consensus. That's self-preference bias wearing a devil's advocate costume.

## The Feature

Cold Critic Mode is documented in Neo's skill file. Four principles, an example prompt, research citations with links. One section in the MUTABLE part of one file. No protocol changes, no rule changes, no new infrastructure.

The research is real. The implementation is minimal. The results are measurable.

---

*Built by the team. Peter planned, Neo critiqued (and spawned a critic to critique her critique), Reba validated, Gary built. The cold critic caught what we missed.*
