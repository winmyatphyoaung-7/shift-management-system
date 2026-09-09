# Shift Management System — Project Specification

**Status:** Version 1 scope frozen  
**Specification date:** 2026-09-07  
**Development approach:** One-person project, built incrementally with working milestones

## 1. Project overview

This project digitizes the paper-based shift schedule used by a 24-hour convenience store.

### Current problems

- Staff can only see the paper schedule while they are at the store.
- When a staff member cannot work, finding a replacement requires long conversations on LINE.
- Managers need a clear way to publish schedules, monitor staff coverage, review replacement requests, and select a replacement.

### Version 1 goals

- Staff can securely view the published schedule from anywhere.
- Managers can create, copy, edit, validate, and publish schedules.
- Staff can request a full-shift replacement early enough for the manager to respond.
- Managers can open urgent replacement requests when staff contact them directly.
- Volunteers and direct-offer recipients can respond inside the app.
- The original assignee remains responsible until the manager gives final approval.
- Relevant users receive in-app notifications when published shifts or replacement requests change.

## 2. Technical stack

### Frontend

- React
- Vite
- TypeScript
- Tailwind CSS
- React Router
- Axios
- TanStack Query

### Backend

- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT stored in an HttpOnly cookie
- bcrypt for password hashing
- Zod for request validation

### Repository structure

```text
shift-management-system/
├── client/                 # React + TypeScript
├── server/                 # Express + TypeScript
├── README.md
└── PROJECT_SPEC.md
```

Frontend and backend live in one GitHub repository.

## 3. Store operation and time rules

- The store operates 24 hours.
- The initial store timezone is `Asia/Tokyo`.
- Absolute shift timestamps are stored consistently and displayed in the store timezone.
- A shift is explicitly linked to a `ScheduleDay`; its displayed day is not inferred only from midnight boundaries.
- Times are selected in 30-minute increments.

### Standard shift presets

| Preset | Normal time |
|---|---|
| Morning | 08:00–13:00 |
| Afternoon | 13:00–17:00 |
| Evening | 17:00–22:00 |
| Night | 22:00–next day 08:00 |

- Presets are stored in the database per store and created by the seed script.
- Version 1 has no preset-management settings screen.
- Selecting a preset only fills the form. Every actual shift stores its own `startAt` and `endAt`.
- Actual shifts may begin earlier, end later, or span multiple standard presets.

### Break and scheduled-hours rules

- Shift duration below 6 hours: `breakMinutes = 0`.
- Shift duration of 6 hours or more: `breakMinutes = 60`.
- The schedule bar remains continuous; break placement is not drawn inside the bar.
- Scheduled working hours are calculated as `(endAt - startAt) - breakMinutes`.
- Weekly totals are scheduling aids, not payroll calculations.
- A week runs Monday through Sunday in the store timezone.
- An overnight shift's full scheduled hours belong to the week containing its starting schedule day.

## 4. Users, stores, memberships, and login

### Account model

- `User` represents one person's app account and password.
- `Store` represents one store.
- `StoreMember` represents a user's membership, role, login ID, color, and active status at a specific store.
- One user may have multiple store memberships in a future version.
- A user may have a different register/login number at each store.

### Login ID

- Login ID is the employee's three-digit personal register number at that store.
- It is stored as a string so values such as `"007"` remain three digits.
- It must match exactly three digits.
- It is unique within a store, not globally: `@@unique([storeId, loginId])`.
- Version 1 has one store, so login requires the three-digit ID and password.
- A future multi-store login may also require a store code and then allow store switching.

### Roles

- `MANAGER`
- `STAFF`

There are no separate Manager and Staff tables. Both are `StoreMember` records distinguished by role. A manager may also be assigned to a shift and counts toward coverage.

### Version 1 account rules

- One manager account only.
- The schema must not hard-code a one-manager limit, so multiple managers can be added later.
- There is no public sign-up.
- The initial manager and the four shift presets are created with an idempotent Prisma seed script.
- The initial manager receives a temporary password and has `mustChangePassword = true`.
- The first login requires a password change.
- The manager creates staff accounts and assigns temporary passwords and colors.
- If a staff member forgets a password, the manager resets it to another temporary password.
- Passwords are never stored as plain text.

### Deactivation

- Members are deactivated, not deleted, so historical schedules remain intact.
- A manager cannot deactivate a membership that still has future shifts or unresolved replacement activity.
- An inactive member cannot receive new shifts, volunteer, or receive direct offers.
- In a future multi-store version, deactivating one membership does not deactivate the user's other store memberships.

## 5. Authentication and authorization

- Successful login creates a JWT and sends it in an HttpOnly cookie.
- The browser sends the cookie automatically with later API requests.
- `requireAuth` validates authentication and attaches the current user/membership to the request.
- `requireManager` authorizes manager-only actions.
- Logout clears the authentication cookie.
- Production cookies use appropriate `HttpOnly`, `Secure`, and `SameSite` settings.
- Login endpoints require rate limiting because login IDs contain only three digits.

Typical protected route:

```ts
router.post("/members", requireAuth, requireManager, createMember);
```

Expected authentication errors:

- `401 Unauthorized`: missing, invalid, or expired authentication.
- `403 Forbidden`: authenticated but lacking the required role or store access.

## 6. Schedule creation and management

### Schedule-day status

- Each store/date has a `ScheduleDay` with status `DRAFT` or `PUBLISHED`.
- A date can be published even when it has no shifts. This confirms that the schedule for the date is complete.
- Staff can only see published schedule days.
- Publishing supports a selected date range rather than requiring an entire month at once.
- Once published, a day cannot return to Draft in Version 1.

### Manager creation workflow

1. Select a date.
2. Select a shift preset.
3. Adjust actual start/end times in 30-minute increments if needed.
4. Select one or more store members, including the manager.
5. Save the new shifts as Draft.

One selected person creates one `Shift` record. Selecting three people creates three separately assigned shifts.

### Publish workflow

- The manager selects a date range to publish.
- Before confirmation, show dates, shift count, and coverage warnings.
- Published shifts become immediately visible to staff.
- Understaffing produces a warning but does not block publication.
- Published dates cannot be unpublished in Version 1.

### Editing a published shift

- Show a confirmation before saving.
- An optional manager note may be included.
- After confirmation, update the shift immediately.
- Notify every directly affected member.
- A time change notifies the current assignee.
- An assignee change notifies both the removed and newly assigned members.
- Cancellation notifies the current assignee.
- A shift with an active replacement request cannot be edited or cancelled until that request is cancelled.
- The UI may offer a combined `Cancel request and edit shift` confirmation flow.

### Deletion and cancellation

- Draft shifts may be permanently deleted.
- Published shifts are never hard-deleted; they become `CANCELLED` and remain in history.
- Cancelled shifts do not count toward coverage or weekly hours.
- A shift becomes read-only when its start time is reached.
- In-progress and past shifts are not corrected in Version 1 because attendance tracking is outside scope.

### Copy Week

- Copy a Monday–Sunday source week to another week.
- The target week must be completely empty.
- Copied shifts receive new IDs and timestamps shifted by seven days.
- Copy assignments, actual start/end times, preset reference, notes as appropriate, and break values.
- Do not copy publication state, notifications, or replacement requests.
- All copied dates and shifts are Draft.
- Skip inactive members and show a warning in the preview.
- Show a preview and require confirmation before copying.

### Clear Draft Week

- The manager may clear a selected Draft date range.
- Show the number of shifts that will be removed and require confirmation.
- If any selected date is Published, block the bulk-clear operation.
- No staff notification is sent because Draft data is not visible to staff.

## 7. Coverage requirements and overlap validation

### Coverage requirements

- Each schedule day has four initial coverage requirements based on the four presets.
- Default required count is 2 for each requirement.
- The manager may change a date/preset requirement to 3, 4, 5, or another valid positive count.
- Coverage is calculated at 30-minute intervals using actual shift timestamps.
- A shift such as 13:00–18:00 contributes to both the Afternoon and Evening periods.
- Understaffed intervals show a warning.
- Overstaffing is allowed.
- Changing only a coverage requirement does not notify staff because it does not change their assignments.

### Overlap rules

- The same member cannot have overlapping active shifts.
- Overlap is blocked when creating or editing shifts, volunteering, sending direct offers, and giving final approval.
- Adjacent shifts are allowed but produce a continuous-shift warning.
- Example: 08:00–13:00 plus 13:00–17:00 is allowed with a warning.
- Conflict validation must run again at final approval because schedules may have changed since the candidate first responded.

## 8. Schedule viewing UI

### Staff visibility

- Staff can see all members' published shifts for their store.
- Draft days and shifts are manager-only.
- The current user's shifts are emphasized but other members remain visible.
- A bar shows color, short display name, and actual start/end time; color is never the only identifier.
- Selecting a bar opens full details.

### Responsive layout

| Device | Default view |
|---|---|
| Desktop | 7 days |
| Tablet | 3 days |
| Mobile | 1 day |

- Mobile navigation supports previous/next, swipe, and a Today button.
- Time labels remain visible while browsing the grid.
- Concurrent staff bars are placed side by side.
- A mobile day column provides enough width for up to about five concurrent bars; abbreviated names and tap details handle narrow bars.

### Dynamic time range

- Default visible range is 08:00 through next-day 08:00.
- If visible shifts start earlier or end later, expand the grid automatically.
- Example: a visible 07:00 start and next-day 09:00 end produce a 07:00–09:00-next-day grid.
- All bars remain linked to their explicit schedule day, and overnight bars remain continuous in that day's column.

### Member colors

- Version 1 provides a curated palette of about 20 theme-aware color keys.
- The manager chooses a member's color; the UI first suggests an unused color.
- Duplicate colors show a warning but are not blocked.
- Color is stored as a semantic `colorKey`, not as styling logic tied permanently to one theme.

## 9. Replacement workflow

Version 1 supports full-shift replacement only. The data model retains `requestedStartAt` and `requestedEndAt` so partial replacement can be added later.

### Responsibility rule

The original assignee remains responsible until the manager gives final approval. Submitting, volunteering, accepting an offer, or being provisionally selected does not change the assignment.

### Staff-created request

- The request must be for the logged-in member's own future Published shift.
- It is allowed only when at least seven full days remain before `startAt`.
- The seven-day cutoff is validated by both frontend and backend.
- Inside seven days, Version 1 blocks staff submission and instructs the staff member to contact the manager directly.
- The request begins as `PENDING_REVIEW`.
- One shift may have only one active replacement request at a time.

### Reason form and privacy

- Required category: `HEALTH`, `SCHOOL`, `PERSONAL`, or `OTHER`.
- Optional details.
- Category and details are visible only to the manager and requester.
- Other staff see the date, time, and that replacement is needed, but not the private reason.

### Manager review

- `Approve & Open`: open the request to eligible staff and set a response deadline.
- `Reject`: reject the request; rejection reason is optional.
- Rejection sends a private notification to the requester.

### Manager-created urgent request

- The manager may create a replacement request for any eligible future shift, including the manager's own shift.
- The manager may bypass the seven-day rule.
- A manager-created request opens directly without a separate review step.
- This supports cases where staff contact the manager directly inside the seven-day cutoff.

### Public volunteer and direct offers

- An Open request can be visible to all active eligible members of the store.
- Staff may volunteer for the full shift.
- A member cannot volunteer for their own assigned shift.
- Overlapping shifts block volunteering.
- The normal operational flow is public volunteering first, followed by direct offers when needed.
- The manager may send direct offers to multiple eligible members simultaneously.
- For urgent manager-created requests, direct offers may be sent immediately.
- Direct-offer recipients independently Accept or Decline.
- Accept means `I am available`; it does not guarantee assignment.
- The manager chooses the final member; the system never assigns automatically to the first responder.

### Shared response deadline

- A coverage request has one shared `responseDeadline` for public volunteers and direct offers.
- The deadline must be before the shift start time.
- After the deadline, new Volunteer/Accept responses are blocked.
- Candidates who responded before the deadline remain selectable.
- The manager may select and approve a candidate before the deadline.
- If no candidate is available, the manager may extend/reopen the request before shift start and send additional offers.
- A request that reaches shift start without final approval becomes unresolved/expired; the original assignee remains responsible.

### Cancellation and withdrawal

- The original requester may cancel before final approval.
- Cancelling notifies the manager and existing candidates.
- Volunteers and accepted direct-offer recipients may withdraw before final approval.
- Withdrawal notifies the manager.
- After final approval, neither the original requester nor selected replacement can undo the transfer directly.
- If the new assignee later cannot work, they must start a new replacement process, subject to the applicable rules.

### Candidate selection UI

For each available candidate, show:

- Name and color.
- Candidate type: Volunteer or Direct Offer Accepted.
- Existing shifts that day.
- Monday–Sunday scheduled working hours.
- Continuous-shift warning.
- Overlap status; an overlapping candidate cannot be selected.

### Final approval transaction

Final approval must run as an atomic database transaction:

1. Recheck that the request is still Open and the shift has not started.
2. Recheck that the selected candidate is still available and active.
3. Recheck shift overlap.
4. Update the shift's current assignee.
5. Mark the request Approved and the selected candidate Selected.
6. Close remaining candidates as Not Selected/Closed.
7. Create notifications for the original assignee, selected replacement, and other affected candidates.

## 10. Notifications

Version 1 uses in-app notifications only.

- Fetch notifications on login and page load.
- Poll for new notifications every 60 seconds while the app is open.
- Show an unread count on the notification bell.
- Support Mark as Read and Mark All as Read.
- Selecting a notification navigates to the related shift, date, or replacement request.
- If the app is closed, the user sees notifications the next time it opens.
- Notification creation should occur in the same database transaction as the business action when consistency matters.

### Main notification events

- Published shift time changed.
- Published shift reassigned.
- Published shift cancelled.
- Replacement request approved/opened, rejected, cancelled, or expired.
- New direct offer.
- Direct offer accepted, declined, or withdrawn.
- Volunteer joined or withdrew.
- Candidate selected or not selected.
- Final replacement approved.
- Deadline extended/reopened.

## 11. Dashboard and pages

### Shared pages

- Login
- Forced first-login password change
- Schedule
- My Schedule/Next Shift
- Open Replacements
- Notifications
- Profile/Change Password

### Staff pages

- Staff Dashboard with next shift and relevant alerts
- My Replacement Requests

### Manager-only pages

- Manager Dashboard
- Schedule Editor
- Replacement Management
- Staff Management

### Manager Dashboard priorities

- Today's assigned members.
- Pending replacement requests awaiting review.
- Open requests near or beyond their response deadline.
- Accepted direct offers awaiting final action.
- Upcoming understaffed intervals.
- Draft dates not yet published.
- Unread notifications.

The manager uses the same login and can also access staff-facing schedule features because the manager may work shifts.

## 12. API organization

All routes use a versioned REST prefix:

```text
/api/v1/auth
/api/v1/members
/api/v1/schedule-days
/api/v1/shifts
/api/v1/coverage-requirements
/api/v1/coverage-requests
/api/v1/notifications
/api/v1/dashboard
```

Version 1 infers the active store from the authenticated membership instead of trusting an arbitrary client-supplied `storeId`.

### Representative endpoints

#### Authentication

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `PATCH /api/v1/auth/change-password`

#### Members

- `GET /api/v1/members`
- `POST /api/v1/members`
- `PATCH /api/v1/members/:id`
- `POST /api/v1/members/:id/reset-password`
- `POST /api/v1/members/:id/deactivate`

#### Schedule and shifts

- `GET /api/v1/schedule-days?from=...&to=...`
- `POST /api/v1/shifts`
- `PATCH /api/v1/shifts/:id`
- `DELETE /api/v1/shifts/:id`
- `POST /api/v1/schedule-days/publish`
- `POST /api/v1/schedule-days/copy-week`
- `DELETE /api/v1/schedule-days/draft-range`
- `PATCH /api/v1/coverage-requirements/:id`

#### Coverage requests

- Create a request for a shift.
- List public Open requests.
- List the current user's requests and candidacies.
- Manager list/filter requests.
- Approve and Open, Reject, Cancel, Volunteer, Withdraw.
- Send multiple Direct Offers.
- Accept or Decline a Direct Offer.
- Final Approve a selected candidate.

Exact route names and DTOs may be refined during implementation without changing the business rules in this specification.

#### Notifications and dashboard

- `GET /api/v1/notifications`
- `PATCH /api/v1/notifications/:id/read`
- `PATCH /api/v1/notifications/read-all`
- `GET /api/v1/dashboard/staff`
- `GET /api/v1/dashboard/manager`

### Main HTTP status codes

- `200 OK`: successful read/update/action.
- `201 Created`: resource created.
- `204 No Content`: successful action with no response body when appropriate.
- `400 Bad Request`: malformed or invalid input.
- `401 Unauthorized`: authentication required or invalid.
- `403 Forbidden`: authenticated but not permitted.
- `404 Not Found`: resource absent in the authorized store scope.
- `409 Conflict`: overlap, duplicate active request, stale state, already finalized action, or another business-state conflict.
- `500 Internal Server Error`: unexpected server failure.

## 13. Draft data model

This is the target relationship structure. Exact Prisma relation names may be refined while implementing.

### `Store`

- `id`
- `code`
- `name`
- `timeZone`
- timestamps
- relations: memberships, presets, schedule days, notifications

### `User`

- `id`
- `name`
- `passwordHash`
- `mustChangePassword`
- timestamps
- relations: store memberships and received notifications

### `StoreMember`

- `id`
- `storeId`
- `userId`
- `loginId`
- `role`
- `status`
- `colorKey`
- timestamps
- unique `(storeId, loginId)`
- unique `(storeId, userId)` for Version 1 membership semantics

### `ShiftPreset`

- `id`
- `storeId`
- `name`
- `startMinute`
- `endMinute`
- `crossesMidnight`
- `defaultRequiredCount`
- `sortOrder`
- `isActive`
- timestamps

### `ScheduleDay`

- `id`
- `storeId`
- `scheduleDate`
- `status`
- `publishedAt`
- `publishedByMembershipId`
- timestamps
- unique `(storeId, scheduleDate)`

### `CoverageRequirement`

- `id`
- `scheduleDayId`
- `shiftPresetId`
- actual requirement start/end timestamps
- `requiredCount`
- timestamps

### `Shift`

- `id`
- `scheduleDayId`
- `assigneeMembershipId`
- optional `shiftPresetId`
- `startAt`
- `endAt`
- `breakMinutes`
- `status` (`ACTIVE` or `CANCELLED`)
- optional `note`
- `createdByMembershipId`
- `updatedByMembershipId`
- `cancelledByMembershipId`
- `cancelledAt`
- timestamps

### `CoverageRequest`

- `id`
- `shiftId`
- `originalAssigneeMembershipId`
- `requesterMembershipId`
- `createdByMembershipId`
- `source` (`STAFF` or `MANAGER`)
- `reasonCategory`
- optional private `reasonDetails`
- `requestedStartAt`
- `requestedEndAt`
- `status`
- `responseDeadline`
- optional `rejectionNote`
- optional `selectedCandidateId`
- optional `approvedByMembershipId`
- timestamps

### `CoverageCandidate`

- `id`
- `coverageRequestId`
- `membershipId`
- `type` (`VOLUNTEER` or `DIRECT_OFFER`)
- `status`
- `respondedAt`
- timestamps
- unique `(coverageRequestId, membershipId)`

### `Notification`

- `id`
- `recipientUserId`
- optional `storeId`
- `type`
- `title`
- `message`
- optional structured navigation/reference data
- `readAt`
- `createdAt`

### Suggested enums

- `Role`: `MANAGER`, `STAFF`
- `MemberStatus`: `ACTIVE`, `INACTIVE`
- `ScheduleDayStatus`: `DRAFT`, `PUBLISHED`
- `ShiftStatus`: `ACTIVE`, `CANCELLED`
- `CoverageRequestSource`: `STAFF`, `MANAGER`
- `CoverageRequestStatus`: `PENDING_REVIEW`, `OPEN`, `APPROVED`, `REJECTED`, `CANCELLED`, `EXPIRED`
- `CoverageCandidateType`: `VOLUNTEER`, `DIRECT_OFFER`
- `CoverageCandidateStatus`: `PENDING`, `AVAILABLE`, `DECLINED`, `WITHDRAWN`, `SELECTED`, `NOT_SELECTED`, `EXPIRED`
- `ReasonCategory`: `HEALTH`, `SCHOOL`, `PERSONAL`, `OTHER`
- `NotificationType`: refined during implementation from the events in section 10

## 14. Version 1 scope

### Included

- Single store and one manager account.
- Authentication, authorization, password change/reset, and member management.
- Responsive published schedule viewing for all active store members.
- Manager schedule creation with presets and custom times.
- Draft, date-range Publish, Copy Week, and Clear Draft Week.
- Coverage requirements and staffing warnings.
- Full-shift replacement requests.
- Staff seven-day request rule and manager-created urgent requests.
- Public volunteers, multiple direct offers, deadlines, withdrawals, manager selection, and final approval.
- In-app notification polling.
- Cancelled-shift and replacement history retained in the database.

### Explicitly deferred to Version 2

- Partial-shift replacement UI and processing.
- Staff-submitted emergency reports inside seven days.
- Multiple manager accounts and manager-management UI.
- Multi-store UI, store switching, and cross-store replacement discovery.
- Email, LINE, browser, or native push notifications.
- WebSocket/SSE real-time updates.
- Drag-and-drop or resize-based schedule editing.
- Attendance, clock-in/out, payroll, and actual-time corrections.
- Staff desired-shift and availability requests.
- Full generic audit-log/history screen.
- Shift-preset settings UI.
- Unpublishing a Published schedule day.
- Editing in-progress or past shifts.

## 15. Implementation order

### Preparation

1. Learn the TypeScript essentials needed for Express and React.
2. Create one repository with `client` and `server`.
3. Configure environment files and `.gitignore` safely.

### Milestone 1 — Backend foundation

1. Express + TypeScript server.
2. PostgreSQL connection and Prisma setup.
3. Initial schema, migration, and seed for Store, Manager, and presets.
4. Central error handling and Zod validation pattern.

### Milestone 2 — Authentication and members

1. Login, JWT cookie, logout, and `/auth/me`.
2. `requireAuth` and `requireManager` middleware.
3. Forced first-login password change.
4. Staff create/list/edit/reset/deactivate.

### Milestone 3 — Schedule backend

1. Schedule days, presets, coverage requirements, and shifts.
2. Overlap and time validation.
3. Draft create/edit/delete.
4. Date-range Publish.
5. Published edit/cancel rules.
6. Copy Week and Clear Draft Week.

### Milestone 4 — Schedule frontend

1. Login and role-aware navigation.
2. Manager schedule editor.
3. Staff schedule viewer.
4. Responsive 7-day, 3-day, and 1-day layouts.
5. Dynamic time range and overlapping bar lanes.

At this point, the application already solves the primary paper-schedule visibility problem and is a usable demonstration milestone.

### Milestone 5 — Replacement workflow

1. Staff request and seven-day validation.
2. Manager review and manager-created urgent request.
3. Public volunteering.
4. Multiple direct offers and responses.
5. Candidate comparison and weekly hours.
6. Atomic final approval and reassignment.
7. Cancellation, withdrawal, expiry, and conflict handling.

### Milestone 6 — Notifications and dashboards

1. Notification creation for all agreed events.
2. Bell, unread count, read actions, and 60-second polling.
3. Staff and Manager dashboards.

### Milestone 7 — Quality and delivery

1. Backend integration tests for critical rules.
2. Frontend responsive and accessibility checks.
3. Security review and production environment settings.
4. Deployment.
5. Japanese README, screenshots, demo data, and portfolio explanation.

## 16. Critical test scenarios

- Login ID `007` remains a three-character string.
- Staff cannot access manager endpoints.
- Inactive members cannot log in or receive new assignments.
- A member with future shifts cannot be deactivated.
- Night shifts store and display correct next-day end timestamps.
- Shift overlap is blocked; adjacent shifts only warn.
- Understaffing warns but does not block Publish.
- Staff cannot view Draft dates.
- Published dates cannot return to Draft.
- Published shift edit/cancel creates the correct notifications.
- Active replacement request blocks shift edit/cancel until request cancellation.
- Staff request is blocked when fewer than seven full days remain.
- Manager urgent request may bypass the staff cutoff.
- Private reason details never appear in public replacement responses.
- Multiple direct offers can exist simultaneously.
- Accepting an offer does not reassign the shift.
- Candidates can withdraw before final approval.
- Manager can approve before the response deadline.
- Final approval rechecks overlap and uses one atomic transaction.
- Only one final replacement wins under duplicate requests/double-clicks.
- Original assignee remains responsible until final approval.
- Copy Week refuses a non-empty target week.
- Copy Week does not copy publication or replacement data.
- Clear Draft Week refuses any range containing Published dates.
- Shift becomes read-only at its start time.

## 17. Decisions still open for implementation time

These do not change the frozen business scope and can be selected while coding:

- Product name and visual branding.
- Primary UI language and whether localization is added later.
- Exact JWT/session lifetime.
- Exact PostgreSQL hosting and application deployment providers.
- Exact REST action route names and request/response DTO shapes.
- Exact notification retention and pagination limit.
- Exact test framework configuration and CI provider.

