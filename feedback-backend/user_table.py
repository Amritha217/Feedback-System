import sqlite3
conn = sqlite3.connect("db.sqlite3")
cur = conn.cursor()

#  Drop old users table (removes all user data!)
cur.execute("DROP TABLE IF EXISTS users")

#  Recreate table with email, password, role
cur.execute("""
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL
)
""")

conn.commit()
conn.close()
print(" Table recreated successfully.")
