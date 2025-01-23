/*
  # Library Management System Schema

  1. New Tables
    - `books`
      - `id` (uuid, primary key)
      - `title` (text)
      - `author` (text)
      - `isbn` (text, unique)
      - `quantity` (integer)
      - `created_at` (timestamp)
    
    - `members`
      - `id` (uuid, primary key)
      - `name` (text)
      - `email` (text, unique)
      - `phone` (text)
      - `created_at` (timestamp)
    
    - `loans`
      - `id` (uuid, primary key)
      - `book_id` (uuid, foreign key)
      - `member_id` (uuid, foreign key)
      - `loan_date` (timestamp)
      - `due_date` (timestamp)
      - `return_date` (timestamp)
      - `status` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Books table
CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author text NOT NULL,
  isbn text UNIQUE NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users full access to books"
  ON books
  FOR ALL
  TO authenticated
  USING (true);

-- Members table
CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users full access to members"
  ON members
  FOR ALL
  TO authenticated
  USING (true);

-- Loans table
CREATE TABLE IF NOT EXISTS loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid REFERENCES books(id) NOT NULL,
  member_id uuid REFERENCES members(id) NOT NULL,
  loan_date timestamptz NOT NULL,
  due_date timestamptz NOT NULL,
  return_date timestamptz,
  status text NOT NULL CHECK (status IN ('active', 'returned', 'overdue')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE loans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users full access to loans"
  ON loans
  FOR ALL
  TO authenticated
  USING (true);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
CREATE INDEX IF NOT EXISTS idx_books_author ON books(author);
CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_loans_due_date ON loans(due_date);