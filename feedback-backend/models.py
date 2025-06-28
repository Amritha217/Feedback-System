import sqlite3

conn = sqlite3.connect("db.sqlite3")
cur = conn.cursor()

# Drop old tables (optional but recommended during reset)
cur.execute("DROP TABLE IF EXISTS users")
cur.execute("DROP TABLE IF EXISTS feedback")

# ✅ Create users table with password
cur.execute("""
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL
)
""")

# ✅ Create feedback table with acknowledged
cur.execute("""
CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    manager_id INTEGER,
    employee_id INTEGER,
    strengths TEXT,
    improvements TEXT,
    sentiment TEXT,
    tags TEXT,
    timestamp TEXT,
    acknowledged INTEGER DEFAULT 0
)
""")

conn.commit()
conn.close()
print("Database setup complete!")
