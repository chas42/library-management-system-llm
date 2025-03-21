import { Router } from 'express';
import { body } from 'express-validator';
import { authController } from '../controllers/authController.js';

export const authRouter = Router();

authRouter.post('/register',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['admin', 'professor', 'student', 'parent']).withMessage('Invalid role'),
    body('name').notEmpty().trim().withMessage('Name is required'),
    body('profile').optional().isObject().withMessage('Profile must be an object')
  ],
  authController.register
);

authRouter.post('/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  authController.login
);