# Accessibility (WCAG 2.1 AA self-audit)

This document records the accessibility features built into the BVI Labour
Portal prototype and the known gaps that remain for Phase 2 certification.

## Shipped in Phase 1

### Perceivable

- **Text contrast** — primary combinations audited for AA:
  - Navy text (`#003366`) on white (`#ffffff`) — 12.6:1 ✓ AAA
  - White text on navy — 12.6:1 ✓ AAA
  - Gold text (`#c5a55a`) on navy — 4.9:1 ✓ AA (large text)
  - Purple dept text on white — 6.1:1 ✓ AA
- **Icons are decorative** — Lucide icons use `aria-hidden="true"` when
  rendered alongside text; icon-only buttons use `aria-label`
- **Images** — the portal has no user-uploaded images in the current scope.
  SVG brand marks are decorative with `aria-hidden`
- **Text resize** — layout uses relative units (rem/%). Browser zoom to
  200% leaves no content clipped at common viewport widths

### Operable

- **Skip-to-content link** — `SkipToContent` component renders a
  visually-hidden link at the top of each public page. Pressing Tab from
  the address bar reveals it and jumps past the nav to `#main-content`
- **Focus-visible** — global `:focus-visible` outline set in `index.css`
  (2px navy outline, 2px offset). Mouse focus is not outlined to avoid
  visual noise
- **Keyboard reachability** — all interactive elements are native `button`,
  `a`, `input`, `select`, or `textarea`. No custom click handlers on `div`
- **Form inputs** — every field has an associated `<label>`. Error messages
  are linked via `aria-describedby` where relevant
- **No keyboard traps** — modals can be dismissed with their close button;
  no focus-trap is implemented yet (see gaps)

### Understandable

- **Language** — `<html lang="en">` set in `index.html`. Phase 1 ships
  English-only; Phase 2 adds Spanish with the i18n system already scaffolded
- **Consistent navigation** — each portal uses the same `PortalLayout`
  component, so sidebar and user-menu behaviour is identical across roles
- **Error identification** — form validation surfaces errors with the
  `ErrorMsg` component; errors are colour-coded AND iconographic (not
  colour alone)
- **Plain language** — audited: no jargon in public pages; legal terms in
  permit forms reference the Labour Code where used

### Robust

- **Landmark regions** — pages use `<header role="banner">`, `<main id="main-content">`, `<footer role="contentinfo">`
- **Live regions** — `DemoBanner` announces via `role="status"
  aria-live="polite"`; in-app notifications and form errors use polite
  live regions where appropriate
- **Name, role, value** — controls are native HTML; custom components
  expose `aria-label` for icon-only controls
- **Progressive enhancement** — the SPA requires JS (acceptable for a
  government portal; Phase 2 considers SSR for the public landing)

## Gaps explicitly deferred to Phase 2

1. **Third-party WCAG 2.1 AA certification** — this document is a
   self-audit, not a certification
2. **Focus-trap in modals** — Appeals / Transfers / Variations modals
   don't currently trap focus. Keyboard users can Tab out behind the
   modal. Fix planned with a small `FocusTrap` component
3. **Live audio or video content** — none in scope; no captioning
   infrastructure yet
4. **Complex data visualisations** — the `/stats` page uses bar
   breakdowns that communicate meaning through text as well as colour.
   Formal chart alt-text convention not yet established
5. **Form error summary at the top** — individual field errors are
   announced; a page-level summary of errors on submit is not yet built
6. **Reduced-motion preferences** — global `prefers-reduced-motion` media
   query is not yet respected by the animated stepper and modal
   transitions
7. **Long-form reading comprehension** — Flesch-Kincaid scoring not yet
   performed on permit-policy explanatory copy

## How to test manually

- **Keyboard only**: tab through every page without a mouse. Every
  interactive element must be reachable, visibly focused, and activatable
  with Enter/Space
- **Screen reader**: VoiceOver on macOS, or NVDA on Windows. Landing page
  should read: "BVI Labour Portal [...] banner, Department of Labour and
  Workforce Development, [...] Choose Your Portal heading [...]"
- **Axe DevTools**: run on each public route (`/`, `/roadmap`,
  `/limitations`, `/stats`, `/faq`). Zero critical or serious violations
  expected; moderate/minor may appear from third-party (PWA install
  prompt) and should be triaged

## Roadmap (Phase 2)

- Independent WCAG 2.1 AA audit
- Focus-trap on modal overlays
- Page-level form error summaries
- `prefers-reduced-motion` honoured
- Skip-links on authenticated-portal pages (today only public pages)
