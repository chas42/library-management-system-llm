import { Router } from 'express';
import { body } from 'express-validator';
import { bookController } from '../controllers/bookController.js';
import { cacheMiddleware } from '../lib/cache.js';

export const booksRouter = Router();

// Cache book listings for 1 hour
booksRouter.get('/', cacheMiddleware('books', 3600), bookController.getAll);

// Cache individual book details for 1 hour
booksRouter.get('/:id', cacheMiddleware('book', 3600), bookController.getOne);

booksRouter.post('/',
  [
    body('title').notEmpty().trim(),
    body('isbn').notEmpty().trim(),
    body('authors').isArray(),
    body('genres').isArray(),
    body('copies').isInt({ min: 1 })
  ],
  bookController.create
);