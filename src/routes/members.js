import { Router } from 'express';
import { body, query } from 'express-validator';
import { memberController } from '../controllers/memberController.js';

export const membersRouter = Router();

// Get all members with pagination
membersRouter.get('/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().isString()
  ],
  memberController.getAll
);

// Get single member
membersRouter.get('/:id', 
  memberController.getOne
);

// Create new member
membersRouter.post('/',
  [
    body('name').notEmpty().trim(),
    body('email').isEmail(),
    body('phone').notEmpty().trim()
  ],
  memberController.create
);