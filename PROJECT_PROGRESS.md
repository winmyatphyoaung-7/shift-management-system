# Shift Management System — Project Progress

**Last updated:** 2026-09-16
**Current branch:** `main`
**Latest completed feature commit:** `1866221`
**Current phase:** Milestone 2 completed; Milestone 3 — Schedule Backend next

## 1. Completed milestones

### Milestone 1 — Backend foundation

- Express and TypeScript server configured.
- PostgreSQL database connection established.
- Prisma 7 configured with PostgreSQL adapter.
- Initial Prisma schema created.
- Initial migration created and applied:
  - `20260908124730_init_foundation`
- Prisma Client generated.
- Idempotent seed script created.
- Seed creates one store, one manager, and four shift presets.
- Central Express error handling added.
- Unknown-route and invalid-JSON handlers added.
- Reusable Zod body and URL-parameter validation added.
- Health endpoint implemented:
  - `GET /api/v1/health`

### Milestone 2 — Authentication and authorization

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
- Active membership validation on login and protected requests.
- Initial temporary-password change.
- `requireAuth`, `requirePasswordChanged`, and `requireManager` middleware.
- Correct `401` and `403` behavior.

### Milestone 2 — Member management

Implemented endpoints:

- `GET /api/v1/members`
- `POST /api/v1/members`
- `PATCH /api/v1/members/:id`
- `POST /api/v1/members/:id/reset-password`
- `POST /api/v1/members/:id/deactivate`

Implemented rules:

- Store scope comes from `req.auth.storeId`.
- Client-supplied `storeId`, `role`, and `status` are not trusted.
- Staff accounts are created as `STAFF` and `ACTIVE`.
- Temporary and reset passwords set `mustChangePassword = true`.
- Password hashes never appear in API responses.
- Login ID is a three-digit string and unique within a store.
- Member name, login ID, and color can be partially updated.
- Members are deactivated rather than deleted.
- Inactive members cannot log in.
- The Version 1 manager cannot be deactivated through the member endpoint.
- Manager password reset is rejected; managers must provide the current password through the authentication endpoint.

## 2. Verified behavior

- `npm run build` passes.
- Prisma schema validation and database connection pass.
- Seed script is idempotent.
- Health endpoint returns `200`.
- Unknown routes return `404`.
- Invalid JSON returns `400 INVALID_JSON`.
- Valid login returns an HttpOnly authentication cookie.
- Wrong password returns `401 INVALID_CREDENTIALS`.
- Invalid input returns `400 VALIDATION_ERROR`.
- `/auth/me` requires authentication and returns the current member.
- Logout expires the authentication cookie.
- Password change rejects an incorrect current password.
- Password change rejects the previous password and accepts the new password.
- Missing authentication returns `401 UNAUTHORIZED`.
- A required password change returns `403 PASSWORD_CHANGE_REQUIRED`.
- Staff access to manager routes returns `403 FORBIDDEN`.
- Member listing returns safe fields without `passwordHash`.
- Duplicate store login ID returns `409 LOGIN_ID_ALREADY_EXISTS`.
- Failed nested member creation does not create an orphan User.
- Member partial update preserves fields not included in the request.
- Password reset invalidates the old password and restores `mustChangePassword = true`.
- Deactivation changes status to `INACTIVE` without deleting the record.
- Repeated deactivation returns `409 MEMBER_ALREADY_INACTIVE`.
- Manager deactivation returns `400 MANAGER_DEACTIVATION_NOT_ALLOWED`.

## 3. Current local development data

- Store count: 1
- User count: 3
- Store membership count: 3
- Shift preset count: 4
- Manager `001`: `ACTIVE`, password already changed.
- Demo Staff `002`: `ACTIVE`, currently requires a temporary-password change after reset.
- Deactivation Test Staff `003`: `INACTIVE`.

Passwords, hashes, database URLs, and JWT secrets are not recorded in this file.

## 4. Current implementation status

| Milestone | Status |
|---|---|
| Preparation | Completed |
| Milestone 1 — Backend foundation | Completed |
| Milestone 2 — Authentication | Completed |
| Milestone 2 — Member Management | Completed with one deferred cross-model rule |
| Milestone 3 — Schedule backend | Next |
| Milestone 4 — Schedule frontend | Not started |
| Milestone 5 — Replacement workflow | Not started |
| Milestone 6 — Notifications and dashboards | Not started |
| Milestone 7 — Quality and delivery | Not started |

## 5. Deferred dependency

Before the application is released, member deactivation must also be blocked when the target member has:

- Future shifts.
- Unresolved replacement activity.

Those checks cannot be implemented yet because the Shift and CoverageRequest models belong to later milestones. Add the checks to `deactivateStoreMember()` as soon as those models exist.

## 6. Test-script environment notes

Passwords must not be written into source code or committed. Manual API scripts read passwords from temporary shell environment variables such as:

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

## 7. Next development work

Start Milestone 3 — Schedule Backend:

1. Review and extend the Prisma schema for ScheduleDay, CoverageRequirement, and Shift.
2. Create and apply the next migration.
3. Define date, time, break, and store-timezone utilities.
4. Implement schedule-day and shift validation schemas.
5. Implement Draft shift creation and listing.
6. Add overlap detection and adjacent-shift warnings.
7. Implement date-range publication.
8. Add published-shift edit and cancellation rules.
9. Implement Copy Week and Clear Draft Week.

Important rules:

- Store scope always comes from the authenticated membership.
- Times use 30-minute increments.
- Shifts remain linked to an explicit ScheduleDay.
- Shifts shorter than 6 hours have no break; shifts of 6 hours or more have a 60-minute break.
- Draft data is manager-only.
- Staff can only see Published schedule days.
- Published shifts are cancelled rather than deleted.
- Shift overlap is blocked; adjacent shifts produce a warning.

## 8. Important commits

- `1866221` — `feat: add member deactivation`
- `fc029ee` — `feat: add member editing and password reset`
- `58f8bc3` — `feat: add member listing and staff creation`
- `ddd5131` — `docs: add project progress tracker`
- `c169864` — `feat: add password change and authorization guards`
- `b5401f9` — `feat: implement JWT authentication flow`
- `a7b4485` — `feat: add Express middleware foundation`
- `0049159` — `chore: initialize project foundation`

## 9. Resume point

Begin the Schedule Backend by reviewing the current Prisma schema against `PROJECT_SPEC.md` before changing models or creating a migration.

Before continuing, verify:

```bash
git status
git log -8 --oneline
npm run build
```
