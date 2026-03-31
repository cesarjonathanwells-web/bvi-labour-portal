# CSS / Layout Audit Report -- BVI Labour Portal

**Audited:** 2026-03-30
**Auditor:** Claude Opus 4.6 (automated)
**Scope:** 16 files covering the HTML shell, global CSS, 4 layout shells, landing page, auth pages, 4 dashboards, permit form, fee calculator, and ID card component.

---

## A. HTML / Meta Issues

### A-1. CRITICAL -- Incorrect page title
**File:** `index.html` line 7
**Problem:** `<title>bvi-labour-app</title>` is the Vite scaffold default. Users and browser tabs show a developer string instead of a proper name.
**Fix:**
```html
<title>BVI Labour Portal</title>
```

### A-2. HIGH -- No meta description
**File:** `index.html` (missing)
**Problem:** No `<meta name="description">` tag. Search engines and social previews show nothing meaningful.
**Fix:** Add inside `<head>`:
```html
<meta name="description" content="Official online portal for the BVI Department of Labour & Workforce Development. Apply for work permits, browse jobs, file disputes, and more." />
```

### A-3. HIGH -- Default Vite favicon
**File:** `public/favicon.svg`
**Problem:** The favicon is the default Vite lightning-bolt SVG (purple `#863bff`). It has no relation to BVI Government branding.
**Fix:** Replace with a BVI-branded icon (e.g., the gold "BVI" circle used throughout the app, or the BVI coat of arms). Also consider adding `<link rel="apple-touch-icon">` for iOS.

### A-4. LOW -- No Open Graph tags
**File:** `index.html`
**Problem:** Missing `og:title`, `og:description`, `og:image`. Links shared on social media will have no preview.
**Fix:** Add OG meta tags in `<head>`.

---

## B. Global CSS Issues

### B-1. MEDIUM -- CSS custom properties declared but never used
**File:** `src/index.css` lines 5-8
**Problem:** `--bvi-blue`, `--bvi-gold`, `--bvi-green`, `--bvi-light` are defined in `:root` but are not referenced anywhere in the codebase. Every component hardcodes hex values (`#003366`, `#c5a55a`, `#006633`) directly in Tailwind arbitrary-value syntax.
**Fix:** Either (a) delete the unused variables to reduce confusion, or (b) refactor component code to use `var(--bvi-blue)` / Tailwind theme extensions so colors are centrally managed. Option (b) is strongly recommended for maintainability.

### B-2. HIGH -- `.sidebar-link` hover hardcoded to blue-50/navy
**File:** `src/index.css` lines 52-57
**Problem:** `.sidebar-link` uses `hover:bg-blue-50 hover:text-[#003366]` and `.sidebar-link-active` uses `bg-blue-50 text-[#003366]`. These classes are consumed by `Sidebar.jsx` (legacy component). While the four portal-specific layouts (Business, Worker, Jobs, Dept) define their own inline active styles and do NOT use these classes, the legacy `Sidebar.jsx` does. If `Sidebar.jsx` is used by any portal other than Business, the Worker portal would show blue highlights instead of green, the Job Centre would show blue instead of gold, and the Dept portal would show blue instead of purple.
**Fix:** Either remove `Sidebar.jsx` (if fully replaced by per-portal layouts) and delete the `.sidebar-link` / `.sidebar-link-active` classes, or parameterize the hover color:
```css
.sidebar-link {
  @apply flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors text-sm;
}
```

### B-3. HIGH -- Stepper classes hardcoded to navy/green
**File:** `src/index.css` lines 62-69
**Problem:** `.stepper-active` is always `bg-[#003366]` (navy) and `.stepper-complete` is always `bg-[#006633]` (green). These are used by `NewPermitForm.jsx` (line 92-97). When rendered inside the gold Job Centre portal, the stepper shows navy/green instead of gold/green, creating a visual mismatch.
**Fix:** The `PortalRegister.jsx` already solves this correctly by passing `config.stepperActive` / `config.stepperComplete` as dynamic classes. The `NewPermitForm.jsx` should follow the same pattern. Additionally, either remove the global stepper classes or make them generic:
```css
.stepper-active {
  @apply w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm;
}
```
And let each consumer pass the color.

### B-4. MEDIUM -- No proper CSS reset beyond `body { margin: 0 }`
**File:** `src/index.css` line 10
**Problem:** The only reset is `body { margin: 0; ... }`. Tailwind 4's `@import "tailwindcss"` does include Preflight (a modern-normalize-based reset), so `body { margin: 0 }` is actually redundant. However, `#root { min-height: 100vh }` (line 11) is good and necessary.
**Fix:** Remove the redundant `margin: 0` since Preflight already handles it. Verify that `@import "tailwindcss"` is correctly importing the base layer with Preflight. No action needed if using Tailwind v4 (which includes Preflight by default).

### B-5. HIGH -- No focus-visible styles for accessibility
**File:** `src/index.css` (global scope)
**Problem:** There are zero `focus-visible` rules anywhere in the main application codebase (the only instance is in `App.css` which appears to be a leftover Vite scaffold file). The global `.btn-primary`, `.btn-secondary`, `.btn-outline`, `.input-field` classes have no focus ring styles beyond the `input-field`'s `focus:ring-2 focus:ring-blue-500`. Buttons across all portals have no visible keyboard focus indicator. This is a WCAG 2.1 AA violation (Success Criterion 2.4.7).
**Fix:** Add to `src/index.css` in the `@layer components` block:
```css
.btn-primary, .btn-secondary, .btn-success, .btn-outline, .btn-danger {
  @apply focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 focus-visible:outline-none;
}
```
Also add to layout buttons (sidebar toggle, notification bell, user menu) a `focus-visible:ring-2 focus-visible:outline-none` class.

### B-6. LOW -- No dark mode consideration
**File:** `src/index.css`
**Problem:** No `dark:` variant classes and no `prefers-color-scheme` media query anywhere. Not necessarily a bug, but the app has no explicit dark-mode opt-out either (e.g., `<html class="light">`).
**Fix:** Either add `class="light"` to the `<html>` element in `index.html` to explicitly opt out, or plan dark mode support as a future feature.

### B-7. LOW -- Leftover `App.css` from Vite scaffold
**File:** `src/App.css`
**Problem:** Contains `.counter`, `.hero` classes from the Vite React template. These are dead code.
**Fix:** Delete `src/App.css` and remove any import of it.

---

## C. Layout Structure Issues

### C-1. MEDIUM -- Mobile sidebar does not prevent body scrolling
**Files:** `BusinessLayout.jsx` line 181, `WorkerLayout.jsx` line 172, `JobsLayout.jsx` line 172, `DeptLayout.jsx` line 238
**Problem:** When the mobile sidebar overlay is open, the `<body>` can still scroll behind the overlay. The overlay `div` with `bg-black/40` catches clicks but does not set `overflow: hidden` on the body.
**Fix:** Add an effect that toggles body scroll when `sidebarOpen` changes:
```jsx
useEffect(() => {
  document.body.style.overflow = sidebarOpen ? 'hidden' : '';
  return () => { document.body.style.overflow = ''; };
}, [sidebarOpen]);
```

### C-2. LOW -- Sidebar z-index matches header z-index
**Files:** All 4 layouts
**Problem:** The header is `z-50`, the sidebar overlay is `z-40`, the sidebar itself is `z-40`. This is correct in that the header stacks above the sidebar. However, notification and user-menu dropdowns are also `z-50`, which means they render at the same level as the header. If the sidebar is open and a dropdown is opened, the dropdown could appear behind the sidebar overlay on some browsers.
**Fix:** Consider using a layered z-index scale:
- Sidebar overlay: `z-40`
- Sidebar: `z-40`
- Header: `z-50`
- Dropdowns inside header: `z-[60]` (or keep as-is since they are children of the `z-50` header and stacking context makes them naturally above)

Actual impact is minimal because the dropdowns are inside the header's stacking context.

### C-3. LOW -- Layout height uses calc
**Files:** All 4 layouts, main content area
**Problem:** `min-h-[calc(100vh-4rem)]` is used for the main content area. This is correct for the 4rem (h-16) header. The value is consistent across all four layouts. No issue here -- this is a confirmation of correctness.

### C-4. MEDIUM -- Sidebar width is a magic number
**Files:** All 4 layouts use `w-64` (256px).
**Problem:** While consistent across all four layouts, the sidebar width is hardcoded. If it ever needs to change, 4 files must be updated.
**Fix:** Define as a Tailwind theme value or CSS variable. Low priority since it is already consistent.

---

## D. Responsive Breakpoint Issues

### D-1. LOW -- Sidebar breakpoint is consistent (good)
**Files:** All 4 layouts
**Finding:** All four layouts use `lg:` (1024px) as the breakpoint for showing/hiding the sidebar. The mobile hamburger button is `lg:hidden`. This is consistent and correct.

### D-2. MEDIUM -- Stat card grids not responsive on tablets for Commissioner Dashboard
**File:** `DeptDashboard.jsx` line 45
**Problem:** Commissioner stat cards use `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5` which means on a large phone (sm), three cards display but with 5 items, the 4th and 5th cards wrap to a new row asymmetrically (one centered, one left-aligned). All other dashboards use `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` for 4 cards, which wraps cleanly.
**Fix:** Redesign to 4 stat cards for Commissioner too, or use `xl:grid-cols-5` and fall back to `lg:grid-cols-3`:
```
grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5
```

### D-3. HIGH -- Registration form `grid-cols-2` not responsive on very small screens
**File:** `PortalRegister.jsx` lines 300, 351
**Problem:** The worker and jobseeker registration forms use `grid grid-cols-2 gap-4` for first/last name fields WITHOUT a responsive prefix. On screens below 320px, two side-by-side inputs will be extremely cramped (each ~130px wide).
**Fix:** Change to:
```
grid grid-cols-1 sm:grid-cols-2 gap-4
```

### D-4. MEDIUM -- Notification dropdown fixed at w-80 (320px)
**Files:** All 4 layouts (e.g., `BusinessLayout.jsx` line 112)
**Problem:** The notification dropdown is `w-80` (320px). On a 320px-wide screen, this will overflow the viewport to the right. It uses `right-0` positioning but the parent button may not be flush-right enough.
**Fix:** Add `max-w-[calc(100vw-2rem)]` or use `w-80 max-w-[90vw]`:
```
className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] ..."
```

### D-5. MEDIUM -- Tables lack horizontal scroll wrapper on some dashboards
**File:** `EmployerDashboard.jsx` line 187
**Finding:** The active permits table IS wrapped in `overflow-x-auto`. This is correct.
**File:** `DeptDashboard.jsx` line 198-233
**Finding:** The permit queue table is also wrapped in `overflow-x-auto`. Correct.
**Conclusion:** Tables are handled correctly. No issue.

### D-6. HIGH -- Work Permit Card has fixed pixel dimensions that break on mobile
**File:** `WorkPermitCard.jsx` lines 64-65
**Problem:** `CARD_W = 428` and `CARD_H = 270` are applied as inline `style={{ width: 428, height: 270 }}`. On screens narrower than 428px (most phones in portrait), the card will overflow horizontally. The parent container `flex justify-center` does not add horizontal scroll.
**Fix:** Wrap the card in a scrollable container, or use CSS scaling:
```jsx
<div className="flex justify-center overflow-x-auto">
  <div className="relative" style={{ perspective: 1000 }}>
    {showBack ? Back : Front}
  </div>
</div>
```
Or better, use CSS `transform: scale()` to fit within the viewport:
```jsx
<div className="flex justify-center">
  <div className="max-w-full" style={{ aspectRatio: '428/270' }}>
    <div style={{ width: 428, height: 270, transform: 'scale(var(--card-scale))' }}>
```

---

## E. Visual Consistency Issues

### E-1. HIGH -- Portal accent colors inconsistently applied in global component classes
**File:** `src/index.css`
**Problem:** Global `.btn-primary` is hardcoded to `bg-[#003366]` (navy). When used inside the Worker Portal (green), Job Centre (gold), or Dept Portal (purple), the button appears in the wrong brand color. The `.page-title` class also hardcodes `text-[#003366]`. The `.input-field` focus ring is always `focus:ring-blue-500` regardless of portal.
**Impact:** Low in practice because most portal-specific pages use inline Tailwind classes. But if any page uses `.btn-primary` or `.page-title` in the Worker or Jobs portal, the color will be wrong.
**Fix:** Either:
- Remove the color from these utility classes and let each portal apply its own color
- Use CSS variables: `bg-[var(--portal-accent)]`

### E-2. MEDIUM -- Inconsistent welcome heading styles across dashboards
**Files:**
- `EmployerDashboard.jsx` line 108: Uses a gradient banner with `text-2xl sm:text-3xl font-bold` in white on navy gradient
- `EmployeeDashboard.jsx` line 154: Plain heading `text-2xl sm:text-3xl font-bold text-[#006633]`
- `JobSeekerDashboard.jsx` line 99: Plain heading `text-2xl sm:text-3xl font-bold text-gray-900`
- `DeptDashboard.jsx`: Varies by sub-dashboard, most use the role-specific title

**Problem:** The Employer dashboard has a prominent gradient welcome banner while the other three dashboards use simple text headings. This creates visual inconsistency between portals.
**Fix:** Either give all dashboards a welcome banner or give none. The banner approach is more engaging.

### E-3. LOW -- Card shadow inconsistency
**Files:** Various dashboard files
**Finding:** Some cards use `shadow-sm` (stat cards in dashboards), some use `shadow-md` (`.card` class in `index.css`), some use `shadow-lg` (the expiring-permits alert). The escalation of shadow for importance is intentional and appropriate. No fix needed.

### E-4. LOW -- Button size consistency
**Files:** `src/index.css` lines 16-29
**Finding:** All `.btn-*` classes use identical `px-6 py-2.5 rounded-lg font-medium`. This is consistent. Some components use custom button sizes inline (smaller `text-sm px-4 py-3`), which is intentional for contextual use. No issue.

---

## F. Specific Component Issues

### F-1. LOW -- Landing page portal grid is responsive (confirmed)
**File:** `LandingPage.jsx` line 132
**Finding:** `grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto`. This correctly goes from 1-column on mobile to 2x2 on tablets+. No issue.

### F-2. MEDIUM -- Login page may overflow on 320px screens
**File:** `PortalLogin.jsx` line 127
**Problem:** The login card is `max-w-md` (448px) inside `flex items-center justify-center p-4`. On a 320px screen, `p-4` (16px each side) leaves 288px for the card. The card should shrink to fit, and `max-w-md` will allow that. The `w-full` class ensures it does shrink.
**Finding:** Actually correct. `w-full max-w-md` with `p-4` means the card will be 288px wide on a 320px screen. This is acceptable.
**Remaining issue:** The header banner logo circle `w-16 h-16` plus text may look disproportionately large at 288px width.
**Fix:** Consider `w-12 h-12 sm:w-16 sm:h-16` for the banner logo.

### F-3. HIGH -- Login submit button text color wrong for Job Centre portal
**File:** `PortalLogin.jsx` lines 205-208
**Problem:** The submit button uses:
```jsx
style={{
  backgroundColor: config.color, // '#c5a55a' for jobseeker
  color: config.darkText ? '#003366' : '#ffffff',
}}
```
For the jobseeker portal, `config.darkText` is `true`, so the button is gold background with navy text. This is correct. However, the contrast ratio of `#003366` on `#c5a55a` is approximately 4.1:1, which barely passes WCAG AA for normal text but fails for the small `text-sm` size.
**Fix:** Use `#002244` (darker navy) or `#1a1a2e` for better contrast, or increase the font weight.

### F-4. MEDIUM -- NewPermitForm stepper labels hidden on mobile
**File:** `NewPermitForm.jsx` line 103
**Problem:** Stepper labels use `hidden sm:block` -- they are invisible below the `sm` (640px) breakpoint. Users on mobile only see numbered circles with no indication of what each step is. The current step's content does have a section header, but the stepper provides no context.
**Fix:** Show at least the current step's label on mobile:
```jsx
<span className={`text-xs mt-2 text-center ${
  isActive ? 'block text-[#003366] font-semibold' : 'hidden sm:block ...'
}`}>
```

### F-5. LOW -- Work Permit Card maintains aspect ratio (confirmed)
**File:** `WorkPermitCard.jsx` lines 64-65
**Finding:** The card has fixed `width: 428` and `height: 270` inline styles, which enforces the 85.6mm x 54mm credit-card aspect ratio. However, see issue D-6 about mobile overflow.

### F-6. MEDIUM -- Fee Calculator breakdown table readable on mobile
**File:** `FeeCalculator.jsx` line 209
**Finding:** The fee table is wrapped in `overflow-x-auto` (line 209), which provides horizontal scrolling on mobile. This is correct.
**Remaining issue:** The bar chart section (line 289) is NOT inside an overflow container. On very narrow screens, the bars with percentage widths will be fine, but the labels may truncate.
**Fix:** Add `overflow-x-auto` as a safety measure, or ensure label text uses `truncate`.

### F-7. MEDIUM -- Fee Calculator inputs use 2-column grid without responsive fallback
**File:** `FeeCalculator.jsx` line 101
**Problem:** `grid grid-cols-1 lg:grid-cols-2 gap-6`. This is actually correct -- it goes to single column below `lg`. No issue.

---

## G. Typography Issues

### G-1. LOW -- Font stack is system fonts only
**File:** `src/index.css` line 10
**Finding:** `font-family: system-ui, -apple-system, sans-serif`. This is a reasonable choice for a government app. No issue.

### G-2. MEDIUM -- Long company names may overflow in dashboard headers
**File:** `EmployerDashboard.jsx` line 109
**Problem:** `{user?.companyName || ...}` is rendered inside a gradient banner without truncation. Very long company names (e.g., "British Virgin Islands International Holdings Corporation Ltd.") could cause layout issues.
**Fix:** Add `truncate` or `line-clamp-1`:
```jsx
<h1 className="text-2xl sm:text-3xl font-bold truncate">
```

### G-3. LOW -- Consistent type scale (confirmed)
**Finding:** The app uses a consistent type hierarchy:
- Page titles: `text-3xl font-bold` (`.page-title`)
- Section titles: `text-xl font-semibold` (`.section-title`)
- Card headings: `text-lg font-semibold`
- Body: `text-sm`
- Labels: `text-sm font-semibold`
- Fine print: `text-xs`, `text-[10px]`, `text-[11px]`
This is consistent. No issue.

### G-4. LOW -- Work Permit Card uses very small font sizes
**File:** `WorkPermitCard.jsx`
**Problem:** Font sizes go as small as `text-[6px]`, `text-[7px]`, `text-[7.5px]`, `text-[8px]`. These are intentional for the credit-card sized design. They will be extremely hard to read on a phone screen when the card is not zoomed.
**Fix:** This is acceptable for a physical-card replica. The PDF/print export at 3x scale makes them readable. For on-screen viewing, consider adding a zoom button or allowing users to tap-to-zoom.

---

## H. Additional Findings

### H-1. MEDIUM -- `PortalRegister.jsx` validates `portal === 'jobs'` but config uses `portal === 'jobseeker'`
**File:** `PortalRegister.jsx` lines 147-158 vs. line 69
**Problem:** The validation logic checks `if (portal === 'jobs')` but the `portalConfig` object uses `jobseeker` as the key. If `PortalRegister` is called with `portal="jobseeker"`, the step-0 and step-1 validations will be skipped entirely because `portal === 'jobs'` is false.
**Fix:** Change validation checks from `portal === 'jobs'` to `portal === 'jobseeker'`, or ensure the portal prop is consistently one or the other.

### H-2. LOW -- `JobsLayout.jsx` redirect logic has dead code
**File:** `JobsLayout.jsx` lines 36-38
**Problem:**
```jsx
if (user && user.portal && user.portal !== 'jobseeker') {
  const path = user.portal === 'jobseeker' ? '/jobs' : `/${user.portal}`;
```
The inner ternary `user.portal === 'jobseeker'` will NEVER be true because the outer `if` already guarantees `user.portal !== 'jobseeker'`.
**Fix:**
```jsx
if (user && user.portal && user.portal !== 'jobseeker') {
  navigate(`/${user.portal}/dashboard`, { replace: true });
}
```

### H-3. LOW -- Duplicate layout code across 4 portal layouts
**Files:** `BusinessLayout.jsx`, `WorkerLayout.jsx`, `JobsLayout.jsx`, `DeptLayout.jsx`
**Problem:** All four layout files are ~270-300 lines of nearly identical code (header, notification dropdown, user menu, sidebar, main content). Only the nav items, brand colors, and a few labels differ.
**Fix:** Extract a shared `PortalLayout` component that accepts a config object:
```jsx
<PortalLayout
  config={{ brandColor, navItems, portalLabel, ... }}
/>
```
This would reduce ~1100 lines to ~350 lines and eliminate the risk of divergent bug fixes.

---

## Prioritized Fix List

### CRITICAL (fix immediately)
| # | Issue | File | Effort |
|---|-------|------|--------|
| A-1 | Wrong page title | `index.html` | 1 min |

### HIGH (fix before launch)
| # | Issue | File | Effort |
|---|-------|------|--------|
| A-2 | Missing meta description | `index.html` | 2 min |
| A-3 | Default Vite favicon | `public/favicon.svg` | 30 min |
| B-2 | sidebar-link hover hardcoded to blue | `src/index.css` | 10 min |
| B-3 | Stepper classes hardcoded to navy/green | `src/index.css` + `NewPermitForm.jsx` | 15 min |
| B-5 | No focus-visible styles (a11y) | `src/index.css` | 15 min |
| D-3 | Registration form grid-cols-2 not responsive | `PortalRegister.jsx` | 5 min |
| D-6 | Work Permit Card overflows on mobile | `WorkPermitCard.jsx` | 20 min |
| E-1 | btn-primary hardcoded to navy across all portals | `src/index.css` | 30 min |
| F-3 | Login button contrast on gold portal | `PortalLogin.jsx` | 5 min |

### MEDIUM (fix in next sprint)
| # | Issue | File | Effort |
|---|-------|------|--------|
| B-1 | Dead CSS custom properties | `src/index.css` | 5 min |
| C-1 | Mobile sidebar doesn't block body scroll | All 4 layouts | 15 min |
| C-4 | Sidebar width is magic number | All 4 layouts | 20 min |
| D-2 | Commissioner stat grid wraps asymmetrically | `DeptDashboard.jsx` | 10 min |
| D-4 | Notification dropdown overflows 320px screens | All 4 layouts | 5 min |
| E-2 | Inconsistent welcome banner vs plain heading | All 4 dashboards | 30 min |
| F-2 | Login banner logo oversized on 320px | `PortalLogin.jsx` | 5 min |
| F-4 | Stepper labels hidden on mobile | `NewPermitForm.jsx` | 10 min |
| F-6 | Fee Calculator bar chart labels may truncate | `FeeCalculator.jsx` | 5 min |
| G-2 | Long company names overflow banner | `EmployerDashboard.jsx` | 2 min |
| H-1 | Portal validation mismatch (jobs vs jobseeker) | `PortalRegister.jsx` | 5 min |

### LOW (backlog / nice-to-have)
| # | Issue | File | Effort |
|---|-------|------|--------|
| A-4 | Missing Open Graph tags | `index.html` | 10 min |
| B-4 | Redundant `margin: 0` in CSS reset | `src/index.css` | 1 min |
| B-6 | No dark mode opt-out | `index.html` | 1 min |
| B-7 | Dead `App.css` file | `src/App.css` | 1 min |
| C-2 | Sidebar z-index minor overlap risk | All 4 layouts | 5 min |
| D-1 | (Confirmed OK) Sidebar breakpoint consistent | -- | 0 |
| F-1 | (Confirmed OK) Landing grid responsive | -- | 0 |
| G-4 | Very small fonts on ID card | `WorkPermitCard.jsx` | 30 min |
| H-2 | Dead code in redirect logic | `JobsLayout.jsx` | 2 min |
| H-3 | Duplicate layout code (refactor) | 4 layout files | 2-4 hrs |

---

## Summary

- **CRITICAL issues:** 1 (wrong page title)
- **HIGH issues:** 9
- **MEDIUM issues:** 11
- **LOW issues:** 10

The most impactful quick wins are fixing the page title (A-1), adding focus-visible styles for accessibility compliance (B-5), and fixing the registration form grid on small screens (D-3). The Work Permit Card mobile overflow (D-6) is the most visible layout bug for end users on phones.

The biggest architectural improvement would be consolidating the four nearly-identical layout files into a single parameterized component (H-3), which would also eliminate the risk of issues C-1 and D-4 needing to be fixed in four places.
