import { Router } from 'express';
import { body } from 'express-validator';
import { memberController } from '../controllers/memberController.js';

export const membersRouter = Router();

membersRouter.get('/', memberController.getAll);
membersRouter.get('/:id', memberController.getOne);
membersRouter.post('/',
  [
    body('name').notEmpty().trim(),
    body('email').isEmail(),
    body('phone').notEmpty().trim()
  ],
  memberController.create
);