import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from 'dotenv';
import { initDb } from './lib/db.js';
import { booksRouter } from './routes/books.js';
import { loansRouter } from './routes/loans.js';
import { membersRouter } from './routes/members.js';

config();

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

  // Routes
  app.use('/api/books', booksRouter);
  app.use('/api/loans', loansRouter);
  app.use('/api/members', membersRouter);

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