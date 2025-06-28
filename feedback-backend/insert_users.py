import sqlite3
import hashlib

users = [
    ("manager@example.com", "manager", "manager123"),
    ("alice@example.com", "employee", "alice123"),
    ("bob@example.com", "employee", "bob123")
]

conn = sqlite3.connect("db.sqlite3")
cur = conn.cursor()

for email, role, password in users:
    hashed_pw = hashlib.sha256(password.encode()).hexdigest()
    cur.execute("INSERT INTO users (email, password, role) VALUES (?, ?, ?)", (email, hashed_pw, role))

conn.commit()
conn.close()
print(" Users inserted")
