# BVI Labour Portal - Test Log
## Test Date: 2026-03-30
## Tester: Automated Agent Swarm

---

## Business Portal Test Results
### Tested by: Business Portal Employer (john@tropicresorts.vg, Tropic Resorts Ltd)
### Test Date: 2026-03-30

---

### 1. PortalRegister.jsx (Registration Flow) - PASS with WARNINGS

- **Company name**: Collected in Step 0 (`form.companyName`). Validated as required. PASS
- **Trade license**: Collected in Step 0 (`form.tradeLicense`). Validated as required. PASS
- **Industry**: Collected in Step 0 via dropdown using `JOB_CATEGORIES` constant. Validated as required. PASS
- **Contact person**: Collected in Step 0 (`form.contactPerson`). Validated as required. PASS
- **Contact details (Step 1)**: Email (validated via `validateEmail`), phone (validated via `validatePhone`), island (dropdown from `ISLANDS`). All required. PASS
- **Password (Step 2)**: Minimum 8 characters enforced. Confirm-password match enforced. Password strength meter present. PASS
- **Portal field set on user object**: Line 187-204 sets `portal: 'business'` (passed as the `portal` prop), `role: 'employer'`, plus all business fields. PASS
- **Stepper navigation**: 3 steps defined ('Company Info', 'Contact Details', 'Create Password'). Back/Continue buttons work. Step index 0-based, steps array properly rendered with completion indicators. PASS
- **Redirect after registration**: Navigates to `config.dashboardPath` which is `/business/dashboard`. PASS

- WARNING: **Contact person name splitting is fragile** (line 201-202). `firstName` is derived via `form.contactPerson.split(' ')[0]`, and `lastName` via `.split(' ').slice(1).join(' ')`. For a single-word name (e.g., "Madonna"), `lastName` becomes an empty string. Not a bug but could cause display issues in the layout header initials logic.
- WARNING: **No trade license format validation**. The field accepts any string -- no pattern check for the "TL-0000-0000" placeholder format.
- WARNING: **No phone format guidance**. The `validatePhone` regex (`/^[\d\s\-+()]{7,}$/`) is very permissive -- accepts any 7+ digit/symbol combination.
- Code reference: `src/components/auth/PortalRegister.jsx:89-235`

---

### 2. PortalLogin.jsx (Login Flow) - PASS

- **Business Portal branding**: Title shows "Business Portal Sign In" (line 14), subtitle "Access your employer account". Header bar uses `#003366` color. Gold BVI logo badge. PASS
- **Redirect after login**: Navigates to `config.dashboardPath` which is `/business/dashboard` (line 18). PASS
- **Register link**: Displayed for non-dept portals (line 226-233). Links to `/business/register`. PASS
- **Validation**: Email required + format validated. Password required. Error messages displayed. PASS
- **Password visibility toggle**: Present (line 175-180). PASS
- **Remember me checkbox**: Present but has no actual persistence logic (line 188-196). The `remember` state is set but never used in the `handleSubmit` or session logic.
- WARNING: **"Remember me" checkbox is cosmetic only** -- toggling it has no effect on session persistence. The session is always saved to localStorage regardless. Not a critical bug, but misleading UX.
- Code reference: `src/components/auth/PortalLogin.jsx:71-282`

---

### 3. BusinessLayout.jsx (Business Layout) - PASS with WARNINGS

- **Sidebar nav items**: Dashboard, Work Permits (with children: New Application, Renewals, Status), Job Postings, Documents, Fee Calculator, Payments, Profile. All link to `/business/*` routes. PASS
- **Portal check and redirect**: Line 45-48 checks `user.portal !== 'business'` and redirects to `/${user.portal}/dashboard`. PASS
- **Responsive mobile sidebar**: Hamburger menu toggle (`lg:hidden`), overlay backdrop, slide-in animation with transform/transition. Sidebar closes on nav click. PASS
- **Notifications**: Bell icon with unread count badge. Dropdown shows up to 10 notifications with read/unread state. PASS
- **User menu**: Shows company name (`user.companyName`), email, "Business" badge. Links to Profile, Settings, Sign Out. PASS

- WARNING: **Settings link points to `/business/settings`** (line 163) but there is no route defined for `/business/settings` in App.jsx. This will render a 404/NotFound page.
- WARNING: **Payments nav item** links to `/business/payments` but there is no route defined for `/business/payments` in App.jsx. This will also render a 404.
- Bug: **Missing routes for sidebar nav items**. The sidebar includes "Payments" (`/business/payments`) and the user menu includes "Settings" (`/business/settings`), but neither route is defined in App.jsx (lines 166-173). Users clicking these will get a 404 page.
- Code reference: `src/components/layout/BusinessLayout.jsx:10-271`, `src/App.jsx:166-173`

---

### 4. EmployerDashboard.jsx (Business Dashboard) - PASS with BUGS

- **Active Permits stat card**: Shows count of permits with `status === 'approved'`. PASS
- **Expiring Soon stat card**: Filters approved permits where `daysUntilExpiry <= 30 && days > 0`. PASS
- **Open Vacancies stat card**: Shows count of jobs with `status === 'open'`. PASS
- **Pending Applications stat card**: Shows applications with `status === 'submitted'` or `'under_review'` across employer's jobs. PASS
- **Renewal alerts**: Red urgent banner displayed when `expiringSoon.length > 0`, listing each permit with days left and "Renew Now" button. PASS
- **Active permits table**: Shows up to 8 active permits with employee name, position, permit number, expiry, days left, status badge. PASS

- Bug (HIGH): **Quick action buttons link to wrong routes**. Line 95-99 defines quick actions:
  - "New Permit Application" navigates to `/permits/apply` -- should be `/business/permits/new`
  - "Renew Permit" navigates to `/permits/apply?type=renewal` -- should be `/business/permits/renewals`
  - "Post Job Vacancy" navigates to `/jobs/post` -- should be `/business/jobs` (or a post sub-route)
  - "Calculate Fees" navigates to `/fees` -- should be `/business/fees`
  - "Upload Documents" navigates to `/documents` -- should be `/business/documents`
  These are all legacy routes that get caught by `RedirectToDashboard` in App.jsx, which redirects back to `/business/dashboard` -- creating an infinite-feeling loop where clicking any quick action just reloads the dashboard.
- Bug (HIGH): **"Renew Now" button in expiring permits alert** also navigates to `/permits/apply?type=renewal` (line 141) -- same broken legacy route.
- Bug (MEDIUM): **"View All" link on Active Permits table** navigates to `/permits` (line 180) -- another broken legacy route that redirects to dashboard.
- Bug (MEDIUM): **"View All" link on Recent Activity** navigates to `/jobs` (line 289) -- another broken legacy route.
- Bug (MEDIUM): **"Apply for a Work Permit" link** in empty state navigates to `/permits/apply` (line 249) -- broken legacy route.
- Bug (LOW): **Welcome banner uses `user?.organization`** (line 109) but the registration flow stores the company name as `user.companyName`, not `user.organization`. For newly registered business users, this would fall back to `user.firstName` (the contact person's first name) instead of showing the company name.
- Code reference: `src/components/dashboard/EmployerDashboard.jsx:94-99, 109, 141, 180, 249, 289`

---

### 5. NewPermitForm.jsx (New Permit Application) - PASS with WARNINGS

- **Step 1 (Employer Info)**: Collects company name, trade license, business address, phone, email, industry (from `JOB_CATEGORIES`), authorized signatory. All validated in `validateStep1`. PASS
- **Step 2 (Employee Info)**: Collects full name, nationality, date of birth, passport number, passport expiry, gender, marital status, current address, phone, email. Photo upload with 2MB limit. All validated in `validateStep2`. PASS
- **Step 3 (Position Details)**: Collects job title, department, job description, work location (from `ISLANDS`), start date, annual salary, working hours, qualifications. All validated in `validateStep3`. PASS
- **Step 4 (Documents)**: Lists required and optional documents from `DOCUMENT_TYPES`. Individual file upload per document type with 5MB limit. Shows upload progress count. Accepts PDF, JPG, PNG. PASS
- **Step 5 (Review & Fee)**: Shows full summary of all sections. Displays fee breakdown using `calculateWorkPermitFee`. Shows missing required documents warning. Terms acceptance checkbox required. PASS
- **Draft saving**: Auto-saves to localStorage every 1 second (debounced via `useEffect` with `setTimeout`). Manual "Save Draft" button. Loads draft on mount. Draft cleared after successful submission. PASS
- **Fee calculation on Step 5**: Uses `calculateWorkPermitFee(formData.position.annualSalary)` with no `isDomestic` flag passed -- always calculates as non-domestic. PASS (but see warning below)

- WARNING: **No domestic worker toggle in permit form**. The `calculateWorkPermitFee` call at line 995 never passes `isDomestic = true`. There is no UI control in the form to indicate if the worker is domestic. The standalone Fee Calculator page has this toggle, but the actual permit application always uses the standard tiered rate.
- WARNING: **Step 4 (Documents) has no validation gate**. Unlike Steps 1-3, there is no `validateStep4` function -- the user can proceed to Step 5 without uploading any documents. The missing-documents check only happens at final submission (line 1002-1009), not when advancing from Step 4 to Step 5.
- WARNING: **Post-submission navigation uses legacy routes**. The "Track Application" button navigates to `/permits/status` (line 1076) and "Back to Permits" to `/permits` (line 1080) -- both are legacy routes that redirect to the dashboard instead of `/business/permits/status`.
- Code reference: `src/components/work-permits/NewPermitForm.jsx:938-1181`

---

### 6. Fee Calculator - PASS with BUG (off-by-one)

#### feeCalculator.js Analysis

- **Tier structure** (from constants.js):
  - Tier 1: $0 - $25,000 at 3%
  - Tier 2: $25,001 - $50,000 at 5%
  - Tier 3: $50,001+ at 7%
- **$10K cap**: Enforced at line 30: `Math.min(totalFee, FEE_CAP)`. PASS
- **$50 application fee**: Added to total at line 33. PASS
- **Domestic worker 1% rate**: Applied at line 8 with `FEE_CAP` enforced. PASS

- Bug (MEDIUM): **Off-by-one error in tier taxable calculation**. Line 24: `const taxable = Math.min(remainingSalary, tier.max - tier.min + 1)`. For Tier 1 (min=0, max=25000), `taxable = min(remaining, 25001)`. This means the first $25,001 is taxed at 3%, not $25,000. For Tier 2 (min=25001, max=50000), `taxable = min(remaining, 25000)`. The boundaries overlap: $25,001 is taxed in BOTH Tier 1 (because Tier 1 takes 25,001) and... wait, actually it takes min(remaining, 25001) so remaining becomes salary - 25001. Then Tier 2 taxes min(remaining, 25000). For $40,000 salary: Tier 1 takes min(40000, 25001) = 25001, remaining = 14999. Tier 2 takes min(14999, 25000) = 14999. Fee = 25001 * 0.03 + 14999 * 0.05 = 750.03 + 749.95 = 1499.98, rounded to $1499.98. Total = $1499.98 + $50 = $1549.98. **Expected: $1,550.00** (if tier 1 is exactly $25,000 at 3% = $750, tier 2 is $15,000 at 5% = $750, subtotal $1,500 + $50 = $1,550).

  The `+1` in `tier.max - tier.min + 1` causes Tier 1 to consume $25,001 instead of $25,000. The tier boundaries as defined (`min: 0, max: 25000` then `min: 25001, max: 50000`) already represent inclusive ranges, so the correct formula should be `tier.max - tier.min + 1` for tiers starting at min>0, but for the tier starting at min=0 it produces 25001 instead of 25000. The real problem is that with min=0 and max=25000, the range is 25,001 values (0 through 25,000 inclusive), which is correct for integer ranges but not for continuous salary amounts. This creates a $0.02 discrepancy on a $40,000 salary. The expected fee of $1,550 becomes $1,549.98.

- **Test: $40,000 salary (non-domestic)**:
  - Expected: Tier 1 = $25,000 * 3% = $750, Tier 2 = $15,000 * 5% = $750, Subtotal = $1,500, + $50 app fee = $1,550
  - Actual (code): Tier 1 taxable = min(40000, 25001) = 25001 * 0.03 = $750.03. Tier 2 taxable = min(14999, 25000) = 14999 * 0.05 = $749.95. Subtotal = $1,499.98, rounded = $1,499.98. Total = $1,549.98.
  - **Result: $1,549.98 instead of $1,550.00** -- off by $0.02 due to the tier boundary off-by-one.

- Code reference: `src/utils/feeCalculator.js:21-24`, `src/data/constants.js:92-96`

#### FeeCalculator.jsx (UI) Analysis

- **Salary input**: Text field with dollar formatting and decimal support. PASS
- **Permit type selector**: 5 types with duration display. PASS
- **Domestic worker toggle**: Visual toggle button with rate description. PASS
- **Pro-rating**: For temporary/periodic permits, duration selector allows 1-12 months with proper factor calculation. PASS
- **Tier breakdown table**: Shows salary range, rate, taxable amount, and fee per tier. PASS
- **Bar chart visualization**: Horizontal bars proportional to fee amounts. PASS
- **Print function**: Opens print window with formatted HTML. PASS
- **Fee schedule reference**: Collapsible section showing full fee table. PASS
- Code reference: `src/components/fees/FeeCalculator.jsx:1-424`

---

### 7. PostJobForm.jsx (Job Posting) - PASS

- **Required fields (Step 1 - Job Details)**: Job title, category (from `JOB_CATEGORIES`), employment type, location (from `ISLANDS`), description (min 50 chars). All validated. PASS
- **Step 2 - Compensation**: Min salary (required, must be > 0), max salary (optional, must be >= min), working hours, deadline (must be future date), requirements (optional), belonger preferred checkbox. All validated. PASS
- **Step 3 - Contact**: Contact person, email (regex validated), phone. Pre-populated from user data. PASS
- **Step 4 - Preview**: Full preview of listing with all data formatted. PASS
- **Uses JOB_CATEGORIES constant**: Yes, line 4. PASS
- **Uses ISLANDS constant**: Yes, line 4. PASS
- **Submission**: Calls `postJob` from AppContext with full data including `employerId`, `employerName`. Shows success screen with job number. PASS

- WARNING: **`employerName` uses `user.organization`** (line 77) which is not set during business registration (registration stores `companyName`). Falls back to `user.firstName + user.lastName` (the contact person name, not the company name). This means the employer name on job postings would show the contact person's name instead of the company name.
- Code reference: `src/components/jobs/PostJobForm.jsx:1-338`

---

### 8. DocumentUpload.jsx (Document Upload) - PASS

- **Drag-and-drop**: Implemented with `onDrop`, `onDragOver`, `onDragLeave` handlers. Visual feedback (border color change, scale animation, text change). PASS
- **File type validation**: Accepts only `application/pdf`, `image/jpeg`, `image/png`. Validated in `validateFile` function. Errors displayed per file. PASS
- **File size validation**: 5MB max per file. Validated with clear error message showing actual file size. PASS
- **File input fallback**: Click-to-browse via hidden file input with `accept=".pdf,.jpg,.jpeg,.png"`. PASS
- **Multi-file support**: `multiple` attribute on file input. Files accumulate in state. PASS
- **Image previews**: Generated via `FileReader.readAsDataURL` for image types. PASS
- **Upload progress**: Simulated per-file progress bar (0-100% in 10% increments). PASS
- **Document type selector**: Required before upload. Uses `DOCUMENT_TYPES` constant. PASS
- **Remove file**: X button to remove individual files before upload. PASS
- **Success feedback**: Green confirmation panel with file names and sizes after upload. PASS
- Code reference: `src/components/documents/DocumentUpload.jsx:1-320`

---

### 9. PermitStatus.jsx (Permit Status Tracking) - PASS

- **Search by permit number**: Text input filters by permit number, employee name, or company name (case-insensitive). PASS
- **Visual timeline**: `StatusTimeline` component shows 4-stage flow: Submitted -> Under Review -> Pending Payment -> Approved. Active stage highlighted with ring. Completed stages show green checkmarks. PASS
- **Rejected/Cancelled handling**: Terminal states shown as separate red/gray node appended to timeline. PASS
- **Permit detail expansion**: Click to expand/collapse individual permits showing full details (type, dates, fee, employee info, employer info, position info, notes, expiry). PASS
- **Expiry warnings**: Red/blue banners for expiring/expired permits with day count. PASS
- **Permit card view**: For approved permits, "View Permit Card" button toggles `PermitCard` component. PASS
- **Empty state**: Shows prompt to apply for permit with navigation button. PASS
- **Admin view**: If `user.role === 'admin'`, shows all permits instead of user-filtered. PASS

- WARNING: **Empty state "Apply for a Permit" button** navigates to `/permits` (line 237) -- a legacy route that redirects to the dashboard. Should be `/business/permits/new`.
- Code reference: `src/components/work-permits/PermitStatus.jsx:1-283`

---

### Cross-Portal Bug (noted during Business Portal testing)

- Bug (HIGH): **Job Centre login/register shows Business Portal branding**. In `App.jsx`, the Job Centre routes pass `portal="jobseeker"` (lines 196-197) but `PortalLogin.jsx` and `PortalRegister.jsx` use `portalConfig` with key `"jobs"`, not `"jobseeker"`. The fallback `portalConfig[portal] || portalConfig.business` resolves to the business config, showing "Business Portal Sign In" branding and wrong colors for Job Centre users. The register flow is similarly affected -- it would use business step labels and colors.
- Code reference: `src/App.jsx:196-197`, `src/components/auth/PortalLogin.jsx:39-55`, `src/components/auth/PortalRegister.jsx:57-73`

---

### Summary of All Bugs Found

| # | Severity | Component | Description |
|---|----------|-----------|-------------|
| 1 | HIGH | EmployerDashboard | All 5 quick action buttons use legacy routes (`/permits/apply`, `/jobs/post`, `/fees`, `/documents`) that redirect back to dashboard instead of navigating to `/business/*` routes |
| 2 | HIGH | EmployerDashboard | "Renew Now" button in expiring permits alert uses legacy route `/permits/apply?type=renewal` |
| 3 | HIGH | App.jsx / PortalLogin / PortalRegister | Job Centre portal passes `portal="jobseeker"` but config keys use `"jobs"` -- fallback shows Business Portal branding |
| 4 | MEDIUM | EmployerDashboard | Welcome banner uses `user.organization` but registration stores `user.companyName` -- shows contact person's first name instead of company name |
| 5 | MEDIUM | EmployerDashboard | "View All" links on Active Permits and Recent Activity use legacy routes |
| 6 | MEDIUM | feeCalculator.js | Off-by-one in tier boundary calculation: `tier.max - tier.min + 1` causes $0.02 discrepancy on $40K salary ($1,549.98 vs expected $1,550.00) |
| 7 | MEDIUM | BusinessLayout | Sidebar "Payments" and user menu "Settings" link to routes (`/business/payments`, `/business/settings`) that do not exist in App.jsx |
| 8 | MEDIUM | PostJobForm | `employerName` reads `user.organization` (undefined for registered users) instead of `user.companyName` |
| 9 | LOW | NewPermitForm | Post-submission "Track Application" and "Back to Permits" buttons use legacy routes |
| 10 | LOW | NewPermitForm | No domestic worker toggle -- always calculates fees as non-domestic |
| 11 | LOW | NewPermitForm | No validation gate between Step 4 (Documents) and Step 5 (Review) |
| 12 | LOW | PermitStatus | Empty state "Apply for a Permit" button uses legacy route |
| 13 | LOW | PortalLogin | "Remember me" checkbox is cosmetic -- has no functional effect |
