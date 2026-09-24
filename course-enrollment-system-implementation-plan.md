# Course Enrollment System — Implementation Plan

**Status:** Planning document; all decisions finalized, ready for implementation on approval.  
**Prepared:** 24 September 2026

## 1. Problem statement

Build a secure REST API for managing academic courses and student enrollments. The backend is the current deliverable; a frontend is not in scope.

## 2. Objective

Design and implement a backend that covers course management, enrollment, capacity enforcement, and role-based access — applying authentication, authorization, validation, and meaningful HTTP status codes throughout.

## 3. Technology stack

- **Runtime:** Node.js (v18+ LTS) with Express.js
- **Database:** MongoDB Atlas (free M0 cluster) with Mongoose ODM
- **Authentication:** Email/password registration with bcrypt password hashing
- **Session:** JWT issued by the backend, stored in an HTTP-only cookie
- **Authorization:** Role-based access control — `USER` and `ADMIN` roles
- **Validation:** Request body/param validation (express-validator or Joi)
- **Error handling:** Centralized error-handling middleware with meaningful HTTP status codes
- **Testing tool:** Postman collection covering success and failure scenarios

## 4. Roles and permissions

### USER

- Register and sign in with email/password
- Browse active courses and view seat availability
- Enroll in a course (subject to capacity, status, and eligibility rules)
- View own enrollments and enrollment history (including dropped records)
- Drop an enrollment only when the course's admin-configured `allowDrops` setting permits it
- Re-enroll after dropping only when the course's admin-configured `allowReEnrollment` setting permits it

### ADMIN

- Sign in (after the system has authorized the account for the `ADMIN` role)
- Create, update, and deactivate courses
- View enrollments across courses
- Cannot force-drop students — admin enrollment access is read-only

A user can only access their own enrollment records. Admin operations require an authenticated `ADMIN` role.

## 5. Business rules

1. A course contains: **name**, **description**, **instructor**, **capacity**, **status** (`active` / `inactive`), **allowDrops**, and **allowReEnrollment**.
2. A user **cannot enroll in the same course twice** (unique constraint on user + course for active enrollments).
3. **Inactive courses** do not accept new enrollments.
4. **Full courses** (enrolledCount ≥ capacity) do not accept new enrollments.
5. Only admins can create, update, or deactivate courses.
6. **Capacity tracking:** An `enrolledCount` field is stored on the Course document and updated atomically on enroll/drop to prevent oversubscription under concurrent requests.
7. **Dropping:** A user can drop an enrollment only if the course has `allowDrops: true`. The enrollment record is preserved with status changed to `dropped` (not deleted) to maintain full history.
8. **Re-enrollment:** After dropping, a user can re-enroll only if the course has `allowReEnrollment: true`. If allowed, a new enrollment record is created (the old `dropped` record remains for history).
9. **Capacity reduction:** An admin cannot reduce a course's capacity below its current `enrolledCount`. The API must reject the update with a clear error.
10. **Deactivation:** An admin cannot deactivate a course that still has active (non-dropped) enrollments. The admin must handle existing enrollments before deactivating.

## 6. Authentication and authorization

### Registration and sign-in

1. A person registers with email, password, and display name.
2. The password is hashed with bcrypt before storage.
3. On sign-in, the backend verifies the email/password, then issues a JWT in an HTTP-only cookie.
4. Subsequent requests pass through token-verification middleware.

### Admin designation

- **Bootstrap admin:** A trusted operator sets the initial admin email through the `ADMIN_EMAIL` environment variable. When that person registers or signs in, the backend assigns the `ADMIN` role instead of the default `USER` role.
- **Subsequent admins:** An existing admin promotes a user to `ADMIN` through the protected `PATCH /api/admin/users/:id/role` endpoint.
- A user **cannot** choose or escalate their own role through registration or sign-in.

### Middleware

- **authMiddleware** — verifies the JWT on every protected route; returns 401 if missing/invalid.
- **adminMiddleware** — runs after authMiddleware; checks `role === 'ADMIN'`; returns 403 if not admin.

## 7. Data model

### User

| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | Auto-generated |
| `email` | String | Unique, required, lowercase |
| `password` | String | Bcrypt hash, required, never returned in API responses |
| `displayName` | String | Required |
| `role` | String | `USER` (default) or `ADMIN` |
| `createdAt` | Date | Auto timestamp |
| `updatedAt` | Date | Auto timestamp |

### Course

| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | Auto-generated |
| `name` | String | Required |
| `description` | String | Required |
| `instructor` | String | Required |
| `capacity` | Number | Required, min 1 |
| `enrolledCount` | Number | Default 0, updated atomically on enroll/drop |
| `status` | String | `active` (default) or `inactive` |
| `allowDrops` | Boolean | Default `true` |
| `allowReEnrollment` | Boolean | Default `false` |
| `createdAt` | Date | Auto timestamp |
| `updatedAt` | Date | Auto timestamp |

### Enrollment

| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | Auto-generated |
| `user` | ObjectId | Ref → User, required |
| `course` | ObjectId | Ref → Course, required |
| `status` | String | `enrolled` or `dropped` |
| `enrolledAt` | Date | Set on creation |
| `droppedAt` | Date | Set when status changes to `dropped` |

**Index:** Compound unique index on `{ user, course, status: 'enrolled' }` to prevent duplicate active enrollments while allowing historical dropped records.

## 8. API routes

### Authentication

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | `/api/auth/register` | Public | Register with email, password, displayName |
| POST | `/api/auth/login` | Public | Sign in, receive JWT cookie |
| POST | `/api/auth/logout` | Authenticated | Clear JWT cookie |
| GET | `/api/auth/me` | Authenticated | Return current user profile (excludes password) |

### Courses (public / user)

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/api/courses` | Public | List active courses with availability info |
| GET | `/api/courses/:id` | Public | View a single course's details |

### Enrollments (user)

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | `/api/enrollments` | User | Enroll in a course (`{ courseId }`) |
| GET | `/api/enrollments/my` | User | List own enrollments (enrolled + dropped history) |
| PATCH | `/api/enrollments/:id/drop` | User | Drop an enrollment (if course allows drops) |

### Admin — courses

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | `/api/admin/courses` | Admin | Create a new course |
| PUT | `/api/admin/courses/:id` | Admin | Update course details (capacity reduction validated) |
| PATCH | `/api/admin/courses/:id/deactivate` | Admin | Deactivate (blocked if active enrollments exist) |

### Admin — enrollments (read-only)

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/api/admin/courses/:id/enrollments` | Admin | List all enrollments for a course |

### Admin — users

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| PATCH | `/api/admin/users/:id/role` | Admin | Promote or demote a user's role |

## 9. Security and correctness

- Hash passwords with bcrypt; never store or return plaintext passwords.
- Store JWTs in HTTP-only, secure-in-production cookies with appropriate SameSite and expiry settings.
- Use `authMiddleware` on all protected routes and `adminMiddleware` on all admin routes.
- Validate all request bodies, query parameters, and path parameters.
- Enforce user-ownership: a user can only read/modify their own enrollments.
- Enforce capacity and duplicate-enrollment rules atomically at the database level.
- Capacity reduction blocked when new value < `enrolledCount`.
- Course deactivation blocked when active enrollments exist.
- Centralize error handling; never leak stack traces or secrets in production responses.
- Store secrets (`MONGODB_URI`, `JWT_SECRET`, `ADMIN_EMAIL`, `PORT`) in `.env` only; commit a `.env.example` with placeholder values.

## 10. Environment variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | Atlas connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Secret for signing JWTs | (random string) |
| `JWT_EXPIRES_IN` | Token expiry duration | `7d` |
| `ADMIN_EMAIL` | Bootstrap admin email | `admin@example.com` |

## 11. Expected deliverables

1. Working backend application
2. GitHub repository with source code and README (setup instructions, environment variables, API overview, demo flow)
3. Postman collection covering success and failure scenarios (auth, capacity, duplicate enrollment, drop rules, admin operations)
4. Seed data and test credentials for a USER and a bootstrap ADMIN
5. Short technical demonstration

## 12. Approval boundary

This document records the finalized plan. All design decisions have been resolved. Implementation should begin only after explicit approval.
