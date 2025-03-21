import crypto from 'crypto';

export class Loan {
  static async findAll(db, { page = 1, limit = 10, status }) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT 
        l.*,
        b.title as book_title,
        bc.id as copy_id,
        m.name as member_name,
        m.email as member_email
      FROM loans l
      JOIN book_copies bc ON l.book_copy_id = bc.id
      JOIN books b ON bc.book_id = b.id
      JOIN members m ON l.member_id = m.id
    `;

    const params = [];

    if (status) {
      query += ' WHERE l.status = ?';
      params.push(status);
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total FROM loans l
      ${status ? 'WHERE l.status = ?' : ''}
    `;
    
    const { total } = await db.get(countQuery, ...params);

    // Add ordering and pagination
    query += ' ORDER BY l.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const loans = await db.all(query, ...params);

    return {
      loans,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async findById(db, id) {
    return db.get(`
      SELECT 
        l.*,
        b.title as book_title,
        m.name as member_name
      FROM loans l
      JOIN book_copies bc ON l.book_copy_id = bc.id
      JOIN books b ON bc.book_id = b.id
      JOIN members m ON l.member_id = m.id
      WHERE l.id = ?
    `, id);
  }

  static async create(db, { book_copy_id, member_id, due_date }) {
    await db.run('BEGIN TRANSACTION');
    
    try {
      const id = crypto.randomUUID();
      
      await db.run(`
        INSERT INTO loans (
          id, book_copy_id, member_id, 
          loan_date, due_date, status
        )
        VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, 'active')
      `, id, book_copy_id, member_id, due_date);

      await db.run(`
        UPDATE book_copies 
        SET status = 'borrowed' 
        WHERE id = ?
      `, book_copy_id);

      await db.run(`
        UPDATE members 
        SET current_loans = current_loans + 1 
        WHERE id = ?
      `, member_id);
      
      await db.run('COMMIT');
      return this.findById(db, id);
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }
  }

  static async return(db, id) {
    const loan = await db.get(`
      SELECT l.*, bc.id as copy_id, m.id as member_id
      FROM loans l
      JOIN book_copies bc ON l.book_copy_id = bc.id
      JOIN members m ON l.member_id = m.id
      WHERE l.id = ?
    `, id);

    if (!loan) return null;
    if (loan.status === 'returned') throw new Error('Book already returned');

    await db.run('BEGIN TRANSACTION');
    
    try {
      const dueDate = new Date(loan.due_date);
      const returnDate = new Date();
      let fineAmount = 0;

      if (returnDate > dueDate) {
        const daysOverdue = Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24));
        fineAmount = daysOverdue * 0.50; // $0.50 per day
      }

      await db.run(`
        UPDATE loans 
        SET status = 'returned',
            return_date = CURRENT_TIMESTAMP,
            fine_amount = ?
        WHERE id = ?
      `, fineAmount, id);

      await db.run(`
        UPDATE book_copies 
        SET status = 'available' 
        WHERE id = ?
      `, loan.copy_id);

      await db.run(`
        UPDATE members 
        SET current_loans = current_loans - 1,
            total_fines = total_fines + ?
        WHERE id = ?
      `, fineAmount, loan.member_id);

      const reservation = await db.get(`
        SELECT id, member_id
        FROM reservations
        WHERE book_id = (
          SELECT book_id 
          FROM book_copies 
          WHERE id = ?
        )
        AND status = 'pending'
        ORDER BY reservation_date ASC
        LIMIT 1
      `, loan.copy_id);

      if (reservation) {
        await db.run(`
          UPDATE reservations
          SET status = 'fulfilled'
          WHERE id = ?
        `, reservation.id);

        await db.run(`
          UPDATE book_copies
          SET status = 'reserved'
          WHERE id = ?
        `, loan.copy_id);
      }
      
      await db.run('COMMIT');
      return this.findById(db, id);
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }
  }
}