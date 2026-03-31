# Security & Edge Case Test Results

**Application:** BVI Labour Department Web App
**Date:** 2026-03-30
**Tester:** Automated QA Security Audit
**Scope:** Cross-portal security, authentication, authorization, data integrity, fee accuracy, navigation consistency, responsive design, error handling

---

## 1. Portal Isolation - PASS (with caveats)

### 1.1 RequirePortalAuth Route Guard
- **PASS:** `RequirePortalAuth` (App.jsx:96-116) correctly checks `user.portal !== portal` and redirects mismatched users to their own dashboard.
- **PASS:** Unauthenticated users are redirected to the portal-specific login page.
- **PASS:** Each portal (`/business/*`, `/worker/*`, `/jobs/*`, `/dept/*`) is wrapped in its own `RequirePortalAuth` guard.

### 1.2 Cross-Portal Access Prevention
- **PASS:** A business user accessing `/worker/*` routes will be caught at line 109: `user.portal !== portal` triggers redirect to `/business/dashboard`.
- **PASS:** A worker accessing `/dept/*` routes will be redirected to `/worker/dashboard`.
- **PASS:** A job seeker accessing `/business/*` routes will be redirected to `/jobs/dashboard`.
- **PASS:** A dept user accessing `/business/*` routes will be redirected to `/dept/dashboard`.

### 1.3 Layout Double-Check
- **PASS:** Each layout component (BusinessLayout:45-48, WorkerLayout:36-38, JobsLayout:36-38, DeptLayout:102-106) includes a redundant `useEffect` redirect if portal mismatch detected. Defense-in-depth is good.

### 1.4 Legacy Route Handling
- **PASS:** Legacy routes (`/login`, `/register`, `/dashboard`, `/permits`, `/admin/*`, etc.) at App.jsx:271-282 are all redirected either to `/` or to `RedirectToDashboard`.
- **PASS:** `RedirectToDashboard` (App.jsx:294-300) checks for user and redirects to correct portal dashboard. Falls back to `business` portal if `user.portal` is null (line 298: `user.portal || 'business'`).

### 1.5 Cross-Portal Login Vulnerability
- **Vulnerability:** A business-portal user can log in via the `/worker/login` page. The `login()` function in AuthContext.jsx:100-107 does NOT verify that the user's portal matches the portal the login page belongs to. After login, `PublicPortalRoute` (App.jsx:134-142) will redirect to the user's actual portal dashboard, so the user ends up in the right place. However, this is a **design smell** -- the login endpoint should reject portal mismatches with a clear error message.
- **Severity:** Low
- **Code reference:** AuthContext.jsx:100-107, App.jsx:134-142

---

## 2. Department Permission Enforcement - PASS

### 2.1 RequireDeptPermission Guard
- **PASS:** `RequireDeptPermission` (App.jsx:122-128) calls `hasPermission(permission)` and redirects to `/dept/dashboard` if denied.
- **PASS:** Each sensitive dept route is wrapped in the correct permission guard:
  - `/dept/permits` requires "permits" (line 222)
  - `/dept/disputes/*` requires "disputes" (line 228)
  - `/dept/inspections` requires "inspections" (line 238)
  - `/dept/payments` requires "payments" (line 244)
  - `/dept/appointments` requires "appointments" (line 248)
  - `/dept/users` requires "users" (line 253)
  - `/dept/reports` requires "reports" (line 258)
  - `/dept/settings` requires "settings" (line 262)

### 2.2 hasPermission() Implementation
- **PASS:** `hasPermission` in AuthContext.jsx:152-157 correctly checks: (1) user exists, (2) user.portal is 'dept', (3) DEPT_PERMISSIONS[user.deptRole] contains the permission string.

### 2.3 Specific Role Tests Against DEPT_PERMISSIONS (constants.js:28-37)
- **PASS:** Cashier has only `['payments']` -- cannot access `/dept/permits` (no "permits" permission).
- **PASS:** Front desk has `['appointments', 'lookup']` -- cannot access `/dept/disputes` (no "disputes" permission).
- **PASS:** Permit officer has `['permits', 'payments']` -- cannot access `/dept/settings` (no "settings" permission).
- **PASS:** Dispute officer has `['disputes']` -- cannot access `/dept/users` (no "users" permission).

### 2.4 Sidebar Navigation vs Route Permissions Mismatch
- **Bug:** DeptLayout.jsx shows sidebar links based on `roleNavConfigs[deptRole]` (lines 16-76), but the deputy_commissioner config (lines 28-39) includes a "Settings" link at `/dept/settings`. However, `DEPT_PERMISSIONS.deputy_commissioner` (constants.js:30) does NOT include "settings". This means the deputy commissioner sees a Settings link in the sidebar but is immediately redirected to `/dept/dashboard` when clicking it.
- **Severity:** Medium
- **Code reference:** DeptLayout.jsx:38 vs constants.js:30

### 2.5 Sidebar Links to Unrouted Pages
- **Bug:** DeptLayout.jsx includes sidebar links for routes that have no corresponding `<Route>` in App.jsx:
  - `/dept/placements` (commissioner, deputy, placement_officer) -- no route exists
  - `/dept/permits/queue` (permit_officer) -- no route exists
  - `/dept/payments/verify` (permit_officer) -- no route exists
  - `/dept/disputes/mediation` (dispute_officer) -- no route exists
  - `/dept/disputes/files` (dispute_officer) -- no route exists
  - `/dept/placements/vacancies` (placement_officer) -- no route exists
  - `/dept/placements/matching` (placement_officer) -- no route exists
  - `/dept/inspections/compliance` (inspector) -- no route exists
  - `/dept/inspections/violations` (inspector) -- no route exists
  - `/dept/payments/receipts` (cashier) -- no route exists
  - `/dept/payments/fees` (cashier) -- no route exists
  - `/dept/permits/lookup` (front_desk) -- no route exists
  - `/dept/visitors` (front_desk) -- no route exists
  These will either hit the catch-all NotFoundPage or, if nested under a wildcard route, may render unexpected content.
- **Severity:** Medium (broken UI/UX for dept staff)
- **Code reference:** DeptLayout.jsx:16-76 vs App.jsx:217-266

### 2.6 Missing placement_officer Default Account
- **Bug:** `defaultDeptUsers` in AuthContext.jsx:13-63 does not include a `placement_officer` account, despite the role being defined in `DEPT_ROLES` and having entries in `DEPT_PERMISSIONS` and `roleNavConfigs`. There is no way to test this role without manually creating the user.
- **Severity:** Low
- **Code reference:** AuthContext.jsx:13-63, constants.js:21

### 2.7 UserManagement Double Gate
- **PASS:** UserManagement.jsx has its own access check at line 54: `if (!currentUser || !ALLOWED_ROLES.includes(currentUser.deptRole))` with ALLOWED_ROLES = ['commissioner', 'deputy_commissioner']. This is defense-in-depth on top of the route-level "users" permission.

---

## 3. Authentication Edge Cases - MIXED

### 3.1 localStorage Cleared Mid-Session
- **PASS:** On app load, AuthContext.jsx:88-93 attempts to restore session from `SESSION_KEY`. If `localStorage` is cleared, `session` will be null, `setUser(found)` won't execute, and user stays `null`. The app will redirect to login gracefully.
- **PASS:** `getStorage()` in helpers.js:38 wraps `JSON.parse` in a try/catch, returning `null` on failure.

### 3.2 Session References Deleted User
- **PASS:** AuthContext.jsx:91 does `allUsers.find(u => u.id === session.userId)`. If the user was deleted from the users array, `found` will be `undefined`, and `setUser` won't be called. The user stays logged out. Correct behavior.

### 3.3 Default Department Users Merge Logic
- **PASS:** AuthContext.jsx:76-84 uses an idempotent merge: it checks `existing.find(u => u.id === def.id)` before pushing. This prevents duplication on each app load.
- **Note:** If a default user's data is changed (e.g., email updated in code), the existing record in localStorage will NOT be updated. The old record persists. This is by-design for localStorage-based prototypes but could cause confusion.
- **Severity:** Low (informational)

### 3.4 CRITICAL: Passwords Stored in Plain Text
- **CRITICAL:** All passwords are stored as plain text in localStorage. Default department accounts use `password: 'admin123'` (AuthContext.jsx:16, 22, 29, 36, 43, 50, 57). User-registered passwords are stored as-is in the user object (AuthContext.jsx:113). The `login()` function compares plain text directly (line 102: `u.password === password`).
- **Impact:** Any script on the same origin, any XSS attack, any browser extension, or anyone with physical access can read all passwords by inspecting `localStorage.getItem('bvi_labour_users')`.
- **Severity:** CRITICAL
- **Code reference:** AuthContext.jsx:16 (hardcoded passwords), AuthContext.jsx:102 (plain text comparison), AuthContext.jsx:113 (plain text storage)

### 3.5 CRITICAL: Demo Credentials Exposed in UI
- **CRITICAL:** PortalLogin.jsx:246-261 displays commissioner credentials (`commissioner@labour.gov.vg` / `admin123`) directly on the dept login page for "Demo" purposes. In a production deployment, this would give any visitor full commissioner access.
- **Severity:** CRITICAL (in production)
- **Code reference:** PortalLogin.jsx:246-261

### 3.6 All Default Dept Users Share Same Password
- **Vulnerability:** All 7 default department accounts share the password `admin123`. If any account is compromised, all are compromised.
- **Severity:** High
- **Code reference:** AuthContext.jsx:13-63

### 3.7 No Rate Limiting on Login
- **Vulnerability:** The `login()` function (AuthContext.jsx:100-107) has no rate limiting, account lockout, or brute-force protection. An attacker could try unlimited password combinations.
- **Severity:** High (in production; expected for prototype)
- **Code reference:** AuthContext.jsx:100-107

### 3.8 No Session Expiry
- **Vulnerability:** Once `SESSION_KEY` is set in localStorage, it persists indefinitely until manually cleared. There is no session timeout or expiry mechanism.
- **Severity:** Medium
- **Code reference:** AuthContext.jsx:104-106

### 3.9 logout() Uses localStorage.removeItem Directly
- **Observation:** AuthContext.jsx:121 uses `localStorage.removeItem(SESSION_KEY)` directly instead of the app's `setStorage`/`getStorage` abstraction. Inconsistent but functionally correct since `removeItem` doesn't need JSON parsing.
- **Severity:** Low (code smell)

---

## 4. Registration Edge Cases - PASS (with issues)

### 4.1 Duplicate Email Prevention
- **PASS:** AuthContext.jsx:111 checks `users.find(u => u.email.toLowerCase() === userData.email.toLowerCase())` and returns an error if the email already exists. Case-insensitive comparison is correct.

### 4.2 Dept Portal Registration Prevention
- **PASS:** There is no `/dept/register` route in App.jsx (confirmed at line 214: comment says "No public registration for dept - staff accounts are provisioned"). The `portalConfig` in PortalRegister.jsx does not include a `dept` entry. If someone manually navigated to a hypothetical dept register URL, it would hit the catch-all NotFoundPage.

### 4.3 Field Validation Before Submission
- **PASS:** `validateStep()` in PortalRegister.jsx:116-164 validates all required fields per step:
  - Business: companyName, tradeLicense, industry, contactPerson (step 0), email, phone, island (step 1), password >= 8 chars and match (step 2)
  - Worker: firstName, lastName, nationality, email, phone (step 0), currentEmployer (step 1), password (step 2)
  - Jobs: firstName, lastName, email, phone (step 0), educationLevel (step 1), password (step 2)

### 4.4 Portal Field Set Correctly
- **PASS:** PortalRegister.jsx:187 sets `portal` from the prop, and App.jsx passes the correct portal string to each `<PortalRegister portal="business|worker|jobs">` route.
- **Bug:** For the "jobs" portal, the PortalRegister sets `portal: 'jobs'` (line 187) but the actual portal value used by the auth system is `'jobseeker'` (as seen in App.jsx:200 RequirePortalAuth checks for `portal="jobseeker"`). However, looking more carefully: `portalConfig` in PortalRegister.jsx has the key `'jobs'` (line 57-72), and `handleSubmit` sets `userData.portal = portal` where `portal` prop is `"jobseeker"` -- wait, checking App.jsx:197: the register route is `<PortalRegister portal="jobseeker" />`. Actually no, checking App.jsx:198: it is `<PortalRegister portal="jobseeker" />`. Let me re-check...

  Actually, App.jsx line 198: `<PortalRegister portal="jobseeker" />` -- but wait, the portalConfig keys in PortalRegister.jsx are `business`, `worker`, `jobs`. Line 92: `const config = portalConfig[portal] || portalConfig.business;`. If `portal="jobseeker"`, then `portalConfig['jobseeker']` is undefined, so it falls back to `portalConfig.business`. This means the Job Seeker registration page would render with the **Business Portal** config (wrong colors, wrong steps, wrong labels)!

  Wait, let me re-read App.jsx more carefully. Line 198: `<PortalRegister portal="jobseeker" />`. But looking at the actual JSX... No, checking precisely:

  App.jsx line 197: `<Route path="/jobs/register" element={<PortalRegister portal="jobseeker" />} />`

  So portal prop is `"jobseeker"`, but PortalRegister.jsx line 92 looks up `portalConfig["jobseeker"]` which does NOT exist (only `business`, `worker`, `jobs` exist). Falls back to `portalConfig.business`.

- **Bug:** PortalRegister receives `portal="jobseeker"` but its `portalConfig` uses key `"jobs"`. The fallback `portalConfig.business` is used, causing the Job Seeker registration page to display Business Portal branding, Business form fields, and register users with `portal: 'jobseeker'` but `role: 'employer'` (from business flow at line 193-204).
- **Severity:** HIGH
- **Code reference:** App.jsx:197 (`portal="jobseeker"`), PortalRegister.jsx:26-73 (portalConfig uses key `"jobs"` not `"jobseeker"`), PortalRegister.jsx:92 (fallback to `portalConfig.business`)

  **Actually, let me re-verify:** On further inspection of App.jsx line 197:
  ```
  <Route path="/jobs/register" element={<PortalRegister portal="jobseeker" />} />
  ```
  The prop is indeed `"jobseeker"`. And in PortalRegister.jsx, `portalConfig` has keys: `business`, `worker`, `jobs`. So `portalConfig["jobseeker"]` is `undefined`, and the fallback at line 92 produces `portalConfig.business`. Furthermore, `handleSubmit` at lines 193-225 branches on `portal === 'business'`, `portal === 'worker'`, `portal === 'jobs'`. Since `portal` is `"jobseeker"`, NONE of these branches match, so `userData` only contains `{ portal: 'jobseeker', email, phone, password }` -- missing firstName, lastName, role, etc.

  **Corrected assessment:** The bug is that `portal="jobseeker"` does not match any of the `portalConfig` keys (`"jobs"`) or the conditional branches in `handleSubmit` (`"business"`, `"worker"`, `"jobs"`). This means:
  1. Wrong UI renders (business portal config used as fallback)
  2. User data is incomplete (no role, no name fields saved)

- **Severity:** CRITICAL -- Job Seeker registration is fundamentally broken
- **Code reference:** App.jsx:197, PortalRegister.jsx:89-225

### 4.5 Similarly Check PortalLogin for Same Bug
- PortalLogin.jsx has `portalConfig` keys: `business`, `worker`, `jobs`, `dept` (lines 8-68). For the login route at App.jsx:196: `<PortalLogin portal="jobseeker" />`. `portalConfig["jobseeker"]` is undefined, falls back to `portalConfig.business`.
- **Bug:** Job Centre login page renders with Business Portal branding instead of Job Centre branding.
- **Severity:** HIGH
- **Code reference:** App.jsx:196, PortalLogin.jsx:8-74

### 4.6 Password Strength Indicator vs Actual Validation Mismatch
- **Observation:** The password strength meter (PortalRegister.jsx:75-87) shows indicators for uppercase, numbers, and special characters, but the actual validation only requires 8+ characters (line 161: `form.password.length < 8`). A password of "abcdefgh" passes validation but shows as "Weak". The strength indicators are advisory only.
- **Severity:** Low (informational)

---

## 5. Data Integrity - MIXED

### 5.1 localStorage Persistence
- **PASS:** AppContext.jsx:19-26 loads all data from localStorage on mount. The `save()` helper (line 28) updates both React state and localStorage synchronously.
- **PASS:** Try/catch exists in `getStorage()` (helpers.js:38) for read operations.
- **Vulnerability:** `setStorage()` (helpers.js:39) does NOT wrap `localStorage.setItem` in try/catch. If localStorage is full (5MB quota), this will throw an unhandled exception that could crash the app.
- **Severity:** Medium
- **Code reference:** helpers.js:39

### 5.2 Permit Data Isolation (Can User See Another User's Permits?)
- **PASS:** `getPermitsByUser` (AppContext.jsx:107) filters by `p.userId === userId || p.employerId === userId`. This correctly limits permits to those where the user is either the worker or the employer.
- **Vulnerability:** However, the raw `permits` array is exposed on the context value (AppContext.jsx:115: `permits, disputes, jobs, ...`). Any component can access `permits` directly without filtering, bypassing the per-user filter. A developer could accidentally (or maliciously via console) access all permits.
- **Severity:** Medium (architectural concern for client-side data)
- **Code reference:** AppContext.jsx:115 (raw array exposed)

### 5.3 Dispute Data Isolation
- **PASS:** `getDisputesByUser` (AppContext.jsx:108) filters by `d.userId === userId`.
- **Same vulnerability as 5.2:** Raw `disputes` array is exposed on context.
- **Severity:** Medium
- **Code reference:** AppContext.jsx:108, 115

### 5.4 Document Data Isolation
- **PASS:** `getDocsByUser` (AppContext.jsx:111) filters by `d.userId === userId`.
- **Same vulnerability as 5.2:** Raw `documents` array is exposed on context.
- **Severity:** Medium
- **Code reference:** AppContext.jsx:111, 115

### 5.5 DisputeTracker Exposes All Disputes
- **Observation:** DisputeTracker.jsx:21 destructures `disputes: allDisputes` from `useApp()`. Although it appears to use `getDisputesByUser(user.id)` for the main listing, the `allDisputes` variable is available in scope. Currently this variable is destructured but does not appear to be used in the visible portion -- but its presence is a concern.
- **Severity:** Low

### 5.6 Permit Number Collision Risk
- **Vulnerability:** `generatePermitNumber` (helpers.js:3-6) uses `Math.floor(1000 + Math.random() * 9000)` which generates a 4-digit random number. With 8999 possible values, collisions become likely after ~100 permits per year (birthday paradox). Similarly, `generateId` uses `Date.now()` + 9 random chars, which has very low collision risk.
- **Severity:** Low (acceptable for prototype)
- **Code reference:** helpers.js:3-6

### 5.7 Case Number Collision Risk
- Same issue with `caseNumber` generation in AppContext.jsx:57: `DC-${year}-${Math.floor(1000 + Math.random() * 9000)}`.
- **Severity:** Low
- **Code reference:** AppContext.jsx:57

---

## 6. Fee Calculator Accuracy - FAIL

### 6.1 Tier Boundary Off-By-One Error
- **CRITICAL BUG:** The FEE_TIERS in constants.js:92-96 define:
  ```
  { min: 0, max: 25000, rate: 0.03 }
  { min: 25001, max: 50000, rate: 0.05 }
  { min: 50001, max: Infinity, rate: 0.07 }
  ```
  In feeCalculator.js:23, the taxable amount per tier is computed as:
  ```
  const taxable = Math.min(remainingSalary, tier.max - tier.min + 1);
  ```
  For Tier 1: `taxable = Math.min(remainingSalary, 25000 - 0 + 1)` = **25001**, not 25000.
  For Tier 2: `taxable = Math.min(remainingSalary, 50000 - 25001 + 1)` = **25000**. This is correct.
  For Tier 3: `taxable = Math.min(remainingSalary, Infinity - 50001 + 1)` = **Infinity**. This effectively captures all remaining salary, which is correct behavior but through an unusual path.

  **The off-by-one on Tier 1** means $25,001 is taxed at 3% in Tier 1 instead of $25,000 at 3% and $1 at 5%. Impact: $1 * (0.05 - 0.03) = $0.02 overcharge on Tier 1 / undercharge on Tier 2. Net effect on total: negligible per transaction, but it's a correctness bug.

### 6.2 Test Case: $25,000 Salary
- Expected: $25,000 * 0.03 = $750 + $50 = $800
- Actual (tracing code): `remainingSalary = 25000`. Tier 1: `taxable = Math.min(25000, 25001) = 25000`. `amount = 25000 * 0.03 = 750`. Tier 2: `remainingSalary = 0`, loop breaks. `permitFee = min(750, 10000) = 750`. Total = $800.
- **PASS** for this specific case.

### 6.3 Test Case: $50,000 Salary
- Expected: $25,000 * 0.03 + $25,000 * 0.05 = $750 + $1,250 = $2,000 + $50 = $2,050
- Actual: `remainingSalary = 50000`. Tier 1: `taxable = Math.min(50000, 25001) = 25001`. `amount = 25001 * 0.03 = 750.03`. `remainingSalary = 24999`. Tier 2: `taxable = Math.min(24999, 25000) = 24999`. `amount = 24999 * 0.05 = 1249.95`. Total fee = 750.03 + 1249.95 = 1999.98. Capped = min(1999.98, 10000) = 1999.98. After rounding: $2000.0 (due to rounding in breakdown). Total = $2049.98.
- **FAIL:** Off by $0.02 from expected $2,050.00. The off-by-one in tier boundary (`25001` instead of `25000`) causes $1 to be taxed at 3% instead of 5%.
- **Severity:** Medium (financial accuracy)
- **Code reference:** feeCalculator.js:23, constants.js:92-96

### 6.4 Test Case: $100,000 Salary
- Expected: $750 + $1,250 + $50,000 * 0.07 = $750 + $1,250 + $3,500 = $5,500 + $50 = $5,550
- Actual: Tier 1: taxable = 25001, amount = 750.03. Tier 2: taxable = 25000, amount = 1250.00. `remainingSalary = 100000 - 25001 - 25000 = 49999`. Tier 3: taxable = 49999, amount = 3499.93. Total = 750.03 + 1250.00 + 3499.93 = 5499.96. Rounded: $5499.96. Total = $5549.96.
- **FAIL:** Off by $0.04 from expected $5,550.00.
- **Severity:** Medium (financial accuracy)
- **Code reference:** feeCalculator.js:23

### 6.5 Test Case: $200,000 Salary (Cap Test)
- Expected: Fee exceeds $10,000, so cap applies. Total = $10,000 + $50 = $10,050.
- Actual: Tier 1: 25001 * 0.03 = 750.03. Tier 2: 25000 * 0.05 = 1250. Remaining = 149999. Tier 3: 149999 * 0.07 = 10499.93. Total = 12499.96. Capped to $10,000. Total = $10,050.
- **PASS** (cap works correctly, and `capped: true` flag is set).

### 6.6 Test Case: Domestic Worker $30,000
- Expected: $30,000 * 0.01 = $300 + $50 = $350
- Actual: feeCalculator.js:8: `permitFee = Math.min(30000 * 0.01, 10000) = Math.min(300, 10000) = 300`. Total = $350.
- **PASS**

### 6.7 $0 Salary Edge Case
- **PASS:** feeCalculator.js:5 returns early with `permitFee: 0`, `total: APPLICATION_FEE ($50)`.
- **Note:** A $0 salary still incurs a $50 application fee. This may or may not be intended.
- **Severity:** Low (business rule question)

### 6.8 Negative Salary Edge Case
- feeCalculator.js:4: `parseFloat(annualSalary) || 0` -- a negative number passes `parseFloat` and is NOT zero. Line 5: `salary <= 0` catches negative values and returns early.
- **PASS**

---

## 7. Constants Verification - PASS (with issues)

### 7.1 PERMIT_TYPES
- **PASS:** Six types defined (new, renewal, temporary, periodic, self-employed, emergency) with appropriate labels, durations, and processing times.
- **Note:** Emergency permit has `fee: 'Flat rate'` but there's no special handling in the fee calculator for emergency flat-rate permits. All permit types go through the same salary-based calculation.
- **Severity:** Low (missing feature, not a bug)
- **Code reference:** constants.js:47-54

### 7.2 DEPT_PERMISSIONS
- **PASS:** All 8 dept roles have permission entries. Commissioner has all permissions. Each role has appropriate access levels.
- **Bug:** `placement_officer` has `['jobs']` permission, but the DeptLayout sidebar routes it to `/dept/placements` (not `/dept/jobs`), and there is a route for `/dept/jobs/*` under the `jobs` permission in App.jsx:233-235. The sidebar link label says "Job Placements" but routes to `/dept/placements` which has no route.
- **Severity:** Medium
- **Code reference:** constants.js:33, DeptLayout.jsx:53-57, App.jsx:233-235

### 7.3 DEPARTMENT_INFO
- **PASS:** All fields populated: name, shortName, ministry, address, phone, fax, email, hours, cashierHours, commissioner, minimumWage, minimumWageEffective.
- **Note:** Commissioner listed as "Mervin Hastings (Acting)" -- may need updating over time.
- **Severity:** Informational

### 7.4 PORTALS
- **PASS:** Four portals defined (BUSINESS, WORKER, JOBS, DEPT) with correct paths.
- **Observation:** JOBS portal has `id: 'jobs'` but user portal value for job seekers is `'jobseeker'`. This mismatch is the root cause of several bugs documented above.
- **Severity:** High (root cause of portal mismatch bugs in tests 4.4 and 4.5)
- **Code reference:** constants.js:40-45

---

## 8. Navigation Consistency - MIXED

### 8.1 BusinessLayout Navigation
- **PASS:** All sidebar links point to `/business/*` routes:
  - `/business/dashboard`, `/business/permits/new`, `/business/permits/renewals`, `/business/permits/status`, `/business/jobs`, `/business/documents`, `/business/fees`, `/business/payments`, `/business/profile`
- **Bug:** `/business/payments` link exists in sidebar (BusinessLayout.jsx:24) but there is no `/business/payments` route in App.jsx. Only `/business/fees/*` exists.
- **Severity:** Medium (broken link)
- **Code reference:** BusinessLayout.jsx:24 vs App.jsx:166-173

### 8.2 WorkerLayout Navigation
- **PASS:** All sidebar links point to `/worker/*` routes.
- **Bug:** `/worker/id-card` link exists in sidebar (WorkerLayout.jsx:13) but there is no `/worker/id-card` route in App.jsx. Only `/worker/permit` exists (which maps to IDCardPage).
- **Severity:** Medium (broken link)
- **Code reference:** WorkerLayout.jsx:13 vs App.jsx:183-190

### 8.3 JobsLayout Navigation
- **PASS:** All sidebar links point to `/jobs/*` routes: `/jobs/dashboard`, `/jobs/search`, `/jobs/applications`, `/jobs/resume`, `/jobs/training`, `/jobs/profile`. All match App.jsx routes.

### 8.4 DeptLayout Navigation
- Multiple broken links documented in section 2.5 above.

### 8.5 PermitsPage Hardcoded Non-Portal Routes
- **Bug:** PermitsPage.jsx (lines 16-21) has hardcoded NAV_ITEMS with paths like `/permits`, `/permits/status`, `/permits/all`. These are absolute paths without the portal prefix. Since PermitsPage is rendered under `/business/permits/*`, these sub-routes use React Router's `<Routes>` with relative paths (line 77-84), which is correct for the nested routes. However, the `NavLink to="/permits"` at line 17 is an ABSOLUTE path pointing to the legacy `/permits` route, which redirects to the dashboard.
- **Severity:** HIGH -- Clicking "Apply" or "Track Status" tabs in the business permits page navigates away to the dashboard instead of staying in the permits section.
- **Code reference:** PermitsPage.jsx:16-21

### 8.6 DisputesPage Has No Hardcoded Route Issues
- **PASS:** DisputesPage.jsx uses tab-based navigation (state-driven), not route links. No URL path issues.

### 8.7 BusinessLayout Settings Link
- **Bug:** BusinessLayout.jsx:163 has a user menu link to `/business/settings`, but there is no `/business/settings` route in App.jsx.
- **Severity:** Low (broken link in dropdown menu)
- **Code reference:** BusinessLayout.jsx:163

---

## 9. Responsive Design Check - PASS

### 9.1 Mobile Sidebar Toggle
- **PASS:** All four layouts implement mobile sidebar with:
  - Toggle button visible on `lg:hidden` (hamburger menu)
  - Sidebar uses `fixed` positioning with `transform translate-x` animation
  - Mobile overlay backdrop (`fixed inset-0 bg-black/40 z-40 lg:hidden`) closes sidebar on click
  - Code references: BusinessLayout.jsx:80-85, WorkerLayout.jsx:74-79, JobsLayout.jsx:69-75, DeptLayout.jsx:141-145

### 9.2 Fixed Widths
- **PASS:** Sidebars use `w-64` (16rem / 256px) which is appropriate.
- **PASS:** Main content uses `flex-1` and `overflow-x-hidden` to prevent horizontal scroll.
- **PASS:** No hardcoded pixel widths that would break mobile.

### 9.3 Table Horizontal Scroll
- **PASS:** FeeCalculator.jsx:209 uses `overflow-x-auto` wrapper around tables.
- **PASS:** PermitsPage/DisputesPage use tab navigation (responsive) rather than wide tables.
- **Note:** No DataTable.jsx audit was done -- that component may have its own scroll handling.

### 9.4 Responsive Grid
- **PASS:** Registration forms use `grid-cols-2 gap-4` for name fields which will stack on mobile if Tailwind breakpoint classes are used (though the grid-cols-2 is not conditional -- it will always be 2 columns even on narrow screens).
- **Bug:** PortalRegister.jsx:300 uses `grid grid-cols-2 gap-4` without responsive prefix. On very narrow screens (<320px), the two name fields will be extremely cramped.
- **Severity:** Low
- **Code reference:** PortalRegister.jsx:300

---

## 10. Error Handling - MIXED

### 10.1 useApp() Outside AppProvider
- **PASS:** AppContext.jsx:128-130 throws `Error('useApp must be inside AppProvider')` if context is null.

### 10.2 useAuth() Outside AuthProvider
- **PASS:** AuthContext.jsx:171-174 throws `Error('useAuth must be inside AuthProvider')` if context is null.

### 10.3 localStorage Try/Catch
- **PASS:** `getStorage()` (helpers.js:38) wraps JSON.parse in try/catch.
- **FAIL:** `setStorage()` (helpers.js:39) does NOT have try/catch. localStorage quota exceeded errors will be unhandled.
- **Severity:** Medium
- **Code reference:** helpers.js:39

### 10.4 No Error Boundary
- **Vulnerability:** The App component (App.jsx:305-315) does not wrap its tree in a React Error Boundary. An uncaught render error in any component will crash the entire app with a white screen.
- **Severity:** Medium
- **Code reference:** App.jsx:305-315

### 10.5 Async Operations Without Error Handling
- **Vulnerability:** PortalRegister.jsx:185 uses `setTimeout` for simulated async but the `register()` call inside has no try/catch. If `register()` throws (e.g., localStorage is full during `setStorage`), the error will be unhandled.
- **Severity:** Low
- **Code reference:** PortalRegister.jsx:185-235

---

## RISK SUMMARY TABLE

| # | Finding | Severity | Category | File Reference |
|---|---------|----------|----------|---------------|
| 1 | Passwords stored in plain text in localStorage | **CRITICAL** | Authentication | AuthContext.jsx:16,102,113 |
| 2 | Demo credentials displayed on dept login page | **CRITICAL** | Authentication | PortalLogin.jsx:246-261 |
| 3 | Job Seeker registration completely broken (portal="jobseeker" vs portalConfig key "jobs") | **CRITICAL** | Registration | App.jsx:197, PortalRegister.jsx:26-92 |
| 4 | Fee calculator off-by-one in tier boundary ($1 overcharged to wrong tier) | **MEDIUM** | Financial | feeCalculator.js:23, constants.js:92-96 |
| 5 | PermitsPage hardcoded /permits paths bypass portal prefix | **HIGH** | Navigation | PermitsPage.jsx:16-21 |
| 6 | Job Centre login page renders Business Portal branding | **HIGH** | UI/Auth | App.jsx:196, PortalLogin.jsx:8-74 |
| 7 | All default dept accounts share password "admin123" | **HIGH** | Authentication | AuthContext.jsx:13-63 |
| 8 | No brute-force protection on login | **HIGH** | Authentication | AuthContext.jsx:100-107 |
| 9 | Deputy commissioner sidebar shows Settings but lacks permission | **MEDIUM** | Authorization | DeptLayout.jsx:38, constants.js:30 |
| 10 | 13+ dept sidebar links point to non-existent routes | **MEDIUM** | Navigation | DeptLayout.jsx:16-76, App.jsx:217-266 |
| 11 | /business/payments sidebar link has no route | **MEDIUM** | Navigation | BusinessLayout.jsx:24, App.jsx:166-173 |
| 12 | /worker/id-card sidebar link has no route | **MEDIUM** | Navigation | WorkerLayout.jsx:13, App.jsx:183-190 |
| 13 | setStorage() lacks try/catch for quota errors | **MEDIUM** | Error Handling | helpers.js:39 |
| 14 | No React Error Boundary | **MEDIUM** | Error Handling | App.jsx:305-315 |
| 15 | No session expiry mechanism | **MEDIUM** | Authentication | AuthContext.jsx:104-106 |
| 16 | Raw data arrays exposed on context (permits, disputes, docs) | **MEDIUM** | Data Isolation | AppContext.jsx:115 |
| 17 | PORTALS.JOBS.id is "jobs" but user.portal is "jobseeker" (root cause of multiple bugs) | **HIGH** | Constants | constants.js:43 |
| 18 | Missing placement_officer default account | **LOW** | Configuration | AuthContext.jsx:13-63 |
| 19 | Permit/case number collision possible | **LOW** | Data Integrity | helpers.js:3-6, AppContext.jsx:57 |
| 20 | No Error Boundary wrapping AppRoutes | **MEDIUM** | Error Handling | App.jsx:305-315 |
| 21 | Password strength UI suggests requirements not enforced | **LOW** | UX | PortalRegister.jsx:75-87,161 |
| 22 | Cross-portal login allowed (user lands in correct portal but no portal-match validation) | **LOW** | Authentication | AuthContext.jsx:100-107 |
| 23 | /business/settings link in user menu has no route | **LOW** | Navigation | BusinessLayout.jsx:163 |
| 24 | Name fields grid-cols-2 not responsive on narrow screens | **LOW** | Responsive | PortalRegister.jsx:300 |
| 25 | Emergency permit flat-rate fee not implemented in calculator | **LOW** | Feature Gap | constants.js:53, feeCalculator.js |

---

**Summary:**
- **3 CRITICAL** findings (plain-text passwords, exposed demo credentials, broken Job Seeker registration)
- **4 HIGH** findings (broken permits navigation, wrong login branding, shared default passwords, no brute-force protection)
- **8 MEDIUM** findings (fee calculation accuracy, missing routes, no error boundary, data exposure)
- **10 LOW** findings (minor UX, code smells, missing features)

The most urgent issues requiring immediate attention before any production deployment are the plain-text password storage, the completely broken Job Seeker registration flow (portal value mismatch), and the removal of demo credentials from the login UI.
