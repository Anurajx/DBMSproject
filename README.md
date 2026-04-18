# 📚 Central Library Management System (DBMS Project)

A robust, full-stack Relational Database Management System (DBMS) built to manage a library's Books Inventory, Member base, Staff operations, and strict book circulation rules.

The system is engineered utilizing a strictly decoupled architecture: a **Node.js/Express API Backend** communicating with an ultra-premium **Vite/React Frontend** dashboard, backed by a persistent Cloud **PostgreSQL** Database.

---

## 🛠️ Technology Stack
*   **Frontend**: React.js (Vite), CSS Custom Properties (Shadcn aesthetic), Lucide-React Iterations.
*   **Backend**: Node.js, Express.js.
*   **Database Engine**: Relational PostgreSQL (Hosted on Render).
*   **Network & Security**: Axios, CORS, Environment Variable secrets.

---

## 🗄️ Database Architecture & SQL Mechanics

The true core of this project lies in its carefully mapped Relational Schema built strictly over **PostgreSQL**. Here are the explicit mechanics and queries employed:

### 1. DDL: Schema Creation & Constraints
Three core tables form the relationships (`books`, `members`, `employees`) and one bridging table binds them (`transactions`):

```sql
-- Books Schema
CREATE TABLE books (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  published_year INTEGER,
  quantity INTEGER DEFAULT 1,
  available_quantity INTEGER DEFAULT 1,
  book_section VARCHAR(50) DEFAULT 'General',
  unique_id VARCHAR(50) UNIQUE 
);

-- Active Transactions (Relational Map)
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
  member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
  issue_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  return_date DATE,
  status VARCHAR(50) DEFAULT 'issued'
);
```
**Key Concepts Used:**
*   `SERIAL PRIMARY KEY`: Native Postgres auto-increment identifier.
*   `REFERENCES ... ON DELETE CASCADE`: Enforces strict **Referential Integrity**. If a specific book or member is purged from the database, all interconnected history mapping to that ID is cascadingly deleted.

### 2. ACID Transactions (Concurrency & Data Integrity)
When a book is issued, two things must happen identically: an Issue Record is created, and the Book `available_quantity` drops. If one fails, the other cannot save.
This project uses **ACID Database Transactions** via native SQL locks (`BEGIN` & `ROLLBACK`):

```sql
BEGIN;

-- 1. Initial Check
SELECT available_quantity FROM books WHERE id = $1; 

-- 2. DML Insert
INSERT INTO transactions (book_id, member_id, due_date, status) 
VALUES ($1, $2, $3, 'issued');

-- 3. Inventory Decoupler
UPDATE books SET available_quantity = available_quantity - 1 WHERE id = $1;

COMMIT; -- Runs perfectly, or triggers ROLLBACK if any step fails.
```

### 3. Dynamic Indexing & Migration (ALTER TABLE)
To prevent legacy schema crashes when updating the live system, dynamic runtime updates were utilized:
```sql
ALTER TABLE members ADD COLUMN IF NOT EXISTS unique_id VARCHAR(50);

CREATE UNIQUE INDEX IF NOT EXISTS idx_members_unique_id ON members(unique_id);
```

### 4. General DML & Queries
Standard CRUD logic utilizing highly optimized parameter-mapped queries to prevent **SQL Injection Attack Vectors**:
*   **Search / Fetch**: `SELECT * FROM employees ORDER BY id DESC;`
*   **Creation mapping**: `INSERT INTO members (name, email, phone, unique_id) VALUES ($1, $2, $3, $4) RETURNING *;`
*   **Deletion**: `DELETE FROM books WHERE id = $1;`

---

## 💻 System Capabilities

1.  **Universal Search Engine Features:** Live front-end filtering spanning across distinct object signatures (Unique `LIB-XX` ID, titles, location section codes).
2.  **Concurrency Protected Book Inventories:** Safe arithmetic checking completely preventing a book from reducing from 0 -> -1 available copies natively down to the SQL level.
3.  **Modern Dashboards:** Professional UI UX mapped dynamically via Vite server hosting logic directly hitting secured HTTP Rest Endpoints.
4.  **Auto Unique Sequencing**: System natively generates `LIB-...`, `EMP-...` primary tags upon any INSERT queries logic binding perfectly to table unique-constraints. 

---

## 🏃 Running The Project Locally

The project uses two discrete execution paths:

**1. The Database Connector (Backend in terminal #1):**
```bash
cd backend
npm install
# Create a .env file locally assigning DATABASE_URL
npm start
```
*Note: Your PostgreSQL .env keys are actively ignored securely thanks to .gitignore configuration.*

**2. The Client UI (Frontend in terminal #2):**
```bash
cd frontend
npm install
npm run dev
```
