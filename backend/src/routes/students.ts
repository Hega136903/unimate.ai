import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { getStudentData, getStudentSchedule, getStudentCourses, updateStudentProfile } from '../controllers/studentController';

const router = express.Router();

// @route   GET /api/students
// @desc    Get student data
// @access  Private
router.get('/', authenticateToken, getStudentData);

// @route   GET /api/students/schedule
// @desc    Get student schedule
// @access  Private
router.get('/schedule', authenticateToken, getStudentSchedule);

// @route   GET /api/students/courses
// @desc    Get student courses
// @access  Private
router.get('/courses', authenticateToken, getStudentCourses);

export default router;
