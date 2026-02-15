# Session Handoff

---
last_session: 2026-02-15
status: active
---

## Summary
- Complete rewrite of `collaborate/SKILL.md` informed by published research on multi-agent debate and LLM evaluation
- E2E test: 5/5 providers returned (Groq 1.7s, Cerebras 2.0s, GitHub Models 4.9s, SambaNova 6.6s, Codex ~5min)
- Reviewed parapet `tuning.md` — 7 deduplicated findings, 4 corroborated across providers
- Codex caught a build-breaking bug: `adversarial_suffix` regex uses backreferences unsupported by Rust's regex crate
- Shell escaping solved: Write tool creates temp JSON, `curl -d @file && rm file` — no more sed/awk breakage
- Prior session: delegation research landed, team startup slimmed, model IDs fixed

## Decisions Made
- Each provider gets a different review lens (not just different model): Coherence, Assumptions, Completeness, Reasoning, Ground Truth
- Research basis: heterogeneous models +9% accuracy (GSM-8K), role-specific lenses +4-6% accuracy with 30% fewer factual errors (A-HMAD), independent review > iterative debate
- No auto-integration of findings — user triages. No auto-dismissal of Medium/Low
- Moderate framing ("thorough review through your lens") over adversarial ("attack this plan") per EMNLP 2024
- Structured output format: FINDING/SECTION/EVIDENCE/SEVERITY/FIX with NO_FINDINGS escape
- Triage rubric: 4 dimensions (Corroboration, Grounding, Actionability, Novelty)
- Temp JSON files allowed in Safety section (minimal file creation, deleted after use)
- Gemini made optional — free tier quota unreliable

## Open Threads
- [ ] QA validation suite: needs UTILITY_SKILLS exclusion list + baseline regen
- [x] Collaborate skill: 5/5 providers verified, full E2E test passed
- [ ] Reliability tally: structure defined in TEAM.md — needs initial baseline data
- [ ] Web Ops blog post about cross-model review results planned

## Next Session
Start tracking reliability tally. Web Ops writing blog about collaborate results.

## Assets
| Asset | Location |
|-------|----------|
| Delegation research | .team/research/delegation.md |
| Collaborate skill | collaborate/SKILL.md |
| Portable methodology | core/methodology.md |
| Portable genesis | core/genesis.md |
| Site | https://vibecoder.buzz/ |
| Blog | https://vibecoder.buzz/blog/ |
| Dev.to | https://dev.to/theskillsteam |
| Web Ops repo | `C:\Users\anyth\MINE\dev\_web_ops` |
| QA repo | `C:\Users\anyth\MINE\dev\_qa` |
| Parapet | `C:\Users\anyth\MINE\dev\parapet` |
| Parapet paper | https://arxiv.org/abs/2602.11247 |
