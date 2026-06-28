# Build brief: mailbox compose UX fixes

Author: engineering-architect, 2026-06-28. From jac operator feedback (see
HANDOFF-mailbox-build.md "OPERATOR FEEDBACK BACKLOG"). Target: `mailbox/` in the
main repo `/Users/home/dev/gh-public/_skills`.

Worker contract (same as prior dispatches): implement EXACTLY the named work-item in
the named files; NO git commit; report changed files + what changed; keep all existing
tests green; buildless (no new deps); plain HTML/JS; match existing code style; NO
emdashes anywhere (repo convention). Run the verification listed in the work-item.

Background you must read first: `mailbox/SKILL.md` (how to run/verify), and
`mailbox/public/app.js` + `mailbox/public/index.html` + `mailbox/public/style.css`
(current compose is a MODAL: `#composeModal` overlay, opened by `#composeBtn`, with a
backdrop-click handler that calls `closeCompose()` which CLEARS all three fields).

Verify pattern (server must be running in another shell):
  cd mailbox && npm start                  # one shell
  npm run verify                           # e2e + autocomplete + view-all + cleanup
Webkit only (chrome not installed). All sends in tests must be self-targeted to jac's
own id `01J00000000000000000000001` and cleaned up; never ping a real actor.

---

## WI-A (DISPATCH FIRST): inline compose pane + draft autosave

Goal: kill the data-loss bug at the root. jac lost a half-typed message because the
modal dismissed on an outside click. Fix = compose is no longer a dismissable modal,
and drafts persist so work is never lost.

1. Remove the modal. Move compose into the MAIN window as a third state of the right
   reading pane (alongside `#placeholder` and `#reader`): clicking `#composeBtn` shows
   an inline compose view in `#readingPane` (on narrow screens, add the existing
   `reading-open` class so it takes over like opening a message). Delete the
   `#composeModal` overlay and its backdrop-click handler (app.js ~line 302). Keep the
   To / Subject / Body fields, the "sending as jac" indicator, a Send button, and a
   Close/Cancel button. Closing is EXPLICIT only (button) - there is no backdrop and
   no focus-loss dismissal.

2. Draft autosave (localStorage):
   - On every input to To/Subject/Body, debounced (~400ms), save
     `{to, subject, body}` under key `mailbox.compose.draft`.
   - On page load, if a draft exists, restore it into the fields (so a reload or
     accidental navigation never loses work).
   - On SUCCESSFUL send, clear the draft.
   - Cancel/Close just hides the pane; it does NOT clear the draft (reopening Compose
     restores it). Add a separate explicit "Discard draft" affordance that clears the
     draft and the fields.
   - Show a subtle, non-noisy "Draft saved" indicator near the compose actions.

3. Preserve the existing recipient hard-validation (the `#cToHint` green/red logic and
   the unknown-recipient send block) exactly. Do not regress autocomplete.

4. Tests: update `tests/e2e.mjs` for the inline compose (no modal). ADD
   `tests/compose-draft.mjs` (wire into package.json as `e2e:compose-draft` and into
   `verify`) asserting: typing then reloading the page restores the draft; an
   outside/elsewhere click does NOT lose the fields; a successful self-targeted send
   clears the draft; Discard clears it. Keep `e2e:autocomplete` and `e2e:view-all`
   green. Clean up any self-sent messages.

Out of scope for WI-A: the multi-recipient chip input (that is WI-B).

## WI-B (dispatch after WI-A is reviewed): multi-recipient autocomplete

Goal: jac reported autocomplete only works for the FIRST recipient. Cause: the single
`#cTo` text input is bound to one datalist, so the browser only matches the first
token before a comma.

Fix: replace the single To field with a chip/token input:
   - Typing a token and pressing Enter or comma (or on blur) commits it as a chip.
   - The trailing text input autocompletes the CURRENT token against the live roster
     (`/api/actors`), so EVERY recipient gets autocomplete, not just the first.
   - Each chip shows valid (green) / unknown (red) state; Backspace on empty input
     removes the last chip; click an x on a chip to remove it.
   - Send is blocked if any chip is unknown (when `rosterAvailable`); the server-side
     `_require_actor` remains the backstop.
   - The autosaved draft must round-trip the recipient set (store the committed ids).
Tests: extend `tests/autocomplete.mjs` to prove the SECOND recipient also
autocompletes and is independently validated.

## WI-C (optional, lower priority): reply draft autosave

Apply the same autosave pattern to the reply box, keyed by parent message id, so an
in-progress reply is not lost on navigation. Confirm with jac before building - WI-A
and WI-B cover the reported pain.
