## Worker Portal Test Results

**Tester:** QA Tester (role: Worker Portal Employee)
**Test User:** carlos.garcia@email.com (worker at Tropic Resorts Ltd, permit WP-2024-1001)
**Date:** 2026-03-30
**Scope:** All Worker Portal flows traced via static code analysis

---

### 1. Worker Registration (PortalRegister.jsx) - PASS

- Collects first name, last name, nationality, email, phone (Step 0 / Personal Info)
- Collects current employer and work permit number (Step 1 / Employment Details)
- Step 2 is password creation with strength meter
- Sets `portal: 'worker'` and `role: 'employee'` on line 206-214
- Nationality dropdown includes relevant options (BVI, Dominican, Jamaican, Filipino, etc.)
- Permit number is optional (no validation requiring it) which is correct for workers who may not yet have one
- Validation is correct: firstName, lastName, nationality, email, phone required in step 0; currentEmployer required in step 1
- Green branding color `#006633` used for worker portal stepper
- Navigates to `/worker/dashboard` on success (line 229)
- Code reference: `src/components/auth/PortalRegister.jsx:89-234`

---

### 2. Worker Login (PortalLogin.jsx) - PASS

- Green branding: color `#006633`, accentBg `bg-green-50`, accentText `text-[#006633]` (lines 25-37)
- Title: "Worker Portal Sign In", subtitle: "Access your work permit account"
- Redirects to `/worker/dashboard` on successful login (line 95)
- Has "Create Account" link pointing to `/worker/register`
- Email validation and password required before submit
- "Remember me" checkbox present
- Code reference: `src/components/auth/PortalLogin.jsx:23-37, 94-95`

---

### 3. Worker Layout (WorkerLayout.jsx) - WARNING

- Nav items are correct and complete: Dashboard, My Permit, ID Card, File Dispute, My Disputes, Documents, Browse Jobs, Profile (lines 11-19)
- Green brand color `#006633` used throughout (line 21)
- Portal check present: redirects user if `user.portal !== 'worker'` (lines 36-39)
- Notification bell with unread count badge
- User menu with initials, name, profile link, and sign-out
- Responsive sidebar with mobile overlay
- Active nav item highlighting logic is correct, including special case for disputes/new (line 64)

- **Bug: Missing route for `/worker/id-card`** -- The nav item "ID Card" links to `/worker/id-card` (line 13), but the App.jsx router only defines `/worker/permit` (which renders IDCardPage). There is NO route for `/worker/id-card`. Clicking "ID Card" in the sidebar will result in a 404 or unmatched route.
  - Code reference: `src/components/layout/WorkerLayout.jsx:13` vs `src/App.jsx:185`
  - **Severity: HIGH** -- Core navigation link is broken

---

### 4. Worker Dashboard (EmployeeDashboard.jsx) - WARNING

- Shows current permit status prominently in a dedicated card with green gradient header (lines 163-288)
- Displays permit number, type, and status badge
- Days-until-expiry countdown is present with color coding:
  - Green (>60 days), Yellow (<=60 days), Red (<30 days), "EXPIRED" (<=0 days) (lines 58-80)
  - Visual progress bar shows remaining time as percentage of 365-day cycle
- Shows ID card preview/link for approved permits ("View Full ID Card" button, line 259-277)
- Application progress tracker (Submitted -> Under Review -> Payment -> Approved) shown for current permit
- Stat cards: Permit Status, Days Remaining, Active Disputes, Documents (lines 96-133)
- Minimum wage info displayed: uses `DEPARTMENT_INFO.minimumWage` which resolves to `$8.50/hour` (line 343, constants.js:88)
- Office hours and contact info shown in Important Notices section
- Recent unread notifications displayed

- **Bug: Quick Actions navigate to wrong routes** -- All 5 quick action buttons use routes without the `/worker/` prefix:
  - "View My Permit" navigates to `/permits` instead of `/worker/permit` (line 141)
  - "Download ID Card" navigates to `/id-cards` instead of `/worker/id-card` or `/worker/permit` (line 142)
  - "File a Dispute" navigates to `/disputes/file` instead of `/worker/disputes/new` (line 143)
  - "Upload Document" navigates to `/documents` instead of `/worker/documents` (line 144)
  - "Browse Jobs" navigates to `/jobs` instead of `/worker/jobs` (line 145)
  - These legacy routes (`/permits`, `/id-cards`, `/disputes/file`, etc.) are caught by the `RedirectToDashboard` component (App.jsx:273-280), so clicking any quick action will redirect the user back to their dashboard in an infinite-feeling loop.
  - Code reference: `src/components/dashboard/EmployeeDashboard.jsx:141-145`
  - **Severity: CRITICAL** -- All 5 quick action buttons are non-functional for worker portal users

- **Bug: "View Full ID Card" button also navigates to wrong route** -- The button inside the approved permit card navigates to `/id-cards` (line 270), which also hits the `RedirectToDashboard` catch-all and loops back to the dashboard.
  - Code reference: `src/components/dashboard/EmployeeDashboard.jsx:270`
  - **Severity: HIGH** -- Approved permit ID card is inaccessible from the dashboard

---

### 5. Permit Status (PermitStatus.jsx) - PASS

- Worker can view their permits filtered by `getPermitsByUser(user.id)` (line 189)
- Non-admin users only see their own permits; admins see all (line 191)
- Search by permit number, employee name, or company name (lines 193-199)
- Expandable detail view shows:
  - Status timeline (Submitted -> Under Review -> Pending Payment -> Approved) with visual indicators
  - Handles rejected/cancelled as terminal states with red/gray markers
  - Permit type, submission date, last updated date, fee
  - Employee details (name, nationality, passport, email)
  - Employer details (company name, industry, phone)
  - Position details (job title, location, salary)
  - Notes from officer (lines 144-149)
  - Days-until-expiry with color-coded warning
  - "View Permit Card" button for approved permits using PermitCard component
- Code reference: `src/components/work-permits/PermitStatus.jsx:181-283`
- Note: PermitStatus is accessed through the Permits page (which is a Business Portal feature), not directly from the Worker nav. The Worker nav "My Permit" link goes to IDCardPage instead. This is a design choice, not a bug.

---

### 6. ID Card (WorkPermitCard.jsx) - PASS

- Card displays: name, nationality, DOB, gender, employer, position, permit number, issue date, expiry date, permit type (lines 149-158)
- Card dimensions: 85.6mm x 54mm (standard credit card size), scaled to 428x270px (lines 64-65)
- Front side: BVI government branding, gold title strip "Work Permit", photo placeholder, QR-like pattern
- Back side: Terms & conditions, QR placeholder for verification, barcode with permit number, department contact info
- PDF download: uses `html2canvas` + `jsPDF` imports (lines 3-4), captures front and back at 3x scale, saves as landscape PDF (lines 82-103)
- Image download: saves current side as PNG (lines 106-122)
- Print function: opens new window with both sides and triggers print dialog (lines 124-146)
- Flip card button toggles front/back (line 331)
- Both sides always rendered (one off-screen) for PDF capture (lines 323-326)
- Code reference: `src/components/id-cards/WorkPermitCard.jsx:1-347`

---

### 7. File Dispute (FileDisputeForm.jsx) - PASS

- Pre-fills complainant info from user profile: name (`firstName + lastName`), email, phone, address (lines 51-56)
- 9 complaint types present (lines 10-20):
  - Unpaid Wages, Unfair Dismissal, Discrimination, Unsafe Working Conditions, Breach of Contract, Harassment, Wrongful Deduction of Wages, Denial of Leave Entitlements, Other
- Labour Code references for each type (lines 23-32):
  - e.g., "Unpaid Wages" -> "Labour Code, Part VI - Wages (Sections 76-95)"
  - "Unfair Dismissal" -> "Labour Code, Part IX - Termination of Employment (Sections 168-182)"
  - Dynamically displayed when a complaint type is selected (lines 283-294)
- Supporting document upload: accepts PDF, DOC, DOCX, JPG, JPEG, PNG up to 10MB each (lines 98-109, 337-340)
- 5-step flow confirmed (lines 58, 177):
  1. Your Info (complainant details)
  2. Respondent (employer info)
  3. Complaint (type, date, description with 100-char min, desired resolution)
  4. Evidence (document upload)
  5. Review & Submit (with declaration checkbox)
- Validation at each step before progression
- Success screen shows case number, "What Happens Next" steps
- Code reference: `src/components/disputes/FileDisputeForm.jsx:47-475`

---

### 8. Dispute Tracker (DisputeTracker.jsx) - PASS

- Search by case number, complaint type, or respondent name (lines 29-35)
- Visual timeline: Filed -> Investigation -> Mediation -> Resolved (lines 12-17)
  - Green filled circles for completed steps, blue ring for current step, gray for future
  - Timeline is always visible even when dispute is collapsed (line 134-162)
- Expanded view shows:
  - Incident date, labour code reference
  - Full description and desired resolution
  - Case timeline with notes from officers (lines 192-217) - each timeline entry shows status badge, date, and note text
  - Documents section with ability to upload additional evidence for non-terminal disputes (lines 219-248)
- Handles terminal states (resolved, closed, referred) correctly
- Empty state message with search box still available
- Code reference: `src/components/disputes/DisputeTracker.jsx:19-256`

---

### 9. Browse Jobs (JobsPage.jsx) - PASS

- Worker can browse jobs: `isJobseeker` flag includes `user?.role === 'employee'` (line 29), so workers see the job search
- Workers see "Find Jobs" tab and "My Applications" tab (lines 31-36)
- Workers do NOT see "Post a Job" or "Manage Jobs" (employer-only)
- JobSearch component rendered for job browsing (line 117)
- Can view job details and apply from the worker portal
- Code reference: `src/pages/JobsPage.jsx:22-142`

---

### 10. Profile (ProfilePage.jsx) - PASS

- Displays and allows editing: firstName, lastName, email, phone, island (lines 178-222)
- For employee role: shows "Employment Details" section with Current Employer and Permit Number (lines 261-283)
- Photo upload: click avatar to trigger file input, accepts images under 2MB, converts to base64 (lines 41-57)
- Camera icon overlay appears on hover when in edit mode (lines 132-139)
- Validation: first name, last name, email required; phone validated if provided (lines 61-64)
- Shows role badge, account ID, and member since date
- Save triggers `updateProfile()` from AuthContext
- Code reference: `src/components/auth/ProfilePage.jsx:10-334`

---

### 11. Routing & Navigation (App.jsx) - FAIL

- **Bug: No route defined for `/worker/id-card`** -- The WorkerLayout sidebar has "ID Card" linking to `/worker/id-card`, but App.jsx only defines `/worker/permit` (which renders IDCardPage). The `/worker/id-card` path has no matching route.
  - Code reference: `src/App.jsx:183-190` (no `/worker/id-card` route)
  - **Severity: HIGH**

- **Bug: DisputesPage defaults to "File a Dispute" tab** -- When navigating to `/worker/disputes` (the "My Disputes" nav item), DisputesPage initializes with `activeTab = TABS.FILE` (line 18 of DisputesPage.jsx), meaning the user lands on the "File a Dispute" form instead of the "Track My Disputes" tracker. The nav item "My Disputes" should show the tracker, but it shows the filing form.
  - Code reference: `src/pages/DisputesPage.jsx:18`
  - **Severity: MEDIUM** -- Confusing UX; "My Disputes" link shows dispute filing form instead of dispute list

- Worker portal routes confirmed: `/worker/dashboard`, `/worker/permit`, `/worker/disputes/*`, `/worker/documents`, `/worker/jobs`, `/worker/profile`
- Auth guard `RequirePortalAuth` with `portal="worker"` wraps all protected routes
- Login/register wrapped in `PublicPortalRoute`

---

## Summary of Bugs Found

| # | Severity | Component | Description |
|---|----------|-----------|-------------|
| 1 | **CRITICAL** | EmployeeDashboard | All 5 quick action buttons navigate to legacy routes (`/permits`, `/id-cards`, `/disputes/file`, `/documents`, `/jobs`) instead of worker portal routes (`/worker/permit`, `/worker/id-card`, `/worker/disputes/new`, `/worker/documents`, `/worker/jobs`). These legacy routes redirect back to dashboard, creating a loop. |
| 2 | **HIGH** | EmployeeDashboard | "View Full ID Card" button for approved permits navigates to `/id-cards` instead of `/worker/permit`, also redirects back to dashboard. |
| 3 | **HIGH** | WorkerLayout + App.jsx | Nav item "ID Card" links to `/worker/id-card` but no such route exists in App.jsx. Only `/worker/permit` exists (rendering IDCardPage). |
| 4 | **MEDIUM** | DisputesPage | Default tab is "File a Dispute" (`TABS.FILE`), so clicking "My Disputes" in the sidebar shows the filing form instead of the dispute tracker. No URL-based tab routing to differentiate `/worker/disputes` from `/worker/disputes/new`. |

### Recommended Fixes

1. **EmployeeDashboard quick actions (Bug #1 & #2):** Change all `navigate()` calls to use worker portal paths:
   - `/permits` -> `/worker/permit`
   - `/id-cards` -> `/worker/permit` (since IDCardPage is at this route)
   - `/disputes/file` -> `/worker/disputes/new`
   - `/documents` -> `/worker/documents`
   - `/jobs` -> `/worker/jobs`

2. **Missing ID Card route (Bug #3):** Either:
   - Add route `<Route path="/worker/id-card" element={<IDCardPage />} />` in App.jsx, OR
   - Change the WorkerLayout nav item from `/worker/id-card` to `/worker/permit`

3. **Disputes tab default (Bug #4):** Use React Router path matching to determine default tab:
   - If path is `/worker/disputes/new`, default to `TABS.FILE`
   - If path is `/worker/disputes`, default to `TABS.TRACK`
