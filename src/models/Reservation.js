import crypto from 'crypto';

export class Reservation {
  static async findAll(db) {
    return db.all(`
      SELECT 
        r.*,
        b.title as book_title,
        m.name as member_name,
        m.email as member_email
      FROM reservations r
      JOIN books b ON r.book_id = b.id
      JOIN members m ON r.member_id = m.id
      ORDER BY r.reservation_date ASC
    `);
  }

  static async findByBook(db, bookId) {
    return db.all(`
      SELECT 
        r.*,
        m.name as member_name,
        m.email as member_email
      FROM reservations r
      JOIN members m ON r.member_id = m.id
      WHERE r.book_id = ? AND r.status = 'pending'
      ORDER BY r.reservation_date ASC
    `, bookId);
  }

  static async create(db, { book_id, member_id }) {
    await db.run('BEGIN TRANSACTION');
    
    try {
      // Check if book exists and has no available copies
      const book = await db.get(`
        SELECT 
          b.*,
          COUNT(DISTINCT bc.id) as total_copies,
          SUM(CASE WHEN bc.status = 'available' THEN 1 ELSE 0 END) as available_copies
        FROM books b
        LEFT JOIN book_copies bc ON b.id = bc.book_id
        WHERE b.id = ?
        GROUP BY b.id
      `, book_id);

      if (!book) {
        throw new Error('Book not found');
      }

      if (book.available_copies > 0) {
        throw new Error('Book is currently available, no need for reservation');
      }

      // Check if member already has a pending reservation for this book
      const existingReservation = await db.get(`
        SELECT id FROM reservations 
        WHERE book_id = ? AND member_id = ? AND status = 'pending'
      `, book_id, member_id);

      if (existingReservation) {
        throw new Error('Member already has a pending reservation for this book');
      }

      const id = crypto.randomUUID();
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 2); // Reservation expires in 2 days

      await db.run(`
        INSERT INTO reservations (
          id, book_id, member_id, 
          reservation_date, status, expiry_date
        )
        VALUES (?, ?, ?, CURRENT_TIMESTAMP, 'pending', ?)
      `, id, book_id, member_id, expiryDate.toISOString());

      await db.run('COMMIT');
      
      return this.findById(db, id);
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }
  }

  static async findById(db, id) {
    return db.get(`
      SELECT 
        r.*,
        b.title as book_title,
        m.name as member_name,
        m.email as member_email
      FROM reservations r
      JOIN books b ON r.book_id = b.id
      JOIN members m ON r.member_id = m.id
      WHERE r.id = ?
    `, id);
  }

  static async cancel(db, id) {
    const reservation = await this.findById(db, id);
    if (!reservation) {
      throw new Error('Reservation not found');
    }

    if (reservation.status !== 'pending') {
      throw new Error('Only pending reservations can be cancelled');
    }

    await db.run(`
      UPDATE reservations 
      SET status = 'cancelled'
      WHERE id = ?
    `, id);

    return this.findById(db, id);
  }

  static async processNextInLine(db, bookId) {
    const nextReservation = await db.get(`
      SELECT r.* 
      FROM reservations r
      WHERE r.book_id = ? AND r.status = 'pending'
      ORDER BY r.reservation_date ASC
      LIMIT 1
    `, bookId);

    if (nextReservation) {
      await db.run(`
        UPDATE reservations
        SET status = 'fulfilled'
        WHERE id = ?
      `, nextReservation.id);

      return this.findById(db, nextReservation.id);
    }

    return null;
  }
}