import { Router } from 'express';
import { body } from 'express-validator';
import { courseController } from '../controllers/courseController.js';
import { authenticateToken, authorizeRoles, professorOnly } from '../middleware/auth.js';

export const coursesRouter = Router();

// Get all courses
coursesRouter.get('/',
  authenticateToken,
  courseController.getAll
);

// Get single course
coursesRouter.get('/:id',
  authenticateToken,
  courseController.getOne
);

// Create new course (admin only)
coursesRouter.post('/',
  authenticateToken,
  authorizeRoles('admin'),
  [
    body('code').notEmpty().trim(),
    body('title').notEmpty().trim(),
    body('department').notEmpty().trim(),
    body('credits').isInt({ min: 1 })
  ],
  courseController.create
);

// Create course section
coursesRouter.post('/:id/sections',
  authenticateToken,
  authorizeRoles('admin'),
  [
    body('professor_id').notEmpty(),
    body('semester').isIn(['Fall', 'Spring', 'Summer']),
    body('year').isInt({ min: 2024 }),
    body('max_students').isInt({ min: 1 })
  ],
  courseController.createSection
);

// Add course material
coursesRouter.post('/sections/:sectionId/materials',
  authenticateToken,
  professorOnly,
  [
    body('title').notEmpty().trim(),
    body('type').isIn(['syllabus', 'assignment', 'lecture', 'reading', 'video']),
    body('content_url').isURL(),
    body('due_date').optional().isISO8601()
  ],
  courseController.addMaterial
);

// Add course schedule
coursesRouter.post('/sections/:sectionId/schedule',
  authenticateToken,
  professorOnly,
  [
    body('day_of_week').isInt({ min: 0, max: 6 }),
    body('start_time').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('end_time').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('room').notEmpty().trim(),
    body('type').isIn(['lecture', 'lab', 'exam', 'office_hours'])
  ],
  courseController.addSchedule
);

// Enroll student in course section
coursesRouter.post('/sections/:sectionId/enroll',
  authenticateToken,
  [
    body('student_id').notEmpty()
  ],
  courseController.enrollStudent
);

// Record attendance
coursesRouter.post('/schedule/:scheduleId/attendance',
  authenticateToken,
  professorOnly,
  [
    body('student_id').notEmpty(),
    body('status').isIn(['present', 'absent', 'late', 'excused']),
    body('note').optional().trim()
  ],
  courseController.recordAttendance
);