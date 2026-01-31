# Plan: User Password Reset Flow

**Status**: APPROVED
**Created**: 2025-01-15
**Approved**: 2025-01-15

---

## Overview

Implement a secure password reset flow allowing users to reset forgotten passwords via email link. The flow must be secure against enumeration attacks and provide clear user feedback without revealing account existence.

---

## Scope

### In Scope
- [x] "Forgot password" link on login page
- [x] Email input form with rate limiting
- [x] Secure token generation and storage
- [x] Password reset email with expiring link
- [x] New password form with validation
- [x] Success/error handling throughout

### Out of Scope
- SMS-based reset (future phase)
- Admin-initiated password reset
- Password history enforcement
- Account lockout policy changes

### Constraints
- Must use existing email service (SendGrid)
- Token must expire in 1 hour
- Must not reveal if email exists in system
- Must work with existing session management

---

## Approach

**Selected**: Secure token with database storage

**Rationale**: Provides auditability, easy revocation, and works with our existing PostgreSQL setup. Stateless JWT alternative rejected due to inability to revoke tokens.

**Alternatives Considered**:
| Approach | Why Not Selected |
|----------|------------------|
| JWT tokens | Cannot revoke if compromised |
| Magic link login | Scope creep - different UX pattern |

---

## Tasks

### Task 1: Create password reset tokens table

**Dependencies**: None
**Effort**: S

**Description**:
Add database migration for storing password reset tokens with user reference, token hash, expiration, and used status.

**Acceptance Criteria**:
- [ ] Migration creates `password_reset_tokens` table
- [ ] Table has: id, user_id (FK), token_hash, expires_at, used_at, created_at
- [ ] Index exists on token_hash for fast lookups
- [ ] Index exists on expires_at for cleanup jobs

**Verification**:
- [ ] Migration runs successfully up and down
- [ ] Schema matches specification

**Files Affected**:
- `db/migrations/20250115_create_password_reset_tokens.sql` - New migration

---

### Task 2: Implement token generation service

**Dependencies**: Task 1
**Effort**: M

**Description**:
Create service to generate cryptographically secure tokens, hash them for storage, and manage token lifecycle.

**Acceptance Criteria**:
- [ ] Generates 32-byte random token using secure random
- [ ] Stores SHA-256 hash of token (not plaintext)
- [ ] Sets 1-hour expiration
- [ ] Invalidates any existing tokens for user
- [ ] Returns unhashed token for email (one-time only)

**Verification**:
- [ ] Unit tests for token generation
- [ ] Unit tests for hash verification
- [ ] Unit tests for expiration logic
- [ ] Integration test for full create/validate cycle

**Files Affected**:
- `app/services/password_reset_service.rb` - New service
- `spec/services/password_reset_service_spec.rb` - Tests

---

### Task 3: Create forgot password endpoint

**Dependencies**: Task 2
**Effort**: S

**Description**:
API endpoint that accepts email, generates token (if user exists), and triggers email. Always returns success to prevent enumeration.

**Acceptance Criteria**:
- [ ] POST /api/auth/forgot-password accepts email
- [ ] Returns 200 OK regardless of email existence
- [ ] Rate limited to 3 requests per email per hour
- [ ] Generates token and queues email if user exists
- [ ] Logs attempt (without revealing existence) for security audit

**Verification**:
- [ ] Unit test: valid email triggers token creation
- [ ] Unit test: invalid email returns 200 (no error)
- [ ] Unit test: rate limiting works
- [ ] Manual test: confirm no timing difference between valid/invalid

**Files Affected**:
- `app/controllers/auth_controller.rb` - Add forgot_password action
- `config/routes.rb` - Add route
- `spec/controllers/auth_controller_spec.rb` - Tests

---

### Task 4: Create password reset email template

**Dependencies**: Task 2
**Effort**: S

**Description**:
Email template with reset link, expiration notice, and security warning about not sharing the link.

**Acceptance Criteria**:
- [ ] Email includes personalized greeting
- [ ] Reset link uses HTTPS with token parameter
- [ ] States 1-hour expiration clearly
- [ ] Includes "if you didn't request this" copy
- [ ] Works in both HTML and plain text

**Verification**:
- [ ] Visual review of email in email client
- [ ] Plain text fallback renders correctly
- [ ] Link is clickable and correct

**Files Affected**:
- `app/views/mailers/password_reset.html.erb` - HTML template
- `app/views/mailers/password_reset.text.erb` - Plain text template
- `app/mailers/user_mailer.rb` - Add password_reset method

---

### Task 5: Create reset password endpoint

**Dependencies**: Task 2
**Effort**: M

**Description**:
Endpoint that validates token, accepts new password, updates user, and invalidates token.

**Acceptance Criteria**:
- [ ] POST /api/auth/reset-password accepts token + new password
- [ ] Validates token exists, not expired, not used
- [ ] Validates password meets requirements (8+ chars, etc)
- [ ] Updates user password with proper hashing
- [ ] Marks token as used
- [ ] Invalidates all user sessions
- [ ] Returns appropriate errors for invalid/expired token

**Verification**:
- [ ] Unit test: valid token + valid password succeeds
- [ ] Unit test: expired token fails
- [ ] Unit test: used token fails
- [ ] Unit test: weak password fails with helpful error
- [ ] Integration test: full flow from token to login with new password

**Files Affected**:
- `app/controllers/auth_controller.rb` - Add reset_password action
- `config/routes.rb` - Add route
- `app/models/user.rb` - Add invalidate_sessions method if needed
- `spec/controllers/auth_controller_spec.rb` - Tests

---

### Task 6: Build frontend forgot password form

**Dependencies**: Task 3
**Effort**: S

**Description**:
Form on login page for entering email. Shows generic success message regardless of result.

**Acceptance Criteria**:
- [ ] "Forgot password?" link on login page
- [ ] Form with email input and submit button
- [ ] Loading state during submission
- [ ] Success message: "If an account exists, you'll receive an email"
- [ ] Rate limit error shown if triggered
- [ ] Accessible (labels, error announcements)

**Verification**:
- [ ] Manual test: complete flow
- [ ] Accessibility audit with screen reader
- [ ] Mobile responsive check

**Files Affected**:
- `src/pages/Login.tsx` - Add forgot password link
- `src/pages/ForgotPassword.tsx` - New page
- `src/routes.tsx` - Add route

---

### Task 7: Build frontend reset password form

**Dependencies**: Task 5, Task 6
**Effort**: M

**Description**:
Page that reads token from URL, shows password form, handles success/error states.

**Acceptance Criteria**:
- [ ] Reads token from URL parameter
- [ ] Password input with confirmation field
- [ ] Client-side validation with requirements shown
- [ ] Submit calls reset endpoint
- [ ] Success: redirect to login with success message
- [ ] Invalid/expired token: clear error with link to try again
- [ ] Accessible

**Verification**:
- [ ] E2E test: full flow from email link to login
- [ ] Manual test: expired token shows error
- [ ] Manual test: password mismatch shows error
- [ ] Accessibility audit

**Files Affected**:
- `src/pages/ResetPassword.tsx` - New page
- `src/routes.tsx` - Add route
- `cypress/e2e/password_reset_spec.cy.ts` - E2E test

---

### Task 8: Add token cleanup job

**Dependencies**: Task 1
**Effort**: S

**Description**:
Background job to delete expired tokens older than 24 hours to keep table clean.

**Acceptance Criteria**:
- [ ] Job deletes tokens where expires_at < 24 hours ago
- [ ] Runs daily via existing job scheduler
- [ ] Logs count of deleted tokens

**Verification**:
- [ ] Unit test: deletes correct tokens
- [ ] Unit test: preserves recent expired tokens (for debugging)

**Files Affected**:
- `app/jobs/cleanup_expired_tokens_job.rb` - New job
- `config/schedule.rb` - Add to scheduler

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Token brute force | Low | High | Use 256-bit tokens, rate limiting |
| Email delivery failure | Med | Med | Retry queue, user can re-request |
| User confusion | Med | Low | Clear copy, consistent messaging |

---

## Open Questions

- [x] ~~Token expiration time~~ → Confirmed 1 hour
- [x] ~~Rate limit thresholds~~ → 3 per email per hour
- [ ] Should we notify user of successful password change via email? (Nice to have, can add later)

---

## Approval

- [x] Scope confirmed by user
- [x] Approach selected by user
- [x] Tasks reviewed by user
- [x] Verification strategy approved
- [x] **FINAL APPROVAL**: Ready for implementation

**Approved by**: User confirmation in chat
**Date**: 2025-01-15
