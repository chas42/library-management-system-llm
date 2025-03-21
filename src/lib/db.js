import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, '../../data.db');

// Global database connection
let db = null;

// Cleanup function to properly close database
const cleanup = async () => {
  if (db) {
    try {
      await db.close();
      db = null;
    } catch (error) {
      console.error('Error closing database:', error);
    }
  }
};

// Register cleanup handlers
process.on('exit', cleanup);
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('uncaughtException', cleanup);
process.on('unhandledRejection', cleanup);

// Create and initialize the database
export const initDb = async () => {
  // If we already have a connection, close it first
  if (db) {
    await cleanup();
  }

  const dbDir = dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Ensure the database file is not locked
  if (fs.existsSync(dbPath)) {
    try {
      fs.unlinkSync(dbPath);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Error removing existing database:', error);
      }
    }
  }

  try {
    // Create new database connection with better configuration
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
      mode: sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE
    });

    // Configure SQLite for better reliability
    await db.run('PRAGMA journal_mode = WAL'); // Use WAL mode for better concurrency
    await db.run('PRAGMA busy_timeout = 60000'); // Increase timeout to 60 seconds
    await db.run('PRAGMA synchronous = NORMAL'); // Balance between safety and performance
    await db.run('PRAGMA foreign_keys = ON');
    await db.run('PRAGMA temp_store = MEMORY');
    await db.run('PRAGMA cache_size = -2000'); // Use 2MB of memory for cache

    // Initialize schema in a single transaction
    await db.exec(`
      BEGIN TRANSACTION;

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('admin', 'professor', 'student', 'parent')),
        name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS student_profiles (
        user_id TEXT PRIMARY KEY,
        student_id TEXT UNIQUE NOT NULL,
        grade TEXT NOT NULL,
        parent_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS professor_profiles (
        user_id TEXT PRIMARY KEY,
        employee_id TEXT UNIQUE NOT NULL,
        department TEXT NOT NULL,
        subjects TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS books (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        isbn TEXT UNIQUE NOT NULL,
        publisher TEXT NOT NULL,
        publication_year INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS authors (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS book_authors (
        book_id TEXT NOT NULL,
        author_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (book_id, author_id),
        FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
        FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS genres (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS book_genres (
        book_id TEXT NOT NULL,
        genre_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (book_id, genre_id),
        FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
        FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS book_copies (
        id TEXT PRIMARY KEY,
        book_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'available' 
          CHECK (status IN ('available', 'borrowed', 'reserved', 'maintenance')),
        condition TEXT NOT NULL DEFAULT 'new'
          CHECK (condition IN ('new', 'good', 'fair', 'poor')),
        location TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS members (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        status TEXT NOT NULL DEFAULT 'active' 
          CHECK (status IN ('active', 'suspended', 'inactive')),
        max_loans INTEGER NOT NULL DEFAULT 5,
        current_loans INTEGER NOT NULL DEFAULT 0,
        total_fines DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS loans (
        id TEXT PRIMARY KEY,
        book_copy_id TEXT NOT NULL,
        member_id TEXT NOT NULL,
        loan_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        due_date DATETIME NOT NULL,
        return_date DATETIME,
        status TEXT NOT NULL DEFAULT 'active'
          CHECK (status IN ('active', 'returned', 'overdue')),
        fine_amount DECIMAL(10,2) DEFAULT 0.00,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (book_copy_id) REFERENCES book_copies(id) ON DELETE RESTRICT,
        FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE RESTRICT
      );

      CREATE TABLE IF NOT EXISTS reservations (
        id TEXT PRIMARY KEY,
        book_id TEXT NOT NULL,
        member_id TEXT NOT NULL,
        reservation_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        status TEXT NOT NULL DEFAULT 'pending'
          CHECK (status IN ('pending', 'fulfilled', 'cancelled', 'expired')),
        expiry_date DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
        FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS courses (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        department TEXT NOT NULL,
        credits INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS course_sections (
        id TEXT PRIMARY KEY,
        course_id TEXT NOT NULL,
        professor_id TEXT NOT NULL,
        semester TEXT NOT NULL,
        year INTEGER NOT NULL,
        max_students INTEGER NOT NULL,
        current_students INTEGER DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
        FOREIGN KEY (professor_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS course_materials (
        id TEXT PRIMARY KEY,
        section_id TEXT NOT NULL,
        title TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('syllabus', 'assignment', 'lecture', 'reading', 'video')),
        content_url TEXT NOT NULL,
        description TEXT,
        due_date DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (section_id) REFERENCES course_sections(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS course_schedules (
        id TEXT PRIMARY KEY,
        section_id TEXT NOT NULL,
        day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        room TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('lecture', 'lab', 'exam', 'office_hours')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (section_id) REFERENCES course_sections(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS student_enrollments (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        section_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'dropped', 'completed')),
        grade TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES users(id),
        FOREIGN KEY (section_id) REFERENCES course_sections(id) ON DELETE CASCADE,
        UNIQUE(student_id, section_id)
      );

      CREATE TABLE IF NOT EXISTS attendance_records (
        id TEXT PRIMARY KEY,
        schedule_id TEXT NOT NULL,
        student_id TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
        note TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (schedule_id) REFERENCES course_schedules(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES users(id),
        UNIQUE(schedule_id, student_id)
      );

      CREATE TABLE IF NOT EXISTS user_activity_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        action TEXT NOT NULL,
        details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_student_profiles_parent ON student_profiles(parent_id);
      CREATE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn);
      CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
      CREATE INDEX IF NOT EXISTS idx_book_copies_status ON book_copies(status);
      CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
      CREATE INDEX IF NOT EXISTS idx_loans_due_date ON loans(due_date);
      CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
      CREATE INDEX IF NOT EXISTS idx_courses_department ON courses(department);
      CREATE INDEX IF NOT EXISTS idx_course_sections_semester ON course_sections(semester, year);
      CREATE INDEX IF NOT EXISTS idx_course_materials_section ON course_materials(section_id);
      CREATE INDEX IF NOT EXISTS idx_course_schedules_section ON course_schedules(section_id);
      CREATE INDEX IF NOT EXISTS idx_student_enrollments_student ON student_enrollments(student_id);
      CREATE INDEX IF NOT EXISTS idx_attendance_records_schedule ON attendance_records(schedule_id);
      CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON user_activity_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_activity_logs_date ON user_activity_logs(created_at);

      COMMIT;
    `);

    return db;
  } catch (error) {
    console.error('Database initialization error:', error);
    await cleanup();
    throw error;
  }
};