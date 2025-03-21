import crypto from 'crypto';

export class Member {
  static async findAll(db, { page = 1, limit = 10, search }) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT 
        m.*,
        COUNT(DISTINCT l.id) as total_loans,
        SUM(CASE WHEN l.status = 'active' THEN 1 ELSE 0 END) as active_loans
      FROM members m
      LEFT JOIN loans l ON m.id = l.member_id
    `;

    const params = [];

    if (search) {
      query += ' WHERE m.name LIKE ? OR m.email LIKE ?';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    query += ' GROUP BY m.id';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total FROM members m
      ${search ? 'WHERE m.name LIKE ? OR m.email LIKE ?' : ''}
    `;
    
    const { total } = await db.get(countQuery, ...params);

    // Add ordering and pagination
    query += ' ORDER BY m.name ASC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const members = await db.all(query, ...params);

    return {
      members,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async findById(db, id) {
    const member = await db.get('SELECT * FROM members WHERE id = ?', id);
    if (!member) return null;

    member.loans = await db.all(`
      SELECT 
        l.*,
        b.title as book_title
      FROM loans l
      JOIN book_copies bc ON l.book_copy_id = bc.id
      JOIN books b ON bc.book_id = b.id
      WHERE l.member_id = ?
      ORDER BY l.loan_date DESC
    `, id);

    return member;
  }

  static async create(db, { name, email, phone }) {
    const id = crypto.randomUUID();
    
    await db.run(`
      INSERT INTO members (id, name, email, phone)
      VALUES (?, ?, ?, ?)
    `, id, name, email, phone);
    
    return this.findById(db, id);
  }

  static async canBorrow(db, id) {
    const member = await db.get(`
      SELECT status, max_loans, current_loans, total_fines 
      FROM members 
      WHERE id = ?
    `, id);

    if (!member) throw new Error('Member not found');
    if (member.status === 'suspended') throw new Error('Member is suspended');
    if (member.total_fines > 0) throw new Error('Member has unpaid fines');
    if (member.current_loans >= member.max_loans) throw new Error('Member has reached maximum loans limit');

    return true;
  }
}