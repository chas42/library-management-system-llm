import { validationResult } from 'express-validator';
import { User } from '../models/User.js';

export const userController = {
  async getProfile(req, res) {
    try {
      const db = req.app.locals.db;
      const user = await User.findById(db, req.user.id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async updateProfile(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const db = req.app.locals.db;
      const user = await User.updateProfile(db, req.user.id, req.body);
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async getActivityLogs(req, res) {
    try {
      const db = req.app.locals.db;
      const user = await User.findById(db, req.user.id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user.activity_logs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};