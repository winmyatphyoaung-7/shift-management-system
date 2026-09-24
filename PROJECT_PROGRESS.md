# Shift Management System — Project Progress

**Last updated:** 2026-09-24
**Current branch:** `main`
**Latest completed feature commit:** `9106cf5`
**Current phase:** Core schedule backend completed; frontend implementation next

## 1. Completed milestones

### Milestone 1 — Backend foundation

- Express and TypeScript server configured.
- PostgreSQL database connection established.
- Prisma 7 configured with the PostgreSQL adapter.
- Initial Prisma schema and migrations created.
- Prisma Client generated.
- Idempotent seed script created.
- Seed creates one store, one manager, and four shift presets.
- Central Express error handling added.
- Unknown-route and invalid-JSON handlers added.
- Reusable Zod validation middleware added for request bodies, URL parameters, and queries.
- Health endpoint implemented:
  - `GET /api/v1/health`

### Milestone 2A — Authentication and authorization

Implemented endpoints:

- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/change-password`

Implemented features:

- Password hashing and verification with bcrypt.
- JWT creation and verification.
- JWT stored in an HttpOnly cookie.
- Production-aware cookie settings.
- Login rate limiting.
- Three-digit login ID validation.
- Active membership validation.
- Temporary-password change enforcement.
- `requireAuth`, `requirePasswordChanged`, and `requireManager` middleware.
- Correct `401` and `403` authorization behavior.

### Milestone 2B — Member management

Implemented features:

- Member listing.
- Staff account creation.
- Member name, login ID, and color editing.
- Staff password reset.
- Member deactivation.
- Store-scoped member access.
- Store-scoped login ID uniqueness.
- Password hashes excluded from API responses.
- Inactive members prevented from logging in.
- Manager deactivation and manager password reset rejected.
- Members with future active shifts prevented from being deactivated.

### Milestone 3 — Core schedule backend

Implemented data models:

- `ScheduleDay`
- `CoverageRequirement`
- `Shift`
- Schedule and shift status enums.

Implemented schedule features:

- Date-range schedule listing.
- Store-timezone date and time conversion.
- Thirty-minute time increment validation.
- Automatic break calculation.
- Draft shift creation.
- Multiple-assignee shift creation.
- Draft shift editing and permanent deletion.
- Shift overlap prevention.
- Adjacent-shift warnings.
- Coverage requirement editing.
- Thirty-minute understaffing calculations and warnings.
- Date-range schedule publication.
- Staff access limited to published schedules.
- Published shift editing.
- Published shift cancellation with history retained.
- Weekly schedule preview and copying.
- Draft schedule-range preview and clearing.
- Published ranges protected from draft clearing.

## 2. Verified behavior

- `npm run build` passes.
- Prisma schema validation passes.
- Database migrations apply successfully.
- The seed script is idempotent.
- Authentication and authorization behavior is verified.
- Password-change enforcement is verified.
- Member creation, editing, password reset, and deactivation are verified.
- Duplicate login IDs are rejected.
- Inactive members cannot log in.
- Staff cannot access manager-only routes.
- Draft shifts can be created, edited, and deleted.
- Published shifts can be edited and cancelled without deleting history.
- Overlapping shifts are rejected.
- Adjacent shifts return warnings.
- Coverage shortages are calculated in thirty-minute intervals.
- Staff can only view published schedule days.
- Schedule publishing rejects already-published dates.
- Copy Week preview does not modify the database.
- Copy Week creates Draft schedule days and shifts.
- Copy Week requires an empty target week.
- Clear Draft Range preview does not modify the database.
- Clear Draft Range rejects ranges containing published schedule days.
- Members with future active shifts cannot be deactivated.
- A member can be deactivated after the future shift is removed.

## 3. Current implementation status

| Milestone | Status |
|---|---|
| Preparation | Completed |
| Milestone 1 — Backend foundation | Completed |
| Milestone 2 — Authentication and authorization | Completed |
| Milestone 2 — Member management | Completed |
| Milestone 3 — Core schedule backend | Completed |
| Milestone 4 — Core frontend | Next |
| Milestone 5 — Replacement workflow | Not started |
| Milestone 6 — Notifications and dashboards | Not started |
| Milestone 7 — Quality and delivery | In progress |

## 4. Deferred backend work

Member deactivation must eventually also be blocked when the member has unresolved replacement activity.

This rule will be implemented after the replacement-request models and workflow exist.

Additional backend work still planned:

- Replacement request and candidate-selection workflow.
- Notifications.
- Dashboard summary endpoints if required by the frontend.
- Automated test-suite organization.
- Production deployment configuration and final security review.

## 5. Test-script environment notes

Passwords and secrets must not be written into source code or committed.

Manual API scripts read passwords from temporary shell environment variables such as:

```text
CURRENT_MANAGER_PASSWORD
CURRENT_STAFF_PASSWORD
RESET_STAFF_TEMP_PASSWORD
```

Example Git Bash usage:

```bash
read -s -p "Current manager password: " CURRENT_MANAGER_PASSWORD
export CURRENT_MANAGER_PASSWORD

npx tsx src/scripts/test-members-api.ts

unset CURRENT_MANAGER_PASSWORD
```

## 6. Next development work

Start the Core Frontend milestone:

1. Review and clean the existing Vite React client.
2. Configure API access and environment variables.
3. Implement authentication state and protected routing.
4. Build the login page.
5. Build the required-password-change page.
6. Build the shared application layout and navigation.
7. Build manager member-management screens.
8. Build the manager schedule calendar and editor.
9. Build the staff published-schedule view.
10. Add loading, empty, validation, and error states.

After the Core Frontend is working:

1. Implement the replacement-request backend.
2. Build replacement workflow screens.
3. Implement notifications and dashboard summaries.
4. Add automated tests and deployment configuration.

## 7. Important commits

- `9106cf5` — `feat: block member deactivation with future shifts`
- `1656ee9` — `feat: add draft schedule range clearing`
- `e1a4d4b` — `feat: add weekly schedule copying`
- `c9ff508` — `feat: support published shift editing and cancellation`
- `d8a752d` — `feat: add date-range schedule publishing`
- `f822d07` — `feat: add coverage requirements and staffing warnings`
- `6bb725a` — `feat: add draft shift editing and deletion`
- `1f3f59b` — `feat: add draft shift creation`
- `9ad5bfb` — `feat: add schedule core and listing API`
- `1866221` — `feat: add member deactivation`
- `fc029ee` — `feat: add member editing and password reset`
- `58f8bc3` — `feat: add member listing and staff creation`
- `c169864` — `feat: add password change and authorization guards`
- `b5401f9` — `feat: implement JWT authentication flow`
- `a7b4485` — `feat: add Express middleware foundation`

## 8. Resume point

The next task is to review the existing React client and begin the Core Frontend milestone.

Before continuing, verify:

```bash
git status -sb
npm run build
```
