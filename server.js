const express = require('express');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

// Route imports
const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const enrollmentRoutes = require('./routes/enrollments');
const adminCourseRoutes = require('./routes/admin/courses');
const adminEnrollmentRoutes = require('./routes/admin/enrollments');
const adminUserRoutes = require('./routes/admin/users');

const app = express();

// --------------- Middleware ---------------
app.use(express.json());
app.use(cookieParser());

// --------------- Routes ---------------
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/admin/courses', adminCourseRoutes);
app.use('/api/admin', adminEnrollmentRoutes);
app.use('/api/admin/users', adminUserRoutes);

// Health check
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Course Enrollment System API is running.' });
});

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found.` });
});

// Centralized error handler (must be last)
app.use(errorHandler);

// --------------- Start Server ---------------
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API base URL: http://localhost:${PORT}`);
  });
};

startServer();

module.exports = app;
