import { Router } from 'express';
import { body } from 'express-validator';
import { loanController } from '../controllers/loanController.js';

export const loansRouter = Router();

loansRouter.get('/', loanController.getAll);
loansRouter.post('/',
  [
    body('book_copy_id').notEmpty(),
    body('member_id').notEmpty(),
    body('due_date').isISO8601()
  ],
  loanController.create
);
loansRouter.post('/:id/return', loanController.returnBook);