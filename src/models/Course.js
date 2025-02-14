import crypto from 'crypto';

export class Course {
  static async findAll(db, { department, status = 'active' } = {}) {
    let query = `
      SELECT 
        c.*,
        COUNT(DISTINCT cs.id) as total_sections,
        COUNT(DISTINCT se.student_id) as total_students
      FROM courses c
      LEFT JOIN course_sections cs ON c.id = cs.course_id
      LEFT JOIN student_enrollments se ON cs.id = se.section_id
    `;

    const params = [];
    const conditions = ['c.status = ?'];
    params.push(status);

    if (department) {
      conditions.push('c.department = ?');
      params.push(department);
    }

    query += ` WHERE ${conditions.join(' AND ')}
               GROUP BY c.id
               ORDER BY c.code`;

    return db.all(query, ...params);
  }

  static async findById(db, id) {
    const course = await db.get('SELECT * FROM courses WHERE id = ?', id);
    if (!course) return null;

    // Get active sections
    course.sections = await db.all(`
      SELECT 
        cs.*,
        u.name as professor_name,
        COUNT(se.id) as enrolled_students
      FROM course_sections cs
      JOIN users u ON cs.professor_id = u.id
      LEFT JOIN student_enrollments se ON cs.id = se.section_id
      WHERE cs.course_id = ?
      GROUP BY cs.id
      ORDER BY cs.year DESC, cs.semester DESC
    `, id);

    return course;
  }

  static async create(db, { code, title, description, department, credits }) {
    const id = crypto.randomUUID();
    
    await db.run(`
      INSERT INTO courses (id, code, title, description, department, credits)
      VALUES (?, ?, ?, ?, ?, ?)
    `, id, code, title, description, department, credits);

    return this.findById(db, id);
  }

  static async createSection(db, {
    course_id,
    professor_id,
    semester,
    year,
    max_students
  }) {
    const id = crypto.randomUUID();

    await db.run(`
      INSERT INTO course_sections (
        id, course_id, professor_id, semester, year, max_students
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, id, course_id, professor_id, semester, year, max_students);

    return db.get(`
      SELECT 
        cs.*,
        u.name as professor_name,
        c.code as course_code,
        c.title as course_title
      FROM course_sections cs
      JOIN users u ON cs.professor_id = u.id
      JOIN courses c ON cs.course_id = c.id
      WHERE cs.id = ?
    `, id);
  }

  static async addMaterial(db, {
    section_id,
    title,
    type,
    content_url,
    description,
    due_date
  }) {
    const id = crypto.randomUUID();

    await db.run(`
      INSERT INTO course_materials (
        id, section_id, title, type, content_url, description, due_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, id, section_id, title, type, content_url, description, due_date);

    return db.get('SELECT * FROM course_materials WHERE id = ?', id);
  }

  static async addSchedule(db, {
    section_id,
    day_of_week,
    start_time,
    end_time,
    room,
    type
  }) {
    const id = crypto.randomUUID();

    await db.run(`
      INSERT INTO course_schedules (
        id, section_id, day_of_week, start_time, end_time, room, type
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, id, section_id, day_of_week, start_time, end_time, room, type);

    return db.get('SELECT * FROM course_schedules WHERE id = ?', id);
  }

  static async enrollStudent(db, { student_id, section_id }) {
    await db.run('BEGIN TRANSACTION');

    try {
      // Check if section has space
      const section = await db.get(`
        SELECT current_students, max_students 
        FROM course_sections 
        WHERE id = ?
      `, section_id);

      if (section.current_students >= section.max_students) {
        throw new Error('Section is full');
      }

      const id = crypto.randomUUID();

      await db.run(`
        INSERT INTO student_enrollments (id, student_id, section_id)
        VALUES (?, ?, ?)
      `, id, student_id, section_id);

      await db.run(`
        UPDATE course_sections
        SET current_students = current_students + 1
        WHERE id = ?
      `, section_id);

      await db.run('COMMIT');

      return db.get(`
        SELECT 
          se.*,
          u.name as student_name,
          c.code as course_code,
          c.title as course_title
        FROM student_enrollments se
        JOIN users u ON se.student_id = u.id
        JOIN course_sections cs ON se.section_id = cs.id
        JOIN courses c ON cs.course_id = c.id
        WHERE se.id = ?
      `, id);
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }
  }

  static async recordAttendance(db, { schedule_id, student_id, status, note }) {
    const id = crypto.randomUUID();

    await db.run(`
      INSERT INTO attendance_records (
        id, schedule_id, student_id, status, note
      ) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(schedule_id, student_id) DO UPDATE SET
        status = excluded.status,
        note = excluded.note
    `, id, schedule_id, student_id, status, note);

    return db.get(`
      SELECT 
        ar.*,
        u.name as student_name,
        cs.start_time,
        cs.end_time,
        c.code as course_code
      FROM attendance_records ar
      JOIN users u ON ar.student_id = u.id
      JOIN course_schedules cs ON ar.schedule_id = cs.id
      JOIN course_sections sect ON cs.section_id = sect.id
      JOIN courses c ON sect.course_id = c.id
      WHERE ar.id = ?
    `, id);
  }
}