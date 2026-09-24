const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Course = require('../models/Course');

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Course.deleteMany({});
    const Enrollment = require('../models/Enrollment');
    await Enrollment.deleteMany({});
    console.log('Cleared existing data.');

    // ---------- Create Users ----------
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase();

    const admin = await User.create({
      email: adminEmail,
      password: 'admin123',
      displayName: 'Admin User',
      role: 'ADMIN',
    });

    const student1 = await User.create({
      email: 'student1@example.com',
      password: 'student123',
      displayName: 'Alice Johnson',
      role: 'USER',
    });

    const student2 = await User.create({
      email: 'student2@example.com',
      password: 'student123',
      displayName: 'Bob Smith',
      role: 'USER',
    });

    console.log('Created users:');
    console.log(`  ADMIN  → ${admin.email} / password: admin123`);
    console.log(`  USER   → ${student1.email} / password: student123`);
    console.log(`  USER   → ${student2.email} / password: student123`);

    // ---------- Create Courses ----------
    const courses = await Course.insertMany([
      {
        name: 'Introduction to Computer Science',
        description: 'Learn the fundamentals of programming, algorithms, and data structures.',
        instructor: 'Dr. Sarah Chen',
        capacity: 30,
        status: 'active',
        allowDrops: true,
        allowReEnrollment: false,
      },
      {
        name: 'Web Development Bootcamp',
        description: 'Full-stack web development with HTML, CSS, JavaScript, Node.js, and MongoDB.',
        instructor: 'Prof. James Wilson',
        capacity: 25,
        status: 'active',
        allowDrops: true,
        allowReEnrollment: true,
      },
      {
        name: 'Data Structures and Algorithms',
        description: 'Advanced study of data structures, algorithm design, and complexity analysis.',
        instructor: 'Dr. Maria Garcia',
        capacity: 2,
        status: 'active',
        allowDrops: false,
        allowReEnrollment: false,
      },
      {
        name: 'Machine Learning Fundamentals',
        description: 'Introduction to supervised and unsupervised learning, neural networks, and model evaluation.',
        instructor: 'Dr. Raj Patel',
        capacity: 20,
        status: 'inactive',
        allowDrops: true,
        allowReEnrollment: true,
      },
    ]);

    console.log(`\nCreated ${courses.length} courses:`);
    courses.forEach((c) => {
      console.log(`  [${c.status.toUpperCase()}] ${c.name} — capacity: ${c.capacity}, drops: ${c.allowDrops}, re-enroll: ${c.allowReEnrollment}`);
    });

    console.log('\n--- Seed complete ---');
    console.log('\nTest credentials:');
    console.log('  Admin login  → email: admin@example.com, password: admin123');
    console.log('  Student login → email: student1@example.com, password: student123');
    console.log('  Student login → email: student2@example.com, password: student123');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error.message);
    process.exit(1);
  }
};

seedData();
