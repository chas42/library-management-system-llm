import { validationResult } from 'express-validator';
import { User } from '../models/User.js';

export const authController = {
  async register(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const db = req.app.locals.db;
      const { email, password, role, name, profile } = req.body;

      // Validate required fields
      if (!email || !password || !role || !name) {
        return res.status(400).json({ 
          error: 'Missing required fields: email, password, role, and name are required' 
        });
      }

      const existingUser = await User.findByEmail(db, email);
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Create user with all required fields
      const user = await User.create(db, { 
        email, 
        password, 
        role, 
        name,
        profile 
      });

      res.status(201).json({ 
        message: 'User registered successfully',
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  async login(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const db = req.app.locals.db;
      const { email, password } = req.body;

      const auth = await User.authenticate(db, email, password);
      if (!auth) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      res.json({ 
        token: auth.token,
        user: auth.user
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: error.message });
    }
  }
};