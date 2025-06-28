import sqlite3
import os

db_path = "db.sqlite3"
print("Clearing DB at:", os.path.abspath(db_path))  # ✅ Confirm location

conn = sqlite3.connect(db_path)
cur = conn.cursor()

cur.execute("DELETE FROM feedback")
conn.commit()
conn.close()

print("✅ All feedback entries deleted.")
