import { Router } from 'express';
import { body } from 'express-validator';
import { reservationController } from '../controllers/reservationController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

export const reservationsRouter = Router();

// Get all reservations (librarians and admins only)
reservationsRouter.get('/',
  authenticateToken,
  authorizeRoles('admin', 'librarian'),
  reservationController.getAll
);

// Get waiting list for a specific book
reservationsRouter.get('/book/:bookId',
  authenticateToken,
  reservationController.getByBook
);

// Create a new reservation
reservationsRouter.post('/',
  authenticateToken,
  [
    body('book_id').notEmpty(),
    body('member_id').notEmpty()
  ],
  reservationController.create
);

// Cancel a reservation
reservationsRouter.post('/:id/cancel',
  authenticateToken,
  reservationController.cancel
);