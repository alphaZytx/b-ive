# B+ive

B+ive is a consent-first blood-credit exchange network that synchronizes donors, recipients, hospitals, administrators, and government authorities. Credits earned by donating blood can be redeemed later by the donor or transferred—with explicit consent—to beneficiaries anywhere in the network.

This repository now contains the initial Next.js/Tailwind application scaffold backed by MongoDB. Subsequent phases will layer in authentication, the credit ledger, consent workflows, emergency overrides, and observability per the architecture playbook.

## Getting started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create environment file**

   Copy `.env.example` to `.env.local` and keep the provided `MONGODB_URI` (or replace with your own cluster). If your Atlas project uses a different logical database name, set `MONGODB_DB_NAME` (defaults to `bive`). Set `NEXTAUTH_SECRET` once authentication is introduced.
   The prototype dashboards expect demo identifiers—adjust `DEMO_DONOR_ID` and `DEMO_ORGANIZATION_ID` if you seed different data.

3. **Load sample data (optional but recommended)**

   ```bash
   npm run seed
   ```

   The script populates MongoDB with a donor, beneficiaries, organizations, inventory snapshots, consent requests, and an outstanding emergency override so the dashboards render realistic metrics.

4. **Run the development server**

   ```bash
   npm run dev
   ```

   Visit [http://localhost:3000](http://localhost:3000) to explore the landing page, roadmap overview, and documentation portal.

5. **Sign in to the workspace**

   Open [http://localhost:3000/auth/login](http://localhost:3000/auth/login) and use one of the seeded demo accounts (default password `ChangeMe123!`):

   | Role | Email |
   | --- | --- |
   | Admin | `admin@bive.demo` |
   | Government | `gov@bive.demo` |
   | Organization | `org@bive.demo` |
   | Donor | `ritu.sharma@example.com` |

   Once authenticated you can access `/workspace` and the action consoles. API routes also require a valid session.

6. **Health check API**

   The `/api/health` endpoint attempts a lightweight connection to MongoDB and returns the list of collections to verify connectivity.

## API prototypes

Early domain endpoints now cover the core Phase 2 ledger scenarios. They expect authenticated callers (not yet wired) to provide IDs that correspond to documents in MongoDB.

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/donations` | `POST` | Record a donation event, incrementing donor credits and organizational inventory. |
| `/api/consents` | `POST` | Create a consent request for a beneficiary to spend another user’s credits. |
| `/api/consents/:requestId/decision` | `POST` | Approve or decline a consent request; approvals debit credits and log fulfillment transactions. |
| `/api/emergency-overrides` | `POST` | Apply a single outstanding emergency override within the configured debt ceiling. |
| `/api/ledger/:userId` | `GET` | Retrieve a user’s credit summary and recent transactions. |
| `/api/inventory/:organizationId` | `GET` | View real-time credit holdings by blood type for an organization. |
| `/api/exchanges` | `POST` | Log inter-organization `(bloodType, credit)` exchange proposals. |

## Workspace prototypes

- `/workspace` highlights the role-based dashboards planned for Phase 2.
- `/workspace/admin` surfaces compliance metrics and emergency oversight tasks.
- `/workspace/government` aggregates nationwide coverage, risk alerts, and inter-organization exchange activity.
- `/workspace/organization` previews inventory tracking and exchange guidance.
- `/workspace/donor` shows donor credit history, consent prompts, and emergency debt visibility.
- `/workspace/actions` provides transaction forms to exercise the donation, consent, emergency, and exchange APIs.

Seeded MongoDB data now powers these views. If collections are empty, the UI falls back to friendly prompts explaining how to populate the database.

## Documentation

- [Architecture Overview](docs/architecture.md)

## Tech stack

- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS
- **UI primitives**: Custom iconography (Headless UI planned for interactive components)
- **Content**: `react-markdown` renders the architecture document inside the app
- **Database**: MongoDB Atlas (connection utility in `lib/db/mongodb.ts`)

## Roadmap alignment

The landing page highlights the phased delivery plan. With the Phase 1 discovery outputs committed, the codebase now includes the foundational Phase 2 API layer described above. Upcoming work will harden authentication, surface these capabilities through role-aware dashboards, and expand auditing/observability tooling.
