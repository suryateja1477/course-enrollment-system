# Course Enrollment System

REST API for managing academic courses and student enrollments.

## Tech Stack

- **Runtime:** Node.js + Express.js
- **Database:** MongoDB Atlas + Mongoose
- **Auth:** Email/password (bcrypt) + JWT (HTTP-only cookie)
- **Validation:** express-validator

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 5000) |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key for signing JWTs |
| `JWT_EXPIRES_IN` | Token expiry (default: 7d) |
| `ADMIN_EMAIL` | Email for the bootstrap admin account |

### 3. Seed the database

```bash
npm run seed
```

This creates:
- **Admin:** admin@example.com / `admin123`
- **Student 1:** student1@example.com / `student123`
- **Student 2:** student2@example.com / `student123`
- **4 sample courses** (various configurations)

### 4. Start the server

```bash
# Development (auto-restart on changes)
npm run dev

# Production
npm start
```

Server runs at `http://localhost:5000`

## API Endpoints

### Authentication

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | `/api/auth/register` | Public | Register (email, password, displayName) |
| POST | `/api/auth/login` | Public | Sign in, receive JWT cookie |
| POST | `/api/auth/logout` | Auth | Clear session |
| GET | `/api/auth/me` | Auth | Current user profile |

### Courses

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/api/courses` | Public | List active courses |
| GET | `/api/courses/:id` | Public | View course details |

### Enrollments

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | `/api/enrollments` | User | Enroll in a course |
| GET | `/api/enrollments/my` | User | Own enrollment history |
| PATCH | `/api/enrollments/:id/drop` | User | Drop an enrollment |

### Admin — Courses

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | `/api/admin/courses` | Admin | Create a course |
| PUT | `/api/admin/courses/:id` | Admin | Update a course |
| PATCH | `/api/admin/courses/:id/deactivate` | Admin | Deactivate a course |

### Admin — Enrollments

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/api/admin/courses/:id/enrollments` | Admin | List course enrollments |

### Admin — Users

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| PATCH | `/api/admin/users/:id/role` | Admin | Change user role |

## Project Structure

```
├── config/
│   └── db.js                  # MongoDB connection
├── controllers/
│   ├── authController.js      # Register, login, logout, me
│   ├── courseController.js     # Public course listing
│   ├── enrollmentController.js # Enroll, drop, history
│   └── admin/
│       ├── courseController.js      # CRUD courses
│       ├── enrollmentController.js  # View enrollments
│       └── userController.js        # Role management
├── middleware/
│   ├── auth.js                # JWT + role verification
│   ├── errorHandler.js        # Centralized error handling
│   └── validate.js            # Request validation
├── models/
│   ├── User.js
│   ├── Course.js
│   └── Enrollment.js
├── routes/
│   ├── auth.js
│   ├── courses.js
│   ├── enrollments.js
│   └── admin/
│       ├── courses.js
│       ├── enrollments.js
│       └── users.js
├── seed/
│   └── seed.js                # Database seeding
├── server.js                  # App entry point
├── .env.example
└── package.json
```

## Business Rules

- Users cannot enroll in the same course twice
- Inactive or full courses reject new enrollments
- Capacity is enforced atomically (concurrent-safe)
- Drop and re-enrollment are admin-controlled per course
- Course capacity cannot be reduced below enrolled count
- Courses with active enrollments cannot be deactivated
- Admin accounts are bootstrapped via `ADMIN_EMAIL` env variable
