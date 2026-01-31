---
name: accessible-component-patterns
description: >
  Hands-on accessibility patterns per UI component type. Keyboard interactions,
  ARIA attributes, focus management, and screen reader behavior for common
  components. Use when building any interactive UI element.
metadata:
  author: greenfield-gary
  version: "1.0"
  created: "2026-01-31"
---

# Accessible Component Patterns

## Component Patterns

### Button
- Use `<button>`, never `<div onclick>` or `<a>` for actions
- Toggle buttons: `aria-pressed="true|false"`
- Icon-only buttons: `aria-label="descriptive text"`
- Loading state: `aria-disabled="true"` + `aria-busy="true"`, keep label readable
- Keyboard: `Enter` and `Space` activate

### Link vs Button
- **Link**: navigates somewhere (`<a href>`)
- **Button**: does something (`<button>`)
- Never use `<a>` without `href`. Never use `<a href="#" onclick>` for actions.

### Modal Dialog
- `role="dialog"` + `aria-modal="true"` + `aria-labelledby="title-id"`
- **Focus trap**: Tab cycles within modal, never escapes to background
- On open: move focus to first focusable element (or the close button)
- On close: return focus to the element that triggered the modal
- `Escape` closes the modal
- Background content: `aria-hidden="true"` on content behind modal, or `inert` attribute

### Dropdown Menu
- Trigger: `aria-haspopup="true"` + `aria-expanded="true|false"`
- Menu: `role="menu"`, items: `role="menuitem"`
- Keyboard: `Enter`/`Space` opens, `ArrowDown`/`ArrowUp` navigates, `Escape` closes
- On open: focus moves to first menu item
- On close: focus returns to trigger

### Tabs
- Container: `role="tablist"`
- Tab: `role="tab"` + `aria-selected="true|false"` + `aria-controls="panel-id"`
- Panel: `role="tabpanel"` + `aria-labelledby="tab-id"`
- Keyboard: `ArrowLeft`/`ArrowRight` between tabs, `Tab` moves into panel content
- Active tab: `tabindex="0"`, inactive tabs: `tabindex="-1"`

### Combobox (Autocomplete)
- Input: `role="combobox"` + `aria-expanded` + `aria-controls="listbox-id"` + `aria-autocomplete="list|both"`
- Options: `role="listbox"` > `role="option"`
- Active option: `aria-activedescendant="option-id"` on the input
- Keyboard: `ArrowDown`/`ArrowUp` navigate options, `Enter` selects, `Escape` closes list
- Announce result count: live region with "X results available"

### Toast / Notification
- Use `role="status"` (polite) for info, `role="alert"` (assertive) for errors
- Add `aria-live="polite"` or `aria-live="assertive"`
- Don't auto-dismiss error toasts — user may need time to read
- Info toasts: auto-dismiss is OK (5+ seconds), provide pause on hover
- Don't stack too many — screen readers announce each one

### Form
- Every input needs a `<label>` with `for` attribute (or wrapping)
- Error messages: `aria-describedby` pointing to error text + `aria-invalid="true"`
- Required fields: `aria-required="true"` (or HTML `required`)
- Group related fields: `<fieldset>` + `<legend>`
- Submit feedback: announce success/failure via live region, not just visual change

### Accordion
- Trigger: `<button>` with `aria-expanded="true|false"` + `aria-controls="panel-id"`
- Panel: region with `role="region"` + `aria-labelledby="trigger-id"`
- Keyboard: `Enter`/`Space` toggles, standard focus order (no arrow key nav needed)

## Focus Management Patterns

### Focus Trap
Contain focus within a region (modals, drawers):
- Track first and last focusable elements
- On `Tab` from last: move to first
- On `Shift+Tab` from first: move to last
- Use `inert` attribute on background content when available

### Focus Restoration
When closing an overlay, return focus to the trigger:
- Store `document.activeElement` before opening
- Restore on close
- If trigger no longer exists, focus nearest logical ancestor

### Skip Link
First focusable element on the page, hidden until focused:
- "Skip to main content" linking to `<main>` or `#content`
- Visible on `:focus`, hidden otherwise
- Must be the first item in tab order

### Roving Tabindex
For widget-internal navigation (tabs, toolbars, menus):
- Active item: `tabindex="0"`
- All other items: `tabindex="-1"`
- Arrow keys move focus and update tabindex values
- `Tab` exits the widget entirely

## Screen Reader Patterns

### Live Regions
- `aria-live="polite"`: announced after current speech finishes (status updates, search results count)
- `aria-live="assertive"`: interrupts current speech (errors, urgent alerts)
- Add the live region to DOM first, then update its content — screen readers only announce *changes*

### Visually Hidden Content
For screen-reader-only text:
```css
.sr-only {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```
Never use `display: none` or `visibility: hidden` for SR-only content — those hide from screen readers too.

### Dynamic Content
- Loading states: `aria-busy="true"` on the container, announce "Loading" via live region
- Infinite scroll: announce new content count, maintain focus position
- Single-page navigation: announce new page title via live region, move focus to `<h1>` or `<main>`

## Testing Checklist

For every interactive component:
- [ ] Keyboard-only operation (no mouse required)
- [ ] Visible focus indicator on every focusable element
- [ ] Screen reader announces purpose, state, and changes
- [ ] Color contrast 4.5:1 for text, 3:1 for UI elements
- [ ] Touch target minimum 44x44px on mobile
- [ ] No content conveyed by color alone
- [ ] Works with 200% zoom without horizontal scroll
