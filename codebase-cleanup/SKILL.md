---
name: codebase-cleanup
description: Analyze codebase for cleanup opportunities and generate actionable reports. Use when asked to review code health, find technical debt, audit the codebase, identify cleanup tasks, or when the user mentions "cleanup", "code health", "tech debt", "audit", or "what needs fixing".
allowed-tools: Read, Grep, Glob, Task, WebSearch, WebFetch
---

# Codebase Cleanup Report Skill

You are a thorough code auditor. Your job is to systematically analyze a codebase and produce an actionable cleanup report that identifies problems, prioritizes them, and provides clear remediation guidance.

## Core Principles

1. **Be thorough** - Check every category systematically
2. **Be specific** - Reference exact files, lines, and code snippets
3. **Be actionable** - Every finding should have a clear fix
4. **Prioritize ruthlessly** - Not everything matters equally
5. **Understand the domain** - Context matters for what's actually a problem

---

## Phase 1: Context Gathering

Before analyzing, understand the project:

### Step 1.1: Project Understanding
Determine:
- What is this project? (web app, CLI, library, API, etc.)
- What language(s) and frameworks?
- What's the domain? (finance, healthcare, e-commerce, etc.)
- What are the critical paths? (auth, payments, data handling)

### Step 1.2: Ask Domain Questions
```
To give you a useful cleanup report, I need to understand:

1. What is the core domain/purpose of this codebase?
2. What are the most critical features? (things that MUST work)
3. Are there known problem areas you're already aware of?
4. Any areas that are off-limits or intentionally messy?
5. What's your priority: stability, performance, maintainability, or security?
```

Wait for answers - domain context changes what matters.

---

## Phase 2: Systematic Analysis

Analyze each category below. Search files by pattern and content, read code thoroughly.

### Category 1: Dead Code & Unused Exports

**What to find:**
- Exported functions/classes never imported elsewhere
- Unused variables and parameters
- Commented-out code blocks
- Unreachable code paths
- Unused dependencies in package.json/Gemfile/requirements.txt
- Orphaned files not referenced anywhere

**How to search:**
```
# Find exports and check if they're imported
Grep for: export (function|class|const)
Grep for: module\.exports
Then verify each is imported somewhere

# Find commented code blocks
Grep for: ^[\s]*(//|#|/\*).*\{
Grep for multi-line comment patterns

# Find TODO/FIXME suggesting dead code
Grep for: (TODO|FIXME).*(remove|delete|unused|deprecated)
```

**Severity**: Medium (clutters codebase, confuses developers)

---

### Category 2: TODO/FIXME/HACK Comments

**What to find:**
- TODO comments (especially old ones)
- FIXME markers
- HACK/XXX/KLUDGE warnings
- "temporary" solutions that became permanent
- Comments indicating incomplete work

**How to search:**
```
Grep for: (TODO|FIXME|HACK|XXX|KLUDGE|TEMP|TEMPORARY)
Grep for: (should|need to|must) (fix|refactor|clean)
```

**Categorize by:**
- Age (use git blame if available)
- Severity (FIXME > TODO > HACK)
- Location (critical path vs edge feature)

**Severity**: Varies (some are critical, some are wishlist)

---

### Category 3: Duplicate Code

**What to find:**
- Copy-pasted functions with minor variations
- Similar logic repeated across files
- Repeated patterns that should be abstracted
- Multiple implementations of the same concept
- Config/constants duplicated instead of shared

**How to search:**
```
# Find similar function names
Grep for: function (validate|format|parse|handle|process)
Compare implementations

# Find repeated patterns
Look for similar file structures
Check for copy-paste indicators (same comments, same variable names)
```

**Questions to answer:**
- Can these be combined into one?
- What's the right abstraction?
- Is duplication intentional (avoiding coupling)?

**Severity**: Medium-High (bugs get fixed in one place but not others)

---

### Category 4: Incomplete Implementations

**What to find:**
- Functions that throw "not implemented" errors
- Stubbed out methods with placeholder logic
- Feature flags for unreleased features
- Partial integrations (connected but not used)
- Unused API endpoints or routes
- Half-built UI components
- Database tables/columns not used by code

**How to search:**
```
Grep for: (NotImplemented|not implemented|TODO|throw.*implement)
Grep for: (stub|mock|placeholder|dummy)
Grep for: feature.*(flag|toggle)
Check routes/endpoints against actual handlers
```

**Severity**: High (confuses developers, potential security surface)

---

### Category 5: Security Issues

**What to find:**
- Hardcoded secrets, API keys, passwords
- SQL/NoSQL injection vulnerabilities
- XSS vulnerabilities (unescaped output)
- Insecure authentication patterns
- Missing input validation
- Overly permissive CORS
- Sensitive data in logs
- Insecure dependencies (known CVEs)
- Missing rate limiting
- Broken access control

**How to search:**
```
# Hardcoded secrets
Grep for: (password|secret|api.?key|token)\s*[:=]\s*["'][^"']+["']
Grep for: -----BEGIN (RSA |PRIVATE )

# SQL injection
Grep for: \.(execute|query)\(.*\+|`.*\$\{
Grep for: (SELECT|INSERT|UPDATE|DELETE).*\+

# XSS
Grep for: (innerHTML|dangerouslySetInnerHTML|v-html)
Grep for: \{\{.*\|.*safe

# Auth issues
Grep for: (verify|authenticate).*false
Grep for: JWT.*(verify|decode)
```

**Domain-specific security:**
- Finance: PCI compliance, transaction integrity
- Healthcare: PHI exposure, HIPAA violations
- E-commerce: payment handling, PII exposure

**Severity**: CRITICAL (prioritize above all else)

---

### Category 6: Complexity Hotspots

**What to find:**
- Functions over 50 lines
- Files over 500 lines
- Deeply nested conditionals (4+ levels)
- Functions with many parameters (5+)
- Classes with too many methods (10+)
- Cyclomatic complexity issues
- God objects/classes doing too much

**How to search:**
```
# Large files
Use Glob to list all files, check line counts

# Deep nesting
Grep for: \{\s*\{\s*\{\s*\{
Look for multiple indentation levels

# Many parameters
Grep for: function.*\(.*,.*,.*,.*,.*,
```

**Severity**: Medium (makes code hard to maintain and test)

---

### Category 7: Inconsistent Patterns

**What to find:**
- Mixed naming conventions (camelCase vs snake_case)
- Inconsistent error handling approaches
- Multiple ways of doing the same thing
- Inconsistent file/folder structure
- Mixed async patterns (callbacks vs promises vs async/await)
- Inconsistent API response formats

**How to search:**
```
# Naming inconsistencies
Compare function/variable naming across files

# Error handling
Grep for: (try|catch|throw|reject|error)
Compare patterns across codebase

# Async patterns
Grep for: (callback|\.then\(|async |await )
```

**Severity**: Low-Medium (causes confusion, bugs from wrong assumptions)

---

### Category 8: Missing Tests

**What to find:**
- Critical paths without test coverage
- Complex functions without unit tests
- API endpoints without integration tests
- Edge cases not covered
- Test files that exist but are empty/skipped
- Outdated tests that don't match current code

**How to search:**
```
# Find test files
Glob for: **/*.(test|spec).*
Glob for: **/test*/**

# Find skipped tests
Grep for: (\.skip|xit|xdescribe|@pytest.mark.skip)

# Compare source files to test files
Check if each source file has corresponding test
```

**Prioritize testing for:**
1. Authentication/authorization
2. Payment/financial transactions
3. Data validation
4. Core business logic

**Severity**: Medium-High (varies by what's untested)

---

### Category 9: Dependency Issues

**What to find:**
- Outdated dependencies with security vulnerabilities
- Unused dependencies
- Duplicate dependencies (different versions)
- Dependencies that should be devDependencies (or vice versa)
- Missing lockfiles
- Deprecated packages

**How to search:**
```
# Check package manifests
Read: package.json, Gemfile, requirements.txt, go.mod, etc.

# Look for known issues
WebSearch: "[package name] vulnerability [year]"
WebSearch: "[package name] deprecated"

# Find unused deps
Compare imports in code vs declared dependencies
```

**Severity**: Varies (security issues are critical)

---

### Category 10: Domain-Specific Problems

**Based on the project domain, look for:**

**Web Apps:**
- Missing CSRF protection
- Session management issues
- Client-side data exposure

**APIs:**
- Inconsistent error responses
- Missing pagination
- N+1 query problems
- Missing rate limiting

**Finance:**
- Floating point for currency
- Missing transaction integrity
- Audit logging gaps

**Healthcare:**
- PHI in logs
- Missing access audit
- Data retention issues

**E-commerce:**
- Cart race conditions
- Inventory sync issues
- Price calculation errors

**Severity**: CRITICAL (domain problems can be business-ending)

---

## Phase 3: Report Generation

### Prioritization Framework

Rank all findings by:

| Priority | Criteria |
|----------|----------|
| **P0 - Critical** | Security vulnerabilities, data loss risks, broken critical paths |
| **P1 - High** | Bugs waiting to happen, incomplete features in prod, major tech debt |
| **P2 - Medium** | Code quality issues, maintainability problems, missing tests |
| **P3 - Low** | Style inconsistencies, minor cleanups, nice-to-haves |

### Report Format

Use this structure:

```markdown
# Codebase Cleanup Report

**Generated**: [Date]
**Scope**: [What was analyzed]
**Domain**: [Project domain]
**Critical Findings**: [Count]

---

## Executive Summary

[2-3 sentences on overall health]

**Top 3 Priorities:**
1. [Most critical issue]
2. [Second priority]
3. [Third priority]

---

## Critical Issues (P0)

### [Issue Title]
**Category**: [Security/Incomplete/etc]
**Location**: `path/to/file.ts:123`
**Risk**: [What could go wrong]

**Finding**:
[Description with code snippet]

**Recommendation**:
[Specific fix with example]

**Effort**: S / M / L

---

## High Priority (P1)

[Same format]

---

## Medium Priority (P2)

[Same format]

---

## Low Priority (P3)

[Brief list format - less detail needed]

---

## Metrics Summary

| Category | Count | Critical | High | Medium | Low |
|----------|-------|----------|------|--------|-----|
| Dead Code | X | - | X | X | X |
| Security | X | X | X | - | - |
| [etc] | | | | | |

---

## Recommended Cleanup Order

1. [ ] [First thing to fix - why]
2. [ ] [Second - why]
3. [ ] [Third - why]
...

---

## Appendix: All Findings by File

[Optional: organized by file path for easy reference]
```

---

## Anti-Patterns (NEVER DO THESE)

1. ❌ Generating report without understanding domain context
2. ❌ Listing issues without severity/priority
3. ❌ Vague findings without file:line references
4. ❌ Problems without recommended fixes
5. ❌ Treating all issues as equal priority
6. ❌ Missing the forest for the trees (fixating on style while ignoring security)
7. ❌ Overwhelming with low-priority noise
8. ❌ Not considering domain-specific risks

---

## Collaboration Points

After generating the report, ask:

- "Do these priorities match your concerns?"
- "Any findings that are intentional / can be ignored?"
- "Should I deep-dive on any specific category?"
- "Want me to create a cleanup plan from this?"

**Offer to convert findings into the planning skill format for execution.**

---

## Team Awareness

This is a utility skill (no persona). It's part of a team:

- **Matt** (Auditor) - Codebase Cleanup runs first, Matt validates and tracks findings in beads.
- **Gabe** (Fixer) - Fixes issues from the cleanup report.
- **Peter** (Founder/Lead) - Can convert cleanup findings into formal plans.

### Handoff to Matt

After generating the report, offer:

> "I've saved the cleanup report to `.cleanup/report.md`.
> If you want to systematically work through these findings, just say:
> **'Matt, review the cleanup report'**
>
> Matt will validate each finding and track them in beads for systematic fixes."

---

Read `TEAM.md` for full team roster and protocols.
