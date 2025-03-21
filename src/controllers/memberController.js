import { validationResult } from 'express-validator';
import { Member } from '../models/Member.js';

export const memberController = {
  async getAll(req, res) {
    try {
      const db = req.app.locals.db;
      const { page = 1, limit = 10, search } = req.query;

      const result = await Member.findAll(db, {
        page: parseInt(page),
        limit: parseInt(limit),
        search
      });

      res.json({
        members: result.members,
        pagination: {
          total: result.pagination.total,
          page: result.pagination.page,
          limit: result.pagination.limit,
          totalPages: result.pagination.totalPages
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getOne(req, res) {
    try {
      const db = req.app.locals.db;
      const member = await Member.findById(db, req.params.id);
      
      if (!member) {
        return res.status(404).json({ error: 'Member not found' });
      }

      res.json(member);
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
      const member = await Member.create(db, req.body);
      res.status(201).json(member);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};