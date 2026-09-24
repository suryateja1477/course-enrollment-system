# Course Enrollment System — Demo & Presentation Guide

## Part 1: Opening (2–3 minutes)

### What to say

> "I built a REST API for managing academic courses and student enrollments. It handles user registration, course browsing, enrollment with capacity management, and admin course management — all with authentication, authorization, and input validation."

### Key points to mention

- **Tech stack:** Node.js, Express, MongoDB Atlas, Mongoose, JWT, bcrypt
- **Architecture:** MVC pattern (Models → Controllers → Routes), middleware for auth/validation/errors
- **Security:** Passwords hashed with bcrypt, JWT in HTTP-only cookies, role-based access control
- **Data integrity:** Atomic capacity enforcement using MongoDB transactions to prevent race conditions

---

## Part 2: Live Demo with Postman (8–10 minutes)

> [!IMPORTANT]
> Before the demo, make sure: `npm run seed` has been run, server is running with `npm run dev`, and Postman is open with the collection loaded.

### Demo Flow — Follow this exact order:

### Step 1: Health Check
- **GET** `http://localhost:5000/`
- ✅ Show: API is running

### Step 2: Register a new user
- **POST** `http://localhost:5000/api/auth/register`
- Body:
```json
{
  "email": "demo@example.com",
  "password": "demo123",
  "displayName": "Demo Student"
}
```
- ✅ Show: User created with `USER` role, password is NOT in the response
- 💡 **Say:** "Notice the password is never returned — the User model's `toJSON` method strips it automatically."

### Step 3: Show duplicate registration fails
- **POST** same endpoint with the same email
- ✅ Show: 409 error — "An account with this email already exists"
- 💡 **Say:** "Validation catches duplicates before they reach the database."

### Step 4: Login as admin
- **POST** `http://localhost:5000/api/auth/login`
- Body:
```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```
- ✅ Show: Login succeeds, role is `ADMIN`, JWT cookie is set (check Cookies tab in Postman)
- 💡 **Say:** "The admin was bootstrapped via the `ADMIN_EMAIL` environment variable during seeding. No one can self-promote to admin through the API."

### Step 5: Create a course (as admin)
- **POST** `http://localhost:5000/api/admin/courses`
- Body:
```json
{
  "name": "Cloud Computing",
  "description": "Introduction to cloud platforms, serverless, and containerization.",
  "instructor": "Dr. Kumar",
  "capacity": 3,
  "allowDrops": true,
  "allowReEnrollment": false
}
```
- ✅ Show: Course created with `active` status, `enrolledCount: 0`, `availableSeats: 3`
- 💡 **Say:** "I set capacity to 3 so we can demo the 'course full' scenario quickly."

### Step 6: Browse courses (public)
- **POST** `http://localhost:5000/api/auth/logout` (logout admin first)
- **GET** `http://localhost:5000/api/courses`
- ✅ Show: Only active courses appear (the inactive "Machine Learning" course from seed data is excluded)
- 💡 **Say:** "This endpoint is public — no authentication needed. Inactive courses are filtered out."

### Step 7: Login as student and enroll
- **POST** `/api/auth/login` with `student1@example.com` / `student123`
- **POST** `http://localhost:5000/api/enrollments`
- Body:
```json
{
  "courseId": "<paste a course _id from Step 6>"
}
```
- ✅ Show: Enrolled successfully, status is `enrolled`
- 💡 **Say:** "The enrollment uses a MongoDB transaction — it atomically checks capacity and increments `enrolledCount` in one operation, preventing race conditions."

### Step 8: Show duplicate enrollment blocked
- **POST** same enrollment request again
- ✅ Show: 409 error — "You are already enrolled in this course"

### Step 9: Show enrollment history
- **GET** `http://localhost:5000/api/enrollments/my`
- ✅ Show: Lists the student's enrollments with course details

### Step 10: Drop an enrollment
- **PATCH** `http://localhost:5000/api/enrollments/<enrollment_id>/drop`
- ✅ Show: Status changed to `dropped`, `droppedAt` timestamp is set
- 💡 **Say:** "The record is preserved — not deleted — so we maintain full enrollment history. And `enrolledCount` on the course is decremented atomically."

### Step 11: Show drop is blocked on a no-drop course
- Enroll in the "Data Structures" course (which has `allowDrops: false`)
- Try to drop it
- ✅ Show: 403 — "Dropping is not allowed for this course"
- 💡 **Say:** "Drop and re-enrollment policies are admin-configured per course."

### Step 12: Show "course full" scenario
- Login as `student1@example.com`, enroll in the Cloud Computing course (capacity 3)
- Login as `student2@example.com`, enroll in the same course
- Register a 3rd user, enroll → fills the course
- Try enrolling a 4th → ✅ Show: 400 — "This course is full"

### Step 13: Show authorization works
- While logged in as a student, try:
  - **POST** `http://localhost:5000/api/admin/courses` → ✅ Show: 403 "Admin access required"
- While logged out, try:
  - **GET** `http://localhost:5000/api/enrollments/my` → ✅ Show: 401 "Authentication required"

### Step 14: Admin views enrollments
- Login as admin
- **GET** `http://localhost:5000/api/admin/courses/<courseId>/enrollments`
- ✅ Show: All enrollments for that course with user details

### Step 15: Admin deactivation rule
- Try deactivating a course that has active enrollments
- ✅ Show: 400 — "Cannot deactivate: X active enrollment(s) exist"
- 💡 **Say:** "Admins must handle enrollments before deactivating a course."

---

## Part 3: Code Walkthrough (3–5 minutes)

Walk through these files in this order:

### 1. Project structure
Open the file explorer and show the folder layout:
```
config/ → models/ → middleware/ → controllers/ → routes/ → server.js
```
💡 **Say:** "I used the MVC pattern to separate concerns."

### 2. Models — show `models/User.js`
- Highlight the `pre('save')` hook for bcrypt hashing
- Highlight the `toJSON` method that strips the password
- 💡 **Say:** "Password security is built into the model layer — it's impossible to accidentally return a password."

### 3. Middleware — show `middleware/auth.js`
- Highlight `authMiddleware` reading JWT from cookies
- Highlight `adminMiddleware` checking the role
- 💡 **Say:** "Two-layer middleware: first verify identity, then verify permission."

### 4. Enrollment logic — show `controllers/enrollmentController.js`
- Highlight the MongoDB transaction in the `enroll` function
- Highlight the atomic `findOneAndUpdate` with capacity guard
- 💡 **Say:** "This is the most critical part — capacity is checked and incremented atomically inside a transaction, so even if two users enroll at the exact same millisecond, we never exceed capacity."

### 5. Error handling — show `middleware/errorHandler.js`
- 💡 **Say:** "All errors funnel through one handler — Mongoose validation errors, duplicate keys, bad IDs — each maps to the right HTTP status code."

---

## Part 4: Closing (1 minute)

### Summarize the business rules enforced:

1. ✅ No duplicate enrollments
2. ✅ Inactive/full courses reject enrollments  
3. ✅ Atomic capacity management (concurrent-safe)
4. ✅ Admin-controlled drop and re-enrollment policies
5. ✅ Capacity can't go below enrolled count
6. ✅ Courses with active enrollments can't be deactivated
7. ✅ Role-based access — users can't access admin routes
8. ✅ Ownership — users can only see/modify their own enrollments

---

## Anticipated Jury Questions & Answers

| Question | Answer |
|----------|--------|
| "Why JWT in cookies instead of Authorization header?" | "HTTP-only cookies prevent XSS attacks from stealing the token. The browser sends it automatically, and JavaScript can't access it." |
| "How do you handle concurrent enrollment?" | "I use a MongoDB transaction with an atomic `findOneAndUpdate` that has a capacity guard (`enrolledCount < capacity`). If two requests race, only one succeeds." |
| "Why bcrypt?" | "It's a slow hash by design, making brute-force attacks impractical. The salt is built in so each hash is unique." |
| "How is the first admin created?" | "Through the `ADMIN_EMAIL` environment variable — a server-side only config. No one can self-promote through the API." |
| "Why store `enrolledCount` instead of counting each time?" | "Performance — counting enrollment records on every request is slower. We keep it in sync with atomic increments/decrements during enroll/drop." |
| "What if the server crashes between enrollment creation and count update?" | "Both happen inside a MongoDB transaction, so either both succeed or both roll back." |
