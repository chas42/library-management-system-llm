import crypto from 'crypto';

export class Book {
  static async findAll(db, {
    search,
    genre,
    author,
    available,
    sortBy = 'title',
    sortOrder = 'asc',
    page = 1,
    limit = 10
  } = {}) {
    const offset = (page - 1) * limit;
    const params = [];
    
    // Base query with pagination
    let query = `
      WITH BookStats AS (
        SELECT 
          b.id,
          COUNT(DISTINCT l.id) as borrow_count
        FROM books b
        LEFT JOIN book_copies bc ON b.id = bc.book_id
        LEFT JOIN loans l ON bc.id = l.book_copy_id
        GROUP BY b.id
      )
      SELECT DISTINCT 
        b.*,
        GROUP_CONCAT(DISTINCT a.name) as authors,
        GROUP_CONCAT(DISTINCT g.name) as genres,
        COUNT(DISTINCT bc.id) as total_copies,
        SUM(CASE WHEN bc.status = 'available' THEN 1 ELSE 0 END) as available_copies,
        bs.borrow_count
      FROM books b
      LEFT JOIN book_authors ba ON b.id = ba.book_id
      LEFT JOIN authors a ON ba.author_id = a.id
      LEFT JOIN book_genres bg ON b.id = bg.book_id
      LEFT JOIN genres g ON bg.genre_id = g.id
      LEFT JOIN book_copies bc ON b.id = bc.book_id
      LEFT JOIN BookStats bs ON b.id = bs.id
    `;

    // Build WHERE clause
    const conditions = [];
    
    if (search) {
      conditions.push('(b.title LIKE ? OR b.isbn LIKE ? OR b.publisher LIKE ? OR a.name LIKE ?)');
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }
    
    if (genre) {
      conditions.push('g.name = ?');
      params.push(genre);
    }
    
    if (author) {
      conditions.push('a.name LIKE ?');
      params.push(`%${author}%`);
    }
    
    if (available === 'true') {
      conditions.push('bc.status = ?');
      params.push('available');
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' GROUP BY b.id';

    // Add sorting
    const validSortFields = ['title', 'publication_year', 'borrow_count'];
    const validSortOrders = ['asc', 'desc'];
    
    const actualSortBy = validSortFields.includes(sortBy) ? sortBy : 'title';
    const actualSortOrder = validSortOrders.includes(sortOrder.toLowerCase()) ? sortOrder.toLowerCase() : 'asc';
    
    query += ` ORDER BY ${actualSortBy} ${actualSortOrder}`;

    // Add pagination
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(DISTINCT b.id) as total FROM books b';
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }
    
    const [books, countResult] = await Promise.all([
      db.all(query, ...params),
      db.get(countQuery, ...params.slice(0, -2)) // Remove limit and offset params
    ]);

    return {
      books,
      pagination: {
        total: countResult.total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(countResult.total / limit)
      }
    };
  }

  static async findById(db, id) {
    const book = await db.get(`
      SELECT 
        b.*,
        GROUP_CONCAT(DISTINCT a.name) as authors,
        GROUP_CONCAT(DISTINCT g.name) as genres,
        COUNT(DISTINCT bc.id) as total_copies,
        SUM(CASE WHEN bc.status = 'available' THEN 1 ELSE 0 END) as available_copies,
        (
          SELECT COUNT(DISTINCT l.id)
          FROM loans l
          JOIN book_copies bc2 ON l.book_copy_id = bc2.id
          WHERE bc2.book_id = b.id
        ) as borrow_count
      FROM books b
      LEFT JOIN book_authors ba ON b.id = ba.book_id
      LEFT JOIN authors a ON ba.author_id = a.id
      LEFT JOIN book_genres bg ON b.id = bg.book_id
      LEFT JOIN genres g ON bg.genre_id = g.id
      LEFT JOIN book_copies bc ON b.id = bc.book_id
      WHERE b.id = ?
      GROUP BY b.id
    `, id);

    if (!book) return null;

    book.copies = await db.all(`
      SELECT * FROM book_copies
      WHERE book_id = ?
    `, id);

    // Get loan history
    book.loanHistory = await db.all(`
      SELECT 
        l.*,
        m.name as member_name
      FROM loans l
      JOIN book_copies bc ON l.book_copy_id = bc.id
      JOIN members m ON l.member_id = m.id
      WHERE bc.book_id = ?
      ORDER BY l.loan_date DESC
      LIMIT 10
    `, id);

    return book;
  }

  static async create(db, { title, isbn, publisher, publication_year, authors, genres, copies }) {
    const bookId = crypto.randomUUID();
    
    await db.run('BEGIN TRANSACTION');
    
    try {
      await db.run(`
        INSERT INTO books (id, title, isbn, publisher, publication_year)
        VALUES (?, ?, ?, ?, ?)
      `, bookId, title, isbn, publisher, publication_year);

      // Insert or get authors
      for (const authorName of authors) {
        let author = await db.get('SELECT id FROM authors WHERE name = ?', authorName);
        
        if (!author) {
          const authorId = crypto.randomUUID();
          await db.run('INSERT INTO authors (id, name) VALUES (?, ?)', authorId, authorName);
          author = { id: authorId };
        }

        await db.run('INSERT INTO book_authors (book_id, author_id) VALUES (?, ?)',
          bookId, author.id);
      }

      // Insert or get genres
      for (const genreName of genres) {
        let genre = await db.get('SELECT id FROM genres WHERE name = ?', genreName);
        
        if (!genre) {
          const genreId = crypto.randomUUID();
          await db.run('INSERT INTO genres (id, name) VALUES (?, ?)', genreId, genreName);
          genre = { id: genreId };
        }

        await db.run('INSERT INTO book_genres (book_id, genre_id) VALUES (?, ?)',
          bookId, genre.id);
      }

      // Create book copies
      for (let i = 0; i < copies; i++) {
        await db.run(`
          INSERT INTO book_copies (id, book_id, status, condition)
          VALUES (?, ?, 'available', 'new')
        `, crypto.randomUUID(), bookId);
      }

      await db.run('COMMIT');
      return this.findById(db, bookId);
    } catch (error) {
      await db.run('ROLLBACK');
      throw error;
    }
  }
}