const express = require('express');
const { listCourses, getCourse } = require('../controllers/courseController');

const router = express.Router();

// GET /api/courses — List all active courses (public)
router.get('/', listCourses);

// GET /api/courses/:id — View a single course (public)
router.get('/:id', getCourse);

module.exports = router;
