import { Router } from 'express';
import { body, query } from 'express-validator';
import { loanController } from '../controllers/loanController.js';

export const loansRouter = Router();

// Get all loans with pagination
loansRouter.get('/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['active', 'returned', 'overdue'])
  ],
  loanController.getAll
);

// Create new loan
loansRouter.post('/',
  [
    body('book_copy_id').notEmpty(),
    body('member_id').notEmpty(),
    body('due_date').isISO8601()
  ],
  loanController.create
);

// Return a book
loansRouter.post('/:id/return', 
  loanController.returnBook
);