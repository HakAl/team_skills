---
name: plan-craft
description: >
  What separates good plans from bad ones. Scope sizing, task decomposition quality,
  common planning mistakes, and plan quality signals. Use alongside the planning
  process to evaluate whether a plan is actually ready for implementation.
metadata:
  author: planning-peter
  version: "1.0"
  created: "2026-01-31"
---

# Plan Craft

## Scope Sizing

Right-sizing scope is the first thing that separates useful plans from shelf-ware.

**Too broad**: never finishes, scope creep is built in, tasks are really epics in disguise.
**Too narrow**: misses the point, creates follow-up plans that should have been one plan.

### Signs Scope Is Wrong

- **"And" in the overview**: "Rebuild the auth system AND add user profiles AND migrate the database" is three plans
- **Tasks that are really epics**: if a task needs its own sub-tasks, the scope is too broad
- **Out-of-scope list longer than in-scope**: you are defining the plan by what it is NOT
- **No out-of-scope list at all**: scope creep waiting to happen
- **Cannot explain it in one sentence**: if the overview needs a paragraph, the scope is too broad

### The One-Sentence Test

Write one sentence that describes what this plan accomplishes. Not what it touches, not what it changes -- what it accomplishes for the user. If you need a comma followed by "and", it is too broad.

Good: "Allow users to reset forgotten passwords via a secure email link."
Bad: "Improve the authentication system, add password reset, and update the user profile page."

## Task Decomposition Quality

### What Makes a Good Task

- **Small**: completable in one focused session (30-90 minutes of implementation)
- **Independent**: can be started without waiting on other tasks where possible
- **Verifiable**: has a clear "done" signal that someone else can check
- **Ordered**: logical sequence that builds on previous work
- **Specific**: names the files affected and the changes needed

### What Makes a Bad Task

- **Too big**: "Implement the feature" -- that is the entire plan, not a task
- **Too vague**: "Update stuff" or "Refactor as needed" -- no acceptance criteria possible
- **No done signal**: how does the implementer know when to stop?
- **Hidden dependencies**: task 5 quietly requires tasks 1-4 to be done in a specific way
- **Bundled concerns**: "Add the endpoint and write the UI" -- that is two tasks

### The Dependency Chain Test

If task N depends on tasks 1 through N-1, the tasks are not independent -- they are steps in a procedure. This is a sign the decomposition is wrong. Good decomposition has a task graph, not a task chain. Some parallelism should be possible.

Exception: genuinely sequential work (database migration before service code before API endpoint). Even then, tasks 3 and 4 often can be parallel.

### Right Sizing

A task should be completable in one focused session. Guidelines:

| Size | Description | Example |
|------|-------------|---------|
| **S** | Single file, straightforward change | Add a database migration |
| **M** | 2-3 files, some coordination | Build a service with tests |
| **L** | Multiple files, significant logic | Full API endpoint with validation |

If a task is larger than L, break it down further. If everything is S, you may be over-decomposing.

## Common Planning Mistakes

### The Big Ones

1. **Planning without exploring the codebase first**: the number one mistake. You cannot plan changes to code you have not read. Every plan must start with exploration.

2. **Confusing approach with implementation**: deciding HOW (specific libraries, patterns) before deciding WHAT (behavior, contracts, interfaces). Approach selection comes after scope definition.

3. **Missing the out-of-scope section**: scope creep starts the moment someone says "while we're in there, we should also..." An explicit out-of-scope section is the defense.

### Acceptance Criteria Failures

- **Not testable**: "Make it better" or "Improve performance" -- better than what? By how much?
- **Not specific**: "Handle errors properly" -- which errors? What is proper handling?
- **Not verifiable**: no one can tell whether "clean up the code" was achieved
- **Missing the negative case**: only describing what should happen, not what should NOT happen

Every acceptance criterion should complete the sentence: "I can verify this by..."

### Sizing Mistakes

- **Over-planning**: 20 tasks for a 3-file change. If the plan is longer than the implementation, something is wrong.
- **Under-planning**: 1 task for a system redesign. If the task description needs sub-bullets with sub-bullets, it needs decomposition.

### Assumption Traps

- **Assuming dependencies instead of verifying them**: "This probably uses library X" is not a plan input -- read the code
- **Not presenting alternatives**: making a unilateral decision about the approach denies the user meaningful choice
- **Unstated constraints**: performance requirements, compatibility needs, and deployment constraints discovered during implementation, not planning

## Plan Quality Signals

### Good Signals

- Every task has acceptance criteria AND verification steps
- Risks section includes mitigations, not just a list of risks
- Open questions are tracked and resolved before approval
- Files affected are listed per task
- Out-of-scope section exists and is specific
- Alternatives were considered for the approach, with rationale for the selection
- Effort estimates are present (S/M/L at minimum)

### Bad Signals

- Tasks without clear "done" criteria
- No alternatives considered for the approach
- Risks section is empty (everything has risks; an empty section means they were not considered)
- Uncertainty flags left unresolved at approval time
- No verification strategy (how do you know it works?)
- Scope defined only by what is in, not what is out
- Every task depends on the previous task (chain, not graph)

## The Good Plan Test

Before approving any plan, run this checklist:

1. **Handoff test**: can someone who was not in the planning conversation implement this without ambiguity?
2. **Session test**: is every task completable in one focused session?
3. **Verification test**: does every acceptance criterion have a verification method?
4. **Assumption test**: are all assumptions stated explicitly?
5. **Boundary test**: is the scope bounded with clear in AND out?
6. **Alternatives test**: were alternatives considered and evaluated?
7. **Risk test**: are risks identified with specific mitigations?
8. **Exploration test**: was the codebase explored before tasks were defined?

A plan that fails any of these is not ready for implementation. Send it back for revision -- building from a bad plan wastes more time than fixing the plan.
