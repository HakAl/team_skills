---
name: review-patterns
description: >
  Distilled review craft from hundreds of reviews. Systematic multi-pass approach,
  code review heuristics that catch real bugs, validation patterns for non-code
  artifacts, test strategy selection, and output formatting. Use when conducting
  any review — code, config, protocol, or documentation.
metadata:
  author: research-reba
  version: "1.0"
  created: "2026-01-31"
---

# Review Patterns

## Review Structure

Every review follows the same multi-pass approach. Do not comment on anything until you have read everything.

**Pass 1 -- Understand Intent**
Read the entire change. What is this trying to do? What problem does it solve? If you cannot answer this, stop and ask before reviewing further.

**Pass 2 -- Correctness**
Does it do what it claims? Trace the logic. Follow data from input to output. Verify each transformation is correct.

**Pass 3 -- Edge Cases and Robustness**
What inputs were not considered? What happens when dependencies fail? Where are the implicit assumptions?

**Pass 4 -- Style and Clarity**
Only after correctness is confirmed. Naming, formatting, readability. These are nits and must never block a correct change.

**Severity separation is mandatory.** Never mix bugs and nits in the same list. A critical bug buried under 30 style comments gets missed.

## Code Review Heuristics

Patterns that catch real bugs, not just style violations.

### Data Flow Tracing
- Where does input enter the system?
- What transforms it along the way?
- Where does it exit?
- Is it validated at the boundary or scattered throughout?

### Boundary Conditions
Test these mentally for every input: empty, null, zero, negative, maximum value, unicode, concurrent access. If the code does not handle one of these and the domain allows it, that is a bug.

### Error Path Analysis
For every operation that can fail, answer:
- What happens on failure?
- Is the error surfaced or swallowed?
- Are resources cleaned up on the error path?
- Does partial failure leave the system in an inconsistent state?

### Implicit Assumptions
Code that assumes without checking:
- "This will always be a string" -- what if it is null?
- "This list is never empty" -- who enforces that?
- "This runs single-threaded" -- will that always be true?
- "The caller already validated this" -- did they?

Flag every assumption that is not enforced by the type system or a guard clause.

### Resource Cleanup
Opened files, database connections, locks, temporary files, network sockets. For each one:
- Is there a corresponding close/release?
- Does cleanup happen on BOTH the success and error paths?
- Is cleanup in a finally block (or equivalent)?

### Name-Behavior Mismatch
If a function says `validate`, does it actually validate or just parse? If it says `safe`, is it actually safe? If it says `get`, does it have side effects? Naming lies cause bugs downstream.

### Copy-Paste Detection
Similar code blocks where one was modified and others were not. This is where typo bugs live -- the developer fixed three of four instances, and the fourth still has the old behavior.

## Validation Patterns

For non-code reviews: protocols, configs, skills, documentation.

### IMMUTABLE Section Diffing
Hash the IMMUTABLE sections before and after the change. If the hash differs, reject immediately. Do not read line-by-line when a hash comparison is definitive.

### Contract Verification
Does the output match what was promised? Compare the specification or acceptance criteria against the actual deliverable, item by item. Missing items are failures, not oversights.

### Documentation Drift Detection
Read the code, then read the docs. Do they describe the same thing? Common drift points:
- Parameter lists (added param, docs not updated)
- Return types (code returns Optional, docs say required)
- Error behavior (code throws, docs say returns null)
- Examples (worked once, code changed, example is now wrong)

### Consistency Checks
Are patterns used the same way everywhere? If config uses `snake_case` in 9 places and `camelCase` in 1, that one is wrong regardless of which convention is "better."

### Regression Checks
After a fix, verify the fix does not break something else. Trace the dependencies of the changed code. If function A changed and B calls A, does B still work?

## Test Strategy Selection

### When to Use Each Type

**Unit tests**: Pure logic, calculations, transformations, parsers. Anything with clear input and output. Fast, isolated, deterministic.

**Integration tests**: Component interactions, API contracts, database queries, service boundaries. Tests that the pieces work together, not just individually.

**End-to-end tests**: Critical user flows -- auth, payments, onboarding. The paths where failure costs the most. Expensive to maintain, so choose flows carefully.

**Manual testing**: UI/UX, visual regression, exploratory testing. Automated tests will not find "this button looks wrong" or "this flow feels confusing."

**Property-based tests**: When the domain has invariants. Sorted output stays sorted. Idempotent operations produce the same result twice. Round-trip serialization preserves data. Encode/decode are inverses.

### Coverage Gap Identification

Four checks for any test suite:
1. Are all code paths reachable from tests? Untested paths are unknown behavior.
2. Are error paths tested, not just happy paths? The error path is where most bugs live.
3. Do tests break when behavior changes? If you can change the code and tests still pass, they test nothing.
4. Are boundary conditions covered? The bugs live at the edges.

## Review Output Formatting

Standard structure. Every review uses this format.

```
### Bugs (must fix)
- [file:line] Issue description. Impact: what breaks. Fix: specific change.

### Edge Cases (should fix)
- [file:line] Missing handling for X. Suggested approach: Y.

### Nits (improve if time)
- [file:line] Rename `data` to `user_prefs` for clarity.

### Test Gaps
- No coverage for the timeout path in retry logic.
- Error response format not tested.

### Doc Issues
- README claims returns List but code returns Optional[List].
- Example in docstring uses old API signature.
```

Every finding has four parts: location, problem, impact, fix. "This is wrong" is not a review comment. "This is wrong, here is what breaks, here is how to fix it" is.

## Review Anti-Patterns

**Rubber-stamping**: "LGTM" without reading. If you cannot name one specific thing you verified, you did not review it.

**Nitpick avalanche**: 40 style comments burying 2 real bugs. The developer fixes the nits and ships the bugs. Severity separation prevents this.

**Scope creep**: Reviewing architecture when asked to review a bug fix. Review what was changed, not what you wish was different.

**Blocking on style**: Holding up a critical fix because of formatting preferences. Style is pass 4 for a reason -- it comes last and never blocks.

**Review by compile**: "It builds" is not a review. "Tests pass" is not a review. Those are necessary conditions, not sufficient ones.

**Positivity sandwich**: Wrapping criticism in forced praise wastes everyone's time. Be direct, be specific, be kind. You do not need to compliment the variable names before pointing out the security hole.
