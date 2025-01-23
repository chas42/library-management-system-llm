import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import crypto from 'crypto';

export const booksRouter = Router();

// Get all books with optional search
booksRouter.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    const db = req.app.locals.db;
    
    let query = 'SELECT * FROM books';
    let params = [];
    
    if (search) {
      query += ' WHERE title LIKE ? OR author LIKE ?';
      params = [`%${search}%`, `%${search}%`];
    }
    
    const books = await db.all(query, ...params);
    res.json(books);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single book
booksRouter.get('/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const book = await db.get('SELECT * FROM books WHERE id = ?', req.params.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    res.json(book);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a new book
booksRouter.post('/',
  [
    body('title').notEmpty().trim(),
    body('author').notEmpty().trim(),
    body('isbn').notEmpty().trim(),
    body('quantity').isInt({ min: 0 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const db = req.app.locals.db;
      const id = crypto.randomUUID();
      const { title, author, isbn, quantity } = req.body;
      
      await db.run(`
        INSERT INTO books (id, title, author, isbn, quantity)
        VALUES (?, ?, ?, ?, ?)
      `, id, title, author, isbn, quantity);
      
      const book = await db.get('SELECT * FROM books WHERE id = ?', id);
      res.status(201).json(book);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);