import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from 'dotenv';
import { initDb } from './lib/db.js';
import { authRouter } from './routes/auth.js';
import { booksRouter } from './routes/books.js';
import { loansRouter } from './routes/loans.js';
import { membersRouter } from './routes/members.js';
import { reservationsRouter } from './routes/reservations.js';
import { usersRouter } from './routes/users.js';
import { coursesRouter } from './routes/courses.js';
import { authenticateToken, authorizeRoles } from './middleware/auth.js';
import { apiLimiter, authLimiter } from './middleware/rateLimiter.js';

config();

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET environment variable is required');
  process.exit(1);
}

const app = express();
const port = process.env.PORT || 3000;

// Initialize database and start server
initDb().then(db => {
  // Add db to app locals so it's accessible in routes
  app.locals.db = db;

  // Middleware
  app.use(cors());
  app.use(morgan('dev'));
  app.use(express.json());

  // Apply rate limiting to all routes
  app.use('/api/', apiLimiter);

  // Public routes with stricter rate limiting
  app.use('/api/auth', authLimiter, authRouter);

  // User management routes
  app.use('/api/users', usersRouter);

  // Protected routes with role-based access
  app.use('/api/books', authenticateToken, authorizeRoles('admin', 'professor', 'student', 'parent'), booksRouter);
  app.use('/api/loans', authenticateToken, authorizeRoles('admin', 'professor'), loansRouter);
  app.use('/api/members', authenticateToken, authorizeRoles('admin', 'professor'), membersRouter);
  app.use('/api/reservations', reservationsRouter);
  app.use('/api/courses', coursesRouter);

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
  });

  app.listen(port, () => {
    console.log(`Library Management System running on port ${port}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});