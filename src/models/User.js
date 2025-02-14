import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export class User {
  static async findByEmail(db, email) {
    return db.get('SELECT * FROM users WHERE email = ?', email);
  }

  static async findById(db, id) {
    const user = await db.get(`
      SELECT 
        u.id,
        u.email,
        u.role,
        u.name,
        u.status,
        u.created_at,
        CASE 
          WHEN u.role = 'student' THEN (
            SELECT json_object(
              'student_id', s.student_id,
              'grade', s.grade,
              'parent_id', s.parent_id
            )
            FROM student_profiles s
            WHERE s.user_id = u.id
          )
          WHEN u.role = 'professor' THEN (
            SELECT json_object(
              'employee_id', p.employee_id,
              'department', p.department,
              'subjects', p.subjects
            )
            FROM professor_profiles p
            WHERE p.user_id = u.id
          )
          WHEN u.role = 'parent' THEN (
            SELECT json_group_array(s.student_id)
            FROM student_profiles s
            WHERE s.parent_id = u.id
          )
        END as profile
      FROM users u
      WHERE u.id = ?
    `, id);

    if (!user) return null;

    // Parse the JSON profile if it exists
    if (user.profile) {
      user.profile = JSON.parse(user.profile);
    }

    // Get activity logs
    user.activity_logs = await db.all(`
      SELECT action, details, created_at
      FROM user_activity_logs
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `, id);

    return user;
  }

  static async create(db, { email, password, role, name, profile }) {
    const id = crypto.randomUUID();
    const hashedPassword = await bcrypt.hash(password, 10);
    
    await db.run('BEGIN TRANSACTION');

    try {
      // Create base user
      await db.run(
        'INSERT INTO users (id, email, password, role, name, status) VALUES (?, ?, ?, ?, ?, ?)',
        id, email, hashedPassword, role, name, 'active'
      );

      // Create role-specific profile
      if (role === 'student') {
        await db.run(`
          INSERT INTO student_profiles (
            user_id, student_id, grade, parent_id
          ) VALUES (?, ?, ?, ?)
        `, id, profile.student_id, profile.grade, profile.parent_id);
      } else if (role === 'professor') {
        await db.run(`
          INSERT INTO professor_profiles (
            user_id, employee_id, department, subjects
          ) VALUES (?, ?, ?, ?)
        `, id, profile.employee_id, profile.department, profile.subjects);
      }

      await db.run('COMMIT');
      return this.findById(db, id);
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }
  }

  static async authenticate(db, email, password) {
    const user = await this.findByEmail(db, email);
    if (!user) return null;
    if (user.status !== 'active') return null;

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return null;

    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        name: user.name
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Log login activity
    await this.logActivity(db, user.id, 'login', { ip: '127.0.0.1' });

    return { 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        name: user.name
      } 
    };
  }

  static async updateProfile(db, userId, updates) {
    const user = await this.findById(db, userId);
    if (!user) throw new Error('User not found');

    await db.run('BEGIN TRANSACTION');

    try {
      // Update base user info
      if (updates.name) {
        await db.run(
          'UPDATE users SET name = ? WHERE id = ?',
          updates.name, userId
        );
      }

      // Update role-specific profile
      if (user.role === 'student' && updates.grade) {
        await db.run(
          'UPDATE student_profiles SET grade = ? WHERE user_id = ?',
          updates.grade, userId
        );
      } else if (user.role === 'professor') {
        if (updates.department) {
          await db.run(
            'UPDATE professor_profiles SET department = ? WHERE user_id = ?',
            updates.department, userId
          );
        }
        if (updates.subjects) {
          await db.run(
            'UPDATE professor_profiles SET subjects = ? WHERE user_id = ?',
            updates.subjects, userId
          );
        }
      }

      await db.run('COMMIT');
      return this.findById(db, userId);
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }
  }

  static async logActivity(db, userId, action, details) {
    await db.run(`
      INSERT INTO user_activity_logs (
        id, user_id, action, details
      ) VALUES (?, ?, ?, ?)
    `, crypto.randomUUID(), userId, action, JSON.stringify(details));
  }
}