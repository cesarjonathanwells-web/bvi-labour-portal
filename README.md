# BVI Labour Portal

Official digital portal for the **British Virgin Islands Department of Labour and Workforce Development** (DLWD). A single point of entry for employers, work permit holders, job seekers, and department staff.

> ⚠️ **Status:** Front-end prototype / demo. Data is persisted in the browser's `localStorage` only — no backend. See [Roadmap](#roadmap) for the Phase 2 production architecture.

## Portals

| Portal | Path | Users |
|---|---|---|
| Business | `/business` | Employers applying for and renewing work permits |
| Worker | `/worker` | Permit holders tracking status and viewing digital ID cards |
| Job Centre | `/jobs` | Virgin Islanders and Belongers searching for work |
| Department Console | `/dept` | DLWD staff — permit review, disputes, inspections, payments, reports |

## Department roles & permissions

The Department Console supports eight staff roles with a permission matrix defined in `src/data/constants.js`:

- Labour Commissioner (full access)
- Deputy Commissioner
- Work Permit Officer
- Dispute Officer
- Job Placement Officer
- Labour Inspector
- Cashier
- Front Desk

## Tech stack

- **Framework:** React 19 + React Router 6
- **Build:** Vite 8
- **Styling:** Tailwind CSS 4
- **PDF:** jsPDF + html2canvas (for digital ID cards)
- **Deploy:** Docker + nginx on Railway

## Getting started

```bash
npm install
npm run dev        # start the Vite dev server on :5173
npm run build      # production build to /dist
npm run preview    # serve the production build locally
npm run lint       # run ESLint
```

## Project structure

```
src/
├── App.jsx                    # Router + portal guards
├── context/                   # AuthContext + AppContext (localStorage-backed)
├── pages/                     # Top-level routed pages
├── components/
│   ├── auth/                  # Login, register, profile
│   ├── dashboard/             # Per-portal dashboards
│   ├── layout/                # Portal shells + nav
│   ├── admin/                 # Dept: PermitReview, UserManagement, Reports, Settings
│   ├── dept/                  # Dept: PaymentProcessing, AppointmentManager, InspectionManager
│   ├── work-permits/          # Permit forms + cards
│   ├── disputes/              # Dispute filing + tracking
│   ├── jobs/                  # Job search, posting, applications
│   ├── documents/             # Document manager + upload
│   ├── fees/                  # Fee calculator + payment forms
│   └── id-cards/              # Digital work permit ID card renderer
├── data/
│   ├── constants.js           # Roles, permissions, fee tiers, department info
│   └── seedData.js            # Demo data (dev only)
└── utils/                     # Helpers, fee calculator
```

## Demo credentials

Demo accounts are seeded automatically on first load. In production builds the credentials panel is hidden — see `src/context/AuthContext.jsx` for the full list. Dev-only banner at `/dept/login` only renders when `import.meta.env.DEV` is true.

## Roadmap

**Phase 2 — Production backend**
- Replace `localStorage` with Postgres (via Railway)
- Real authentication with hashed passwords and session tokens
- Server-side permission enforcement + audit logging
- File uploads to object storage (S3 / Cloudflare R2)
- Email / SMS notifications via a provider (SendGrid, Twilio)
- Integrations: IRD, SSB, NHI clearance certificates; Trade Licence verification

**Phase 3 — Analytics & reporting**
- Labour-market dashboards
- Public-facing job statistics
- Automated compliance reporting

## Deployment

The Railway production deployment is configured via `Dockerfile` and `nginx.conf`. Railway builds the Vite output and serves it through nginx.

## License

Proprietary — Government of the Virgin Islands, Department of Labour and Workforce Development.
