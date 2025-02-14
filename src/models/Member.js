import crypto from 'crypto';

export class Member {
  static async findAll(db) {
    return db.all('SELECT * FROM members');
  }

  static async findById(db, id) {
    const member = await db.get('SELECT * FROM members WHERE id = ?', id);
    if (!member) return null;

    member.loans = await db.all(`
      SELECT loans.*, books.title as book_title
      FROM loans
      JOIN books ON loans.book_id = books.id
      WHERE member_id = ?
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