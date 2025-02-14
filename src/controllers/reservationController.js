import { validationResult } from 'express-validator';
import { Reservation } from '../models/Reservation.js';

export const reservationController = {
  async getAll(req, res) {
    try {
      const db = req.app.locals.db;
      const reservations = await Reservation.findAll(db);
      res.json(reservations);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getByBook(req, res) {
    try {
      const db = req.app.locals.db;
      const reservations = await Reservation.findByBook(db, req.params.bookId);
      res.json(reservations);
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
      const reservation = await Reservation.create(db, req.body);
      res.status(201).json(reservation);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async cancel(req, res) {
    try {
      const db = req.app.locals.db;
      const reservation = await Reservation.cancel(db, req.params.id);
      res.json(reservation);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
};