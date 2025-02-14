import { validationResult } from 'express-validator';
import { Loan } from '../models/Loan.js';
import { Member } from '../models/Member.js';

export const loanController = {
  async getAll(req, res) {
    try {
      const db = req.app.locals.db;
      const loans = await Loan.findAll(db);
      res.json(loans);
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
      const { member_id } = req.body;

      // Check if member can borrow
      await Member.canBorrow(db, member_id);

      const loan = await Loan.create(db, req.body);
      res.status(201).json(loan);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async returnBook(req, res) {
    try {
      const db = req.app.locals.db;
      const loan = await Loan.return(db, req.params.id);
      
      if (!loan) {
        return res.status(404).json({ error: 'Loan not found' });
      }

      res.json(loan);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};