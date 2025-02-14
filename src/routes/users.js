import { Router } from 'express';
import { body } from 'express-validator';
import { userController } from '../controllers/userController.js';
import { authenticateToken } from '../middleware/auth.js';

export const usersRouter = Router();

// Get user profile
usersRouter.get('/profile',
  authenticateToken,
  userController.getProfile
);

// Update user profile
usersRouter.put('/profile',
  authenticateToken,
  [
    body('name').optional().trim().notEmpty(),
    body('grade').optional().isIn(['9', '10', '11', '12']),
    body('department').optional().trim().notEmpty(),
    body('subjects').optional().isArray()
  ],
  userController.updateProfile
);

// Get user activity logs
usersRouter.get('/activity-logs',
  authenticateToken,
  userController.getActivityLogs
);