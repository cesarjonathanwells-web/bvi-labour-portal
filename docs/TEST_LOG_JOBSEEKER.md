## Job Centre Test Results

**Tester:** Tamara Penn (tamara.penn@email.vg) - Virgin Islander looking for work
**Date:** 2026-03-30
**Portal Under Test:** Job Centre (/jobs/*)
**User Portal Value:** `jobseeker` (stored on user object) mapped to URL path `/jobs/*`

---

### 1. Job Seeker Registration (PortalRegister.jsx) - FAIL

- **Step 0 (Personal Info):** Collects firstName, lastName, belongerStatus, email, phone - PASS
- **Step 1 (Skills & Education):** Collects skills (textarea), educationLevel (dropdown) - PASS
- **Step 2 (Create Password):** Password with strength meter, confirm password - PASS
- Belonger status options include: Virgin Islander, Belonger, Permanent Resident, Other - PASS
- Education levels include standard options from High School through Doctorate plus Trade/Vocational - PASS
- Password strength indicator with real-time requirements checklist - PASS
- Bug: **Portal value mismatch on registration.** The `portal` prop passed to PortalRegister is `'jobs'` (from App.jsx line 199: `portal="jobseeker"`). Wait -- actually let me re-check. App.jsx line 199 passes `portal="jobseeker"` but the portalConfig in PortalRegister.jsx only has keys `business`, `worker`, `jobs` (line 26-73). This means `portalConfig['jobseeker']` returns `undefined` and falls back to `portalConfig.business` (line 92). **This is a CRITICAL BUG.**
- Bug: **Registration uses wrong portal config.** When `portal="jobseeker"` is passed from App.jsx, `portalConfig[portal]` resolves to `undefined` because the key is `jobs`, not `jobseeker`. The fallback `portalConfig.business` is used instead, showing the Business Portal registration flow (blue branding, company info fields) instead of the gold Job Seeker flow.
- Code reference: `src/App.jsx:199` passes `portal="jobseeker"`, but `src/components/auth/PortalRegister.jsx:26-73` uses key `jobs` not `jobseeker`.
- Bug: **Validation path also broken.** The `validateStep()` function checks `if (portal === 'jobs')` (line 146) but receives `portal="jobseeker"`, so the jobseeker-specific validation is never executed. Instead, business validation fires by default.
- Bug: **Submit handler also broken.** The `handleSubmit()` checks `if (portal === 'jobs')` (line 215) to build jobseeker user data. Since portal is `'jobseeker'`, none of the portal-specific branches match, so the user object only gets `{portal: 'jobseeker', email, phone, password}` with NO firstName, lastName, skills, or education.
- Bug: **Stored portal value is `'jobseeker'` (correct for Auth/routing) but the component's internal logic expects `'jobs'`.** The entire registration form is broken for job seekers.

### 2. Job Seeker Login (PortalLogin.jsx) - FAIL

- **Same portal key mismatch bug.** App.jsx line 199 passes `portal="jobseeker"` to PortalLogin, but PortalLogin's `portalConfig` (line 8-68) uses key `jobs` not `jobseeker`.
- Bug: `portalConfig['jobseeker']` is `undefined`, so it falls back to `portalConfig.business` (line 74). The login page shows **blue Business Portal branding** instead of gold Job Centre branding.
- Bug: **Wrong dashboard redirect after login.** The fallback config sets `dashboardPath: '/business/dashboard'` instead of `/jobs/dashboard`. A job seeker who logs in would be redirected to the business dashboard, where the portal guard would then bounce them again.
- Gold branding (#c5a55a) is defined in the `jobs` config (line 40) but never reached because the key doesn't match.
- Title would show "Business Portal Sign In" instead of "Job Centre Sign In".
- Register link would point to `/business/register` instead of `/jobs/register`.
- Code reference: `src/App.jsx:199` and `src/components/auth/PortalLogin.jsx:8-68`

### 3. Jobs Layout (JobsLayout.jsx) - WARNING

- Navigation items correct: Dashboard, Search Jobs, My Applications, My Resume, Training Programs, Profile - PASS
- Routes match: /jobs/dashboard, /jobs/search, /jobs/applications, /jobs/resume, /jobs/training, /jobs/profile - PASS
- Gold branding (#c5a55a) with dark navy text (#003366) - PASS
- Header shows "BVI Job Centre" with "Workforce Development & Job Placement" subtitle - PASS
- Notification bell with unread count - PASS
- User menu with initials avatar, name, "Job Seeker" badge, profile link, sign out - PASS
- Sidebar with "Job Centre" badge, mobile responsive with overlay - PASS
- Bug: **Portal guard checks wrong value.** Line 36 checks `user.portal !== 'jobs'` but the registered user's portal value is `'jobseeker'` (set during registration). This means **every jobseeker user will be immediately redirected away** from the Jobs layout because `'jobseeker' !== 'jobs'` is true.
- Code reference: `src/components/layout/JobsLayout.jsx:36` -- `user.portal !== 'jobs'` should be `user.portal !== 'jobseeker'`

### 4. Job Seeker Dashboard (JobSeekerDashboard.jsx) - WARNING

- Welcome message with user's firstName - PASS
- Stat cards: Available Jobs, My Applications, Profile Score, Training Available - PASS
- Profile completeness calculation using 8 fields (firstName, lastName, email, phone, skills, experience, education, resume) - PASS
- Profile completeness banner shown when under 80% with progress bar - PASS
- Latest Job Listings (top 5 open jobs) with company, location, salary, type - PASS
- Application Status Tracker with progress steps - PASS
- "How to Improve Your Application" tips section with checklist - PASS
- Bug: **"Complete Profile" button navigates to `/profile` (line 132) instead of `/jobs/profile`.** This is a bare path that would hit the legacy redirect, eventually sending the user to their portal dashboard instead of the profile page. Same issue for all quick action routes.
- Code reference: `src/components/dashboard/JobSeekerDashboard.jsx:132`
- Bug: **Quick Actions navigate to wrong routes.** "Search Jobs" goes to `/jobs` (line 232) instead of `/jobs/search`. "Upload Resume" goes to `/documents` (line 239) instead of `/jobs/resume`. "View Training" goes to `/training` (line 246) instead of `/jobs/training`. "Update Profile" goes to `/profile` (line 253) instead of `/jobs/profile`.
- Code reference: `src/components/dashboard/JobSeekerDashboard.jsx:232-253`
- Bug: **"View All" jobs link goes to `/jobs` (line 167)** instead of `/jobs/search`. The route `/jobs` doesn't exist as a standalone page and would likely show a 404 or unintended content.
- Code reference: `src/components/dashboard/JobSeekerDashboard.jsx:167`
- Bug: **"Apply" button on job cards navigates to `/jobs/${job.id}` (line 206)** which is not a defined route. No route exists for individual job detail pages at this path.
- Code reference: `src/components/dashboard/JobSeekerDashboard.jsx:206`
- Bug: **Application status tracker uses wrong steps.** Dashboard uses `['submitted', 'under_review', 'accepted']` (line 278) while MyApplications uses `['submitted', 'shortlisted', 'interview', 'offered']` (line 10). These are inconsistent status models.
- Code reference: `src/components/dashboard/JobSeekerDashboard.jsx:278` vs `src/components/jobs/MyApplications.jsx:10`

### 5. Job Search (JobSearch.jsx) - PASS

- Search bar with placeholder "Search by job title, company, or keyword..." - PASS
- Searches across title, description, employerName, category - PASS
- Filters panel toggleable with button - PASS
- Filter options: Category (from JOB_CATEGORIES), Island (from ISLANDS), Employment Type (Full-time, Part-time, Temporary, Contract), Salary Min/Max, Date Posted - PASS
- Grid/list view toggle with visual indicator - PASS
- Sort options: Newest First, Oldest First, Salary High to Low, Salary Low to High - PASS
- Job count display ("X jobs found") - PASS
- Clear filters functionality - PASS
- Empty state with contextual message - PASS
- Belonger Preferred badge on job cards - PASS
- Note: Component receives `onViewJob` and `onApply` as props from JobsPage - renders correctly in both modes.

### 6. Job Detail & Application (JobDetail.jsx, ApplicationForm.jsx) - PASS

**JobDetail.jsx:**
- Full job details: title, employer, belonger preferred badge, status, employment type - PASS
- Key info grid: location, salary, working hours, deadline - PASS
- Meta info: category, posted date, job number, applicant count - PASS
- Full description section - PASS
- Requirements section (conditional) - PASS
- Contact information: person, email (mailto link), phone - PASS
- Apply Now button (hidden for employers, disabled when closed/expired) - PASS
- Back navigation - PASS

**ApplicationForm.jsx:**
- Job summary banner at top - PASS
- Cover letter (required, min 50 characters, character count) - PASS
- Resume upload (required, max 5MB, PDF/DOC, with file preview and remove) - PASS
- Additional documents upload (optional, multiple files) - PASS
- Available start date (required, date picker with min=today) - PASS
- Salary expectation (optional, numeric) - PASS
- Suitability statement (required, min 30 characters, character count) - PASS
- Form validation with inline error messages - PASS
- Success screen with application ID, navigation buttons - PASS

### 7. My Applications (MyApplications.jsx) - PASS

- Shows all submitted applications with job title, employer, applied date - PASS
- Status tracking with 4-step pipeline: Submitted, Shortlisted, Interview, Offered - PASS
- Visual progress bar with numbered steps (green for completed) - PASS
- Filter by status: All, Submitted, Shortlisted, Interview, Offered, Rejected - PASS
- Expandable cards showing cover letter, suitability, available date, salary expectation, resume name - PASS
- Rejected status shows special message instead of progress bar - PASS
- Empty state when no applications - PASS
- Showing X of Y applications count - PASS

### 8. Routing Check (App.jsx) - FAIL

**Route definitions:**
- `/jobs/login` - defined (line 198) - PASS
- `/jobs/register` - defined (line 199) - PASS
- `/jobs/dashboard` - defined (line 202) - PASS
- `/jobs/search` - defined (line 203) - PASS
- `/jobs/applications` - defined (line 203) - WARNING (see below)
- `/jobs/resume` - defined (line 204) - PASS (placeholder)
- `/jobs/training` - defined (line 205) - PASS (placeholder)
- `/jobs/profile` - defined (line 206) - PASS

**Critical routing bugs:**

- Bug: **Login/Register portal prop mismatch.** Line 198-199 pass `portal="jobseeker"` to PortalLogin and PortalRegister, but both components internally use `portalConfig` with key `'jobs'`. The prop value `'jobseeker'` doesn't match any config key, causing fallback to business portal config. **Fix: Change to `portal="jobs"` on lines 198-199, OR add `'jobseeker'` key to both portalConfig objects.**
- Code reference: `src/App.jsx:198-199`

- Bug: **RequirePortalAuth portal guard correctly uses `portal="jobseeker"` (line 200)** and checks `user.portal !== 'jobseeker'`, which is correct. BUT the JobsLayout has its own separate guard (line 36) that checks `user.portal !== 'jobs'` which conflicts.
- Code reference: `src/App.jsx:200` vs `src/components/layout/JobsLayout.jsx:36`

- Bug: **`/jobs/applications` route uses PlaceholderPage (line 203)** instead of the fully implemented `MyApplications` component. The component exists at `src/components/jobs/MyApplications.jsx` and is fully functional, but the route renders a static placeholder page instead.
- Code reference: `src/App.jsx:203`

- The DashboardRouter (line 202) correctly maps `user.portal='jobseeker'` to `JobSeekerDashboard` via `portalDashboards['jobseeker']` - PASS

- The PortalSelector correctly handles redirect: `user.portal === 'jobseeker' ? 'jobs' : user.portal` (line 74) - PASS

---

## Summary of Bugs Found

### CRITICAL (App-breaking)

| # | Bug | File:Line | Impact |
|---|-----|-----------|--------|
| 1 | Portal prop `"jobseeker"` passed to PortalLogin/PortalRegister but internal config uses key `"jobs"` - falls back to Business Portal config | App.jsx:198-199, PortalLogin.jsx:74, PortalRegister.jsx:92 | Login and registration pages show Business Portal branding/fields instead of Job Centre. Registration collects wrong data. |
| 2 | JobsLayout portal guard checks `user.portal !== 'jobs'` but user.portal is `'jobseeker'` | JobsLayout.jsx:36 | All jobseeker users are immediately redirected away from the Jobs layout, making the entire Job Centre inaccessible after login. |
| 3 | Registration handleSubmit checks `portal === 'jobs'` but receives `'jobseeker'` - jobseeker-specific user data (name, skills, education) is never saved | PortalRegister.jsx:215 | Registered jobseeker accounts missing all profile data. |

### HIGH (Broken navigation)

| # | Bug | File:Line | Impact |
|---|-----|-----------|--------|
| 4 | Dashboard Quick Actions use bare routes (`/jobs`, `/documents`, `/training`, `/profile`) instead of portal-prefixed routes (`/jobs/search`, `/jobs/resume`, `/jobs/training`, `/jobs/profile`) | JobSeekerDashboard.jsx:132,167,232,239,246,253 | All quick action buttons navigate to wrong/nonexistent routes. |
| 5 | "Apply" button on dashboard job cards navigates to `/jobs/${job.id}` which is not a defined route | JobSeekerDashboard.jsx:206 | Clicking Apply from dashboard leads to 404. |
| 6 | `/jobs/applications` route renders PlaceholderPage instead of the fully-built MyApplications component | App.jsx:203 | Users see a static "under construction" message instead of their actual applications. |

### MEDIUM (Data inconsistency)

| # | Bug | File:Line | Impact |
|---|-----|-----------|--------|
| 7 | Dashboard application tracker uses status steps `['submitted', 'under_review', 'accepted']` while MyApplications uses `['submitted', 'shortlisted', 'interview', 'offered']` | JobSeekerDashboard.jsx:278 vs MyApplications.jsx:10 | Inconsistent status model between views; progress bars show different pipelines. |

### Recommended Fix Priority

1. Fix portal prop in App.jsx lines 198-199: change `portal="jobseeker"` to `portal="jobs"` for both PortalLogin and PortalRegister. The registration handler already sets `portal: 'jobs'` in the form data which will then need to be reconciled with the routing guards. **Alternatively**, add `'jobseeker'` as a key in both portalConfig objects in PortalLogin.jsx and PortalRegister.jsx, AND update the registration code so `userData.portal` is set to `'jobseeker'` correctly.
2. Fix JobsLayout.jsx line 36: change `user.portal !== 'jobs'` to `user.portal !== 'jobseeker'`.
3. Fix all dashboard navigation paths to use `/jobs/*` prefix.
4. Wire `/jobs/applications` route to use `<MyApplications />` instead of PlaceholderPage.
5. Harmonize application status steps between dashboard and MyApplications.
