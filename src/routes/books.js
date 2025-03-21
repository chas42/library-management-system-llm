import { Router } from 'express';
import { body, query } from 'express-validator';
import { bookController } from '../controllers/bookController.js';
import { cacheMiddleware } from '../lib/cache.js';

export const booksRouter = Router();

// Get all books with pagination
booksRouter.get('/', 
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('sortBy').optional().isIn(['title', 'publication_year', 'borrow_count']),
    query('sortOrder').optional().isIn(['asc', 'desc'])
  ],
  cacheMiddleware('books', 3600), 
  bookController.getAll
);

// Get single book
booksRouter.get('/:id', 
  cacheMiddleware('book', 3600), 
  bookController.getOne
);

// Create new book
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