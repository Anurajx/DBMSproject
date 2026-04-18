const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config({ override: true });

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize Database Tables
const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS books (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        author VARCHAR(255) NOT NULL,
        published_year INTEGER,
        quantity INTEGER DEFAULT 1,
        available_quantity INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS members (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20),
        membership_date DATE DEFAULT CURRENT_DATE
      );

      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20),
        hire_date DATE DEFAULT CURRENT_DATE
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
        member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
        issue_date DATE DEFAULT CURRENT_DATE,
        due_date DATE,
        return_date DATE,
        status VARCHAR(50) DEFAULT 'issued'
      );
    `);
    
    // Safely add the available_quantity column if this is a legacy table from before the update
    await pool.query(`ALTER TABLE books ADD COLUMN IF NOT EXISTS available_quantity INTEGER;`);
    await pool.query(`ALTER TABLE books ADD COLUMN IF NOT EXISTS book_section VARCHAR(50) DEFAULT 'General';`);
    await pool.query(`ALTER TABLE books ADD COLUMN IF NOT EXISTS unique_id VARCHAR(50);`);
    
    // Auto-update legacy books to have available_quantity if they don't have it set (which is true for new columns)
    await pool.query(`UPDATE books SET available_quantity = quantity WHERE available_quantity IS NULL;`);
    
    // Auto-update legacy books to have unique_id
    await pool.query(`UPDATE books SET unique_id = 'LIB-LEGACY-' || id WHERE unique_id IS NULL;`);
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_books_unique_id ON books(unique_id);`);
    
    // Members unique_id setup
    await pool.query(`ALTER TABLE members ADD COLUMN IF NOT EXISTS unique_id VARCHAR(50);`);
    await pool.query(`UPDATE members SET unique_id = 'MEM-LEGACY-' || id WHERE unique_id IS NULL;`);
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_members_unique_id ON members(unique_id);`);

    // Employees unique_id setup
    await pool.query(`ALTER TABLE employees ADD COLUMN IF NOT EXISTS unique_id VARCHAR(50);`);
    await pool.query(`UPDATE employees SET unique_id = 'EMP-LEGACY-' || id WHERE unique_id IS NULL;`);
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_unique_id ON employees(unique_id);`);
    
    console.log("Database initialized successfully with relations.");
  } catch (err) {
    console.error("Error initializing database:", err.message);
  }
};
initDB();

// --- BOOKS ROUTES ---
app.get('/api/books', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM books ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/books', async (req, res) => {
  try {
    const { title, author, published_year, quantity, book_section } = req.body;
    // Generate unique ID like LIB-1A-78FC
    const unique_id = 'LIB-' + (book_section ? book_section.substring(0, 2) + '-' : '') + Math.random().toString(36).substr(2, 6).toUpperCase();
    
    const newBook = await pool.query(
      'INSERT INTO books (title, author, published_year, quantity, available_quantity, book_section, unique_id) VALUES ($1, $2, $3, $4, $4, $5, $6) RETURNING *',
      [title, author, published_year, quantity, book_section || 'General', unique_id]
    );
    res.json(newBook.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/books/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM books WHERE id = $1', [req.params.id]);
    res.json({ message: "Book deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// --- MEMBERS ROUTES ---
app.get('/api/members', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM members ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/members', async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const unique_id = 'MEM-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    const newMember = await pool.query(
      'INSERT INTO members (name, email, phone, unique_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, phone, unique_id]
    );
    res.json(newMember.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/members/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM members WHERE id = $1', [req.params.id]);
    res.json({ message: "Member deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// --- EMPLOYEES ROUTES ---
app.get('/api/employees', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM employees ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/employees', async (req, res) => {
  try {
    const { name, role, email, phone } = req.body;
    const unique_id = 'EMP-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    const newEmployee = await pool.query(
      'INSERT INTO employees (name, role, email, phone, unique_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, role, email, phone, unique_id]
    );
    res.json(newEmployee.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/employees/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM employees WHERE id = $1', [req.params.id]);
    res.json({ message: "Employee deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// --- TRANSACTIONS ROUTES ---
app.get('/api/transactions', async (req, res) => {
  try {
    const query = `
      SELECT t.*, b.title as book_title, m.name as member_name 
      FROM transactions t
      JOIN books b ON t.book_id = b.id
      JOIN members m ON t.member_id = m.id
      ORDER BY t.id DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/transactions/issue', async (req, res) => {
  const { book_id, member_id, due_date } = req.body;
  try {
    await pool.query('BEGIN'); // Start SQL Transaction

    // Check availability
    const bookCheck = await pool.query('SELECT available_quantity FROM books WHERE id = $1', [book_id]);
    if (bookCheck.rows.length === 0 || bookCheck.rows[0].available_quantity <= 0) {
       await pool.query('ROLLBACK');
       return res.status(400).json({ error: 'Book is currently out of stock' });
    }

    // Check member
    const memCheck = await pool.query('SELECT id FROM members WHERE id = $1', [member_id]);
    if (memCheck.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(400).json({ error: 'Member not found' });
    }

    // Insert transaction
    const newTx = await pool.query(
      'INSERT INTO transactions (book_id, member_id, due_date, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [book_id, member_id, due_date, 'issued']
    );

    // Update book availability
    await pool.query('UPDATE books SET available_quantity = available_quantity - 1 WHERE id = $1', [book_id]);
    
    await pool.query('COMMIT');
    res.json(newTx.rows[0]);
  } catch (err) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/transactions/return/:id', async (req, res) => {
  try {
    await pool.query('BEGIN');
    const txId = req.params.id;

    // Check transaction
    const txCheck = await pool.query('SELECT book_id, status FROM transactions WHERE id = $1', [txId]);
    if (txCheck.rows.length === 0 || txCheck.rows[0].status === 'returned') {
       await pool.query('ROLLBACK');
       return res.status(400).json({ error: 'Invalid transaction or already returned' });
    }

    const book_id = txCheck.rows[0].book_id;

    // Update transaction
    await pool.query(
      'UPDATE transactions SET status = $1, return_date = CURRENT_DATE WHERE id = $2',
      ['returned', txId]
    );

    // Update book availability
    await pool.query('UPDATE books SET available_quantity = available_quantity + 1 WHERE id = $1', [book_id]);

    await pool.query('COMMIT');
    res.json({ message: "Book returned successfully" });
  } catch (err) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
