import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';

export const loansRouter = Router();

// Get all loans
loansRouter.get('/', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const loans = await db.all(`
      SELECT 
        loans.*,
        books.title as book_title,
        members.name as member_name
      FROM loans
      JOIN books ON loans.book_id = books.id
      JOIN members ON loans.member_id = members.id
    `);
    
    res.json(loans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new loan
loansRouter.post('/',
  [
    body('book_id').notEmpty(),
    body('member_id').notEmpty(),
    body('due_date').isISO8601()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const db = req.app.locals.db;
      const { book_id, member_id, due_date } = req.body;
      
      // Check book availability
      const book = await db.get('SELECT quantity FROM books WHERE id = ?', book_id);
      if (!book || book.quantity < 1) {
        return res.status(400).json({ error: 'Book not available' });
      }

      // Start transaction
      await db.run('BEGIN TRANSACTION');
      
      try {
        const id = crypto.randomUUID();
        await db.run(`
          INSERT INTO loans (id, book_id, member_id, loan_date, due_date, status)
          VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, 'active')
        `, id, book_id, member_id, due_date);

        await db.run('UPDATE books SET quantity = quantity - 1 WHERE id = ?', book_id);
        
        await db.run('COMMIT');
        
        const loan = await db.get('SELECT * FROM loans WHERE id = ?', id);
        res.status(201).json(loan);
      } catch (error) {
        await db.run('ROLLBACK');
        throw error;
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Return a book
loansRouter.post('/:id/return', async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    await db.run('BEGIN TRANSACTION');
    
    try {
      const result = await db.run(`
        UPDATE loans 
        SET status = 'returned', return_date = CURRENT_TIMESTAMP
        WHERE id = ?
      `, req.params.id);

      if (result.changes === 0) {
        throw new Error('Loan not found');
      }

      const loan = await db.get('SELECT * FROM loans WHERE id = ?', req.params.id);
      await db.run('UPDATE books SET quantity = quantity + 1 WHERE id = ?', loan.book_id);
      
      await db.run('COMMIT');
      res.json(loan);
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});