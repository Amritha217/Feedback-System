import sqlite3
conn = sqlite3.connect("db.sqlite3")
cur = conn.cursor()
cur.execute("ALTER TABLE feedback ADD COLUMN tags TEXT")
conn.commit()
conn.close()
