import sqlite3

conn = sqlite3.connect("db.sqlite3")
cur = conn.cursor()

# Add 'acknowledged' column if not exists
try:
    cur.execute("ALTER TABLE feedback ADD COLUMN acknowledged INTEGER DEFAULT 0")
    print(" Column 'acknowledged' added.")
except sqlite3.OperationalError as e:
    print(" Column may already exist:", e)

conn.commit()
conn.close()
