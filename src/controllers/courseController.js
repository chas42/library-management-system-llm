import { validationResult } from 'express-validator';
import { Course } from '../models/Course.js';

export const courseController = {
  async getAll(req, res) {
    try {
      const db = req.app.locals.db;
      const courses = await Course.findAll(db, req.query);
      res.json(courses);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getOne(req, res) {
    try {
      const db = req.app.locals.db;
      const course = await Course.findById(db, req.params.id);
      
      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }

      res.json(course);
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
      const course = await Course.create(db, req.body);
      res.status(201).json(course);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async createSection(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const db = req.app.locals.db;
      const section = await Course.createSection(db, req.body);
      res.status(201).json(section);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async addMaterial(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const db = req.app.locals.db;
      const material = await Course.addMaterial(db, {
        section_id: req.params.sectionId,
        ...req.body
      });
      res.status(201).json(material);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async addSchedule(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const db = req.app.locals.db;
      const schedule = await Course.addSchedule(db, {
        section_id: req.params.sectionId,
        ...req.body
      });
      res.status(201).json(schedule);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async enrollStudent(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const db = req.app.locals.db;
      const enrollment = await Course.enrollStudent(db, req.body);
      res.status(201).json(enrollment);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  async recordAttendance(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const db = req.app.locals.db;
      const attendance = await Course.recordAttendance(db, {
        schedule_id: req.params.scheduleId,
        ...req.body
      });
      res.status(201).json(attendance);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
};