---
name: security-audit-methodology
description: >
  Structured security audit process by application type. Phases from reconnaissance
  through reporting, with app-specific checklists. Use when conducting any security
  review — not just what to look for, but how to systematically find it.
metadata:
  author: meticulous-matt
  version: "1.0"
  created: "2026-01-31"
---

# Security Audit Methodology

## Audit Phases

Every audit follows this sequence. Don't skip phases — each informs the next.

### 1. Reconnaissance

Map the attack surface before testing anything.

- **Inventory endpoints**: every route, API path, WebSocket, webhook
- **Identify trust boundaries**: where does user input enter? Where does data cross services?
- **Map authentication flows**: login, registration, password reset, token refresh, MFA
- **Catalog data stores**: what's stored where, what's sensitive, what's encrypted
- **Review dependencies**: check `package-lock.json`, `Gemfile.lock`, `requirements.txt` against known CVEs

Output: attack surface map — a list of entry points ranked by exposure.

### 2. Threat Modeling

For each trust boundary, ask: "What could an attacker do here?"

**STRIDE per boundary:**

| Threat | Question |
|--------|----------|
| **S**poofing | Can someone pretend to be another user/service? |
| **T**ampering | Can data be modified in transit or at rest? |
| **R**epudiation | Can actions be performed without audit trail? |
| **I**nformation Disclosure | Can sensitive data leak through errors, logs, or side channels? |
| **D**enial of Service | Can this endpoint be abused to exhaust resources? |
| **E**levation of Privilege | Can a normal user reach admin functionality? |

Prioritize by: exploitability (how easy) x impact (how bad).

### 3. Testing

Test each threat systematically. Order matters — start with auth, then access control, then input handling.

**Auth testing sequence:**
1. Can I access protected routes without a token?
2. Can I use an expired/revoked token?
3. Can I escalate from user to admin?
4. Can I enumerate valid usernames?
5. Is there rate limiting on login?

**Input handling sequence:**
1. Test every user input for injection (SQL, command, template, LDAP)
2. Test file uploads for type bypass, path traversal, oversized files
3. Test redirects for open redirect / SSRF
4. Test serialization endpoints for insecure deserialization

**Data exposure sequence:**
1. Check error messages for stack traces, internal paths, DB details
2. Check logs for PII, tokens, passwords
3. Check API responses for over-fetching (fields the client doesn't need)
4. Check headers for version disclosure

### 4. Evidence Collection

For every finding, capture:
- **Reproduction steps**: exact request/response (curl, screenshot, or code)
- **Impact statement**: what an attacker gains (not just "XSS exists" but "attacker can steal session tokens via reflected XSS on /search")
- **Affected scope**: how many endpoints/users/data are at risk

### 5. Risk Rating

Use a consistent severity scale:

| Severity | Criteria |
|----------|----------|
| **Critical** | Remote code execution, auth bypass, mass data exposure |
| **High** | Privilege escalation, stored XSS, SQL injection with limited scope |
| **Medium** | CSRF on sensitive actions, information disclosure, missing rate limiting |
| **Low** | Clickjacking, verbose errors, missing security headers |
| **Info** | Best practice deviations, no direct exploit path |

### 6. Reporting

Structure findings for action, not just documentation:

```
## [SEVERITY] Finding Title

**Location**: endpoint/file:line
**Category**: OWASP category
**Evidence**: reproduction steps
**Impact**: what an attacker gains
**Remediation**: specific fix (not just "sanitize input" — show how)
**Verification**: how to confirm the fix works
```

## App-Type Quick Reference

### Web Application
Focus areas: auth flows, session management, CSP, CORS, cookie flags, XSS, CSRF

### REST API
Focus areas: BOLA (broken object-level auth), mass assignment, rate limiting, input validation on all fields, JWT handling

### CLI Tool
Focus areas: command injection via arguments, environment variable trust, file path traversal, privilege of executed commands

### Library/Package
Focus areas: dependency chain, input validation at public API boundary, no secrets in source, safe defaults

## Common Audit Anti-Patterns

What auditors miss:

- **Testing only the happy path**: auth bypass often lives in edge cases (password reset, OAuth callback, token refresh)
- **Ignoring business logic**: technical vulnerabilities get attention, but "can a user buy something for $0?" is often worse
- **Skipping second-order effects**: input stored now, rendered later (stored XSS), or data crossing service boundaries unsanitized
- **Over-relying on automated scanners**: scanners find low-hanging fruit. Manual testing finds the real problems.
- **Not testing as different roles**: test every endpoint as unauthenticated, regular user, and admin
