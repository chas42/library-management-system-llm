import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, '../../data.db');

// Create and initialize the database
export const initDb = async () => {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Enable foreign keys
  await db.run('PRAGMA foreign_keys = ON');

  // Initialize database schema
  await db.exec(`
    -- Users and Authentication
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'professor', 'student', 'parent')),
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Student Profiles
    CREATE TABLE IF NOT EXISTS student_profiles (
      user_id TEXT PRIMARY KEY,
      student_id TEXT UNIQUE NOT NULL,
      grade TEXT NOT NULL,
      parent_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_id) REFERENCES users(id)
    );

    -- Professor Profiles
    CREATE TABLE IF NOT EXISTS professor_profiles (
      user_id TEXT PRIMARY KEY,
      employee_id TEXT UNIQUE NOT NULL,
      department TEXT NOT NULL,
      subjects TEXT NOT NULL, -- JSON array of subjects
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Courses
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

    -- Course Sections
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

    -- Course Materials
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

    -- Course Schedules
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

    -- Student Enrollments
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

    -- Attendance Records
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

    -- User Activity Logs
    CREATE TABLE IF NOT EXISTS user_activity_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_student_profiles_parent ON student_profiles(parent_id);
    CREATE INDEX IF NOT EXISTS idx_courses_department ON courses(department);
    CREATE INDEX IF NOT EXISTS idx_course_sections_semester ON course_sections(semester, year);
    CREATE INDEX IF NOT EXISTS idx_course_materials_section ON course_materials(section_id);
    CREATE INDEX IF NOT EXISTS idx_course_schedules_section ON course_schedules(section_id);
    CREATE INDEX IF NOT EXISTS idx_student_enrollments_student ON student_enrollments(student_id);
    CREATE INDEX IF NOT EXISTS idx_attendance_records_schedule ON attendance_records(schedule_id);
    CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON user_activity_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_activity_logs_date ON user_activity_logs(created_at);
  `);

  return db;
};