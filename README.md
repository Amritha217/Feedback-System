# 📝 Feedback System

A simple internal feedback tool for structured communication between *managers* and *employees*.

---

## 🚀 Features

### ✅ Core Features
- *User authentication* (Manager & Employee roles)
- *Feedback submission* (structured format with sentiment & tags)
- *Dashboard* for both managers and employees
- *Feedback history and acknowledgment*
- *Employees can request feedback*
- *Anonymous peer feedback*
- *Export feedback as PDF*
- *Logout functionality*

---

## ⚙️ Tech Stack

| Frontend            | Backend              | Database  |
|---------------------|----------------------|-----------|
| React.js (with Axios) | Flask (Python 3)      | SQLite    |

---

## 🧠 Design Decisions

- Used *SQLite* for simplicity and portability
- *Flask API* handles RESTful endpoints
- All passwords are securely stored using *SHA-256 hashing*
- *CORS enabled* to allow frontend-backend interaction
- Anonymous peer feedback supported
- Export functionality implemented using *jsPDF*

---

## 🛠️ Setup Instructions

### 🔧 Backend Setup

1. Clone the repo:
   bash
   git clone https://github.com/Amritha217/Feedback-System.git
   cd Feedback-System/feedback-backend

2. (Optional but recommended) Create virtual environment:
   bash
   python -m venv venv
   venv\Scripts\activate   # On Windows

3. Install dependencies:
      pip install -r requirements.txt

4. Run the server:
      python app.py


### 🌐 Frontend Setup

1. Go to the frontend directory:
      cd ../feedback-frontend

2. Install dependencies:
      npm install

3. Start the React app:
      npm start
