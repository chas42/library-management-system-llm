import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';

export const membersRouter = Router();

// Get all members
membersRouter.get('/', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const members = await db.all('SELECT * FROM members');
    res.json(members);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single member with their active loans
membersRouter.get('/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const member = await db.get('SELECT * FROM members WHERE id = ?', req.params.id);
    if (!member) return res.status(404).json({ error: 'Member not found' });

    const loans = await db.all(`
      SELECT loans.*, books.title as book_title
      FROM loans
      JOIN books ON loans.book_id = books.id
      WHERE member_id = ?
    `, req.params.id);

    member.loans = loans;
    res.json(member);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a new member
membersRouter.post('/',
  [
    body('name').notEmpty().trim(),
    body('email').isEmail(),
    body('phone').notEmpty().trim()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const db = req.app.locals.db;
      const id = crypto.randomUUID();
      const { name, email, phone } = req.body;
      
      await db.run(`
        INSERT INTO members (id, name, email, phone)
        VALUES (?, ?, ?, ?)
      `, id, name, email, phone);
      
      const member = await db.get('SELECT * FROM members WHERE id = ?', id);
      res.status(201).json(member);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);