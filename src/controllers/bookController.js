import { validationResult } from 'express-validator';
import { Book } from '../models/Book.js';
import { invalidateCache } from '../lib/cache.js';

export const bookController = {
  async getAll(req, res) {
    try {
      const db = req.app.locals.db;
      const {
        search,
        genre,
        author,
        available,
        sortBy,
        sortOrder,
        page,
        limit
      } = req.query;

      const result = await Book.findAll(db, {
        search,
        genre,
        author,
        available,
        sortBy,
        sortOrder,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10
      });

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getOne(req, res) {
    try {
      const db = req.app.locals.db;
      const book = await Book.findById(db, req.params.id);
      
      if (!book) {
        return res.status(404).json({ error: 'Book not found' });
      }

      res.json(book);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async create(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const db = req.app.locals.db;
      const book = await Book.create(db, req.body);
      
      // Invalidate book-related caches
      await invalidateCache('books:*');
      await invalidateCache('book:*');
      
      res.status(201).json(book);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};