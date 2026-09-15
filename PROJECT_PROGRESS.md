# Shift Management System — Project Progress

**Last updated:** 2026-09-15
**Current branch:** `main`
**Latest completed feature commit:** `c169864`
**Current phase:** Milestone 2 — Authentication completed; Member Management next

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
- Seed creates:
  - One store.
  - One manager account.
  - Four shift presets.
- Central Express error handling added.
- Unknown-route handler added.
- Invalid JSON handling added.
- Reusable Zod request-body validation added.
- Health endpoint implemented:
  - `GET /api/v1/health`

### Milestone 2 — Authentication and authorization foundation

Implemented authentication endpoints:

- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/change-password`

Implemented authentication features:

- Password verification with bcrypt.
- JWT creation and verification.
- JWT stored in an HttpOnly cookie.
- Production-aware cookie settings.
- Login rate limiting.
- Three-digit login ID validation.
- Active membership validation.
- Current database membership is rechecked for protected requests.
- Logout clears the authentication cookie.
- Initial temporary password can be changed.
- Successful password change sets `mustChangePassword` to `false`.

Implemented authorization middleware:

- `requireAuth`
- `requirePasswordChanged`
- `requireManager`

Expected guard order for manager business routes:

```ts
requireAuth,
requirePasswordChanged,
requireManager,
controller