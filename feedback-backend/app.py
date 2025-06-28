from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
from datetime import datetime
import hashlib

app = Flask(__name__)
CORS(app)


def connect_db():
    return sqlite3.connect("db.sqlite3")

def initialize_db():
    conn = connect_db()
    cur = conn.cursor()

    cur.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE,
            password TEXT,
            role TEXT
        )
    ''')

    cur.execute('''
        CREATE TABLE IF NOT EXISTS feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            manager_id INTEGER,
            employee_id INTEGER,
            strengths TEXT,
            improvements TEXT,
            sentiment TEXT,
            tags TEXT,  -- ✅ Added tags
            timestamp TEXT,
            acknowledged INTEGER DEFAULT 0
        )
    ''')

    cur.execute('''
        CREATE TABLE IF NOT EXISTS feedback_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_id INTEGER,
            manager_id INTEGER,
            timestamp TEXT
        )
    ''')

    cur.execute('''
        CREATE TABLE IF NOT EXISTS peer_feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_id INTEGER,
            receiver_id INTEGER,
            content TEXT,
            timestamp TEXT,
            anonymous INTEGER DEFAULT 0
        )
    ''')

    # Comments table
    cur.execute('''
            CREATE TABLE IF NOT EXISTS comments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                feedback_id INTEGER,
                employee_id INTEGER,
                content TEXT,
                timestamp TEXT
             )
    ''')


    conn.commit()
    conn.close()

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")
    requested_role = data.get("role")

    hashed_password = hashlib.sha256(password.encode()).hexdigest()

    conn = connect_db()
    cur = conn.cursor()
    cur.execute("SELECT id, role FROM users WHERE email = ? AND password = ?", (email, hashed_password))
    row = cur.fetchone()
    conn.close()

    if row:
        user_id, actual_role = row
        if actual_role != requested_role:
            return jsonify({"error": f"You are not a {requested_role}. Please choose the correct role."}), 403
        return jsonify({"userId": user_id, "role": actual_role, "email": email})
    else:
        return jsonify({"error": "Invalid email or password"}), 401

@app.route("/api/employees", methods=["GET"])
def list_employees():
    conn = connect_db()
    cur = conn.cursor()
    cur.execute("SELECT id, email FROM users WHERE role = 'employee'")
    rows = cur.fetchall()
    conn.close()
    return jsonify([{"id": r[0], "email": r[1]} for r in rows])

@app.route("/api/feedback", methods=["POST"])
def submit_feedback():
    data = request.get_json()
    conn = connect_db()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO feedback (manager_id, employee_id, strengths, improvements, sentiment, tags, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        data["manager_id"],
        data["employee_id"],
        data["strengths"],
        data["improvements"],
        data["sentiment"],
        data.get("tags", ""),  # ✅ Tags support
        datetime.utcnow().isoformat()
    ))
    conn.commit()
    conn.close()
    return jsonify({"message": "Feedback submitted"})

@app.route("/api/feedback/<int:employee_id>", methods=["GET"])
def get_feedback(employee_id):
    conn = connect_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT id, manager_id, strengths, improvements, sentiment, timestamp, acknowledged
        FROM feedback
        WHERE employee_id = ?
        ORDER BY timestamp DESC
    """, (employee_id,))
    feedback_rows = cur.fetchall()

    feedback_list = []

    for r in feedback_rows:
        feedback_id = r[0]
        # fetch associated comment
        cur.execute("""
            SELECT content, timestamp FROM comments WHERE feedback_id = ?
        """, (feedback_id,))
        comment_row = cur.fetchone()
        comment = {
            "content": comment_row[0],
            "timestamp": comment_row[1]
        } if comment_row else None

        feedback_list.append({
            "id": r[0],
            "manager_id": r[1],
            "strengths": r[2],
            "improvements": r[3],
            "sentiment": r[4],
            "timestamp": r[5],
            "acknowledged": r[6],
            "comment": comment
        })

    conn.close()
    return jsonify(feedback_list)


@app.route("/api/feedback/<int:feedback_id>/acknowledge", methods=["PUT"])
def acknowledge_feedback(feedback_id):
    conn = connect_db()
    cur = conn.cursor()
    cur.execute("UPDATE feedback SET acknowledged = 1 WHERE id = ?", (feedback_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Feedback acknowledged"}), 200

@app.route("/api/feedback/<int:feedback_id>", methods=["PUT"])
def update_feedback(feedback_id):
    data = request.get_json()
    conn = connect_db()
    cur = conn.cursor()
    cur.execute("""
        UPDATE feedback
        SET strengths = ?, improvements = ?, sentiment = ?, tags = ?, timestamp = ?
        WHERE id = ?
    """, (
        data["strengths"],
        data["improvements"],
        data["sentiment"],
        data.get("tags", ""),  # ✅ Updating tags
        datetime.utcnow().isoformat(),
        feedback_id
    ))
    conn.commit()
    conn.close()
    return jsonify({"message": "Feedback updated"}), 200

@app.route("/api/manager/<int:manager_id>/feedback", methods=["GET"])
def get_manager_feedback(manager_id):
    conn = connect_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT id, employee_id, strengths, improvements, sentiment, tags, timestamp
        FROM feedback
        WHERE manager_id = ?
        ORDER BY timestamp DESC
    """, (manager_id,))
    feedback_rows = cur.fetchall()

    feedback_list = []

    for row in feedback_rows:
        feedback_id = row[0]
        
        # Fetch associated comment (if any)
        cur.execute("SELECT content, timestamp FROM comments WHERE feedback_id = ?", (feedback_id,))
        comment_row = cur.fetchone()
        comment = {
            "content": comment_row[0],
            "timestamp": comment_row[1]
        } if comment_row else None

        feedback_list.append({
            "id": feedback_id,
            "employee_id": row[1],
            "strengths": row[2],
            "improvements": row[3],
            "sentiment": row[4],
            "tags": row[5],
            "timestamp": row[6],
            "comment": comment
        })

    conn.close()
    return jsonify(feedback_list)


@app.route("/api/feedback/unread/<int:employee_id>", methods=["GET"])
def get_unread_feedback_count(employee_id):
    conn = connect_db()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM feedback WHERE employee_id = ? AND acknowledged = 0", (employee_id,))
    count = cur.fetchone()[0]
    conn.close()
    return jsonify({"unread_count": count})

@app.route("/api/request-feedback", methods=["POST"])
def request_feedback():
    data = request.get_json()
    conn = connect_db()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO feedback_requests (employee_id, manager_id, timestamp)
        VALUES (?, ?, ?)
    """, (
        data["employee_id"],
        data["manager_id"],
        datetime.utcnow().isoformat()
    ))
    conn.commit()
    conn.close()
    return jsonify({"message": "Feedback request submitted"})

@app.route("/api/requests/<int:manager_id>", methods=["GET"])
def get_feedback_requests(manager_id):
    conn = connect_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT r.id, u.email, r.timestamp
        FROM feedback_requests r
        JOIN users u ON r.employee_id = u.id
        WHERE r.manager_id = ?
        ORDER BY r.timestamp DESC
    """, (manager_id,))
    rows = cur.fetchall()
    conn.close()
    return jsonify([
        {"request_id": r[0], "employee_email": r[1], "timestamp": r[2]} for r in rows
    ])

@app.route("/api/peer-feedback/<int:employee_id>", methods=["GET"])
def get_peer_feedback(employee_id):
    conn = connect_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT content, timestamp, anonymous, sender_id
        FROM peer_feedback
        WHERE receiver_id = ?
        ORDER BY timestamp DESC
    """, (employee_id,))
    rows = cur.fetchall()
    conn.close()
    return jsonify([
        {
            "content": r[0],
            "timestamp": r[1],
            "anonymous": r[2],
            "sender_id": None if r[2] else r[3]
        } for r in rows
    ])


@app.route("/api/feedback/<int:feedback_id>/comment", methods=["POST"])
def add_comment(feedback_id):
    data = request.get_json()
    content = data.get("content")
    employee_id = data.get("employee_id")

    conn = connect_db()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO comments (feedback_id, employee_id, content, timestamp)
        VALUES (?, ?, ?, ?)
    """, (feedback_id, employee_id, content, datetime.utcnow().isoformat()))
    conn.commit()
    conn.close()

    return jsonify({"message": "Comment added"}), 200



@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response



if __name__ == "__main__":
    initialize_db()
    app.run(debug=True)
