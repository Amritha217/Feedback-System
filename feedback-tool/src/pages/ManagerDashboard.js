import React, { useEffect, useState } from 'react';
import axios from 'axios';
import jsPDF from "jspdf";
import './ManagerDashboard.css';

function ManagerDashboard() {
  const [employees, setEmployees] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [requests, setRequests] = useState([]);

  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [strengths, setStrengths] = useState("");
  const [improvements, setImprovements] = useState("");
  const [sentiment, setSentiment] = useState("positive");
  const [tags, setTags] = useState("");

  const [editId, setEditId] = useState(null);
  const [editStrengths, setEditStrengths] = useState("");
  const [editImprovements, setEditImprovements] = useState("");
  const [editSentiment, setEditSentiment] = useState("positive");
  const [editTags, setEditTags] = useState("");

  const managerId = Number(localStorage.getItem("userId"));
  const email = localStorage.getItem("email");

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const exportEmployeeFeedbackAsPDF = async (employeeId, employeeEmail) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/feedback/${employeeId}`);
      const feedbacks = response.data.filter(fb => fb.manager_id === managerId);

      const doc = new jsPDF();
      doc.setFontSize(14);
      doc.text(`Feedback given to ${employeeEmail}`, 10, 10);

      if (feedbacks.length === 0) {
        doc.setFontSize(12);
        doc.text("No feedback submitted.", 10, 20);
      } else {
        feedbacks.forEach((fb, index) => {
          const y = 20 + index * 50;
          doc.setFontSize(12);
          doc.text(`Feedback ${index + 1}`, 10, y);
          doc.text(`Strengths: ${fb.strengths}`, 10, y + 6);
          doc.text(`Improvements: ${fb.improvements}`, 10, y + 12);
          doc.text(`Sentiment: ${fb.sentiment}`, 10, y + 18);
          doc.text(`Tags: ${fb.tags || "N/A"}`, 10, y + 24);
          doc.text(`Date: ${new Date(fb.timestamp).toLocaleString()}`, 10, y + 30);
        });
      }

      doc.save(`${employeeEmail}_feedback.pdf`);
    } catch (err) {
      console.error("Error exporting feedback", err);
      alert("❌ Failed to generate PDF");
    }
  };

  useEffect(() => {
    axios.get("http://localhost:5000/api/employees")
      .then(res => setEmployees(res.data))
      .catch(err => console.error("Error fetching employees", err));

    fetchMyFeedback();
    fetchFeedbackRequests();
  }, []);

  const fetchMyFeedback = () => {
    axios.get(`http://localhost:5000/api/manager/${managerId}/feedback`)
      .then(res => setFeedbacks(res.data))
      .catch(err => console.error("Error fetching feedback", err));
  };

  const fetchFeedbackRequests = () => {
    axios.get(`http://localhost:5000/api/requests/${managerId}`)
      .then(res => setRequests(res.data))
      .catch(err => console.error("Error fetching feedback requests", err));
  };

  const handleSubmit = () => {
    if (!selectedEmployee || !strengths.trim() || !improvements.trim()) {
      alert("❗ Please fill in all fields and select an employee.");
      return;
    }

    axios.post("http://localhost:5000/api/feedback", {
      manager_id: managerId,
      employee_id: selectedEmployee,
      strengths,
      improvements,
      sentiment,
      tags
    }).then(() => {
      alert("✅ Feedback submitted");
      setStrengths(""); setImprovements(""); setSentiment("positive");
      setTags(""); setSelectedEmployee("");
      fetchMyFeedback();
      fetchFeedbackRequests();
    }).catch(err => {
      alert("❌ Failed to submit feedback");
      console.error("Error submitting feedback", err);
    });
  };

  const handleEdit = (fb) => {
    setEditId(fb.id);
    setEditStrengths(fb.strengths);
    setEditImprovements(fb.improvements);
    setEditSentiment(fb.sentiment);
    setEditTags(fb.tags || "");
  };

  const handleSave = (id) => {
    axios.put(`http://localhost:5000/api/feedback/${id}`, {
      strengths: editStrengths,
      improvements: editImprovements,
      sentiment: editSentiment,
      tags: editTags
    }).then(() => {
      alert("✅ Feedback updated");
      setEditId(null);
      fetchMyFeedback();
    }).catch(err => {
      alert("❌ Failed to update feedback");
      console.error("Error updating feedback", err);
    });
  };

  const handleRequestRespond = (employeeEmail) => {
    const matched = employees.find(emp => emp.email === employeeEmail);
    if (matched) {
      setSelectedEmployee(matched.id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      alert("⚠️ Employee not found.");
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Welcome, {email} (Manager)</h2>
        <button onClick={handleLogout} className="logout-button">🚪 Logout</button>
      </div>

      {requests.length > 0 && (
        <div className="alert-box">
          <h4>📬 Feedback Requests</h4>
          {requests.map(req => (
            <div key={req.request_id} style={{ marginBottom: "8px" }}>
              ✉️ <strong>{req.employee_email}</strong> requested feedback
              (<i>{new Date(req.timestamp).toLocaleString()}</i>)
              <button
                onClick={() => handleRequestRespond(req.employee_email)}
                className="button"
                style={{ marginLeft: '10px' }}
              >
                Respond
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="card-section">
        <h3>Submit Feedback</h3>
        <select
          value={selectedEmployee}
          onChange={e => setSelectedEmployee(e.target.value)}
        >
          <option value="">Select Employee</option>
          {employees.map(emp => (
            <option key={emp.id} value={emp.id}>{emp.email}</option>
          ))}
        </select>

        <textarea
          placeholder="Strengths"
          value={strengths}
          onChange={e => setStrengths(e.target.value)}
          rows={3}
        />

        <textarea
          placeholder="Improvements"
          value={improvements}
          onChange={e => setImprovements(e.target.value)}
          rows={3}
        />

        <select value={sentiment} onChange={e => setSentiment(e.target.value)}>
          <option value="positive">Positive</option>
          <option value="neutral">Neutral</option>
          <option value="negative">Negative</option>
        </select>

        <input
          type="text"
          placeholder="Tags (comma separated)"
          value={tags}
          onChange={e => setTags(e.target.value)}
        />

        <button onClick={handleSubmit} className="button">Submit Feedback</button>
      </div>

      <div className="card-section">
        <h3>Employees List</h3>
        {employees.map(emp => (
          <div key={emp.id} className="feedback-card">
            <strong>{emp.email}</strong>
            <br />
            <button onClick={() => exportEmployeeFeedbackAsPDF(emp.id, emp.email)} className="button" style={{ marginTop: '6px' }}>
              📄 Export Feedback as PDF
            </button>
          </div>
        ))}
      </div>

      <div className="card-section">
        <h3>Past Feedback Submitted</h3>
        {feedbacks.length === 0 ? (
          <p>No feedback submitted yet.</p>
        ) : (
          feedbacks.map(fb => (
            <div key={fb.id} className={`feedback-card ${editId === fb.id ? "editing" : "manager-feedback"}`}>
              {editId === fb.id ? (
                <>
                  <textarea value={editStrengths} onChange={e => setEditStrengths(e.target.value)} />
                  <textarea value={editImprovements} onChange={e => setEditImprovements(e.target.value)} />
                  <select value={editSentiment} onChange={e => setEditSentiment(e.target.value)}>
                    <option value="positive">Positive</option>
                    <option value="neutral">Neutral</option>
                    <option value="negative">Negative</option>
                  </select>
                  <input
                    type="text"
                    value={editTags}
                    onChange={e => setEditTags(e.target.value)}
                    placeholder="Tags"
                  />
                  <div className="edit-buttons">
                    <button onClick={() => handleSave(fb.id)} className="button">Save</button>
                    <button onClick={() => setEditId(null)} className="button" style={{ backgroundColor: "#6c757d", marginLeft: '10px' }}>Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <strong>To:</strong> Employee #{fb.employee_id}<br />
                  <strong>Strengths:</strong> {fb.strengths}<br />
                  <strong>Improvements:</strong> {fb.improvements}<br />
                  <strong>Sentiment:</strong> {fb.sentiment}<br />
                  <strong>Tags:</strong> {fb.tags || "None"}<br />
                  <small><i>{new Date(fb.timestamp).toLocaleString()}</i></small><br />
                  {fb.comment && (
                    <div className="comment-display" style={{ marginTop: '10px', padding: '8px', backgroundColor: '#f1f1f1', borderRadius: '5px' }}>
                      💬 <strong>Employee Comment:</strong><br />
                      {fb.comment.content}
                      <br />
                      <small><i>{new Date(fb.comment.timestamp).toLocaleString()}</i></small>
                    </div>
                  )}
                  <button onClick={() => handleEdit(fb)} className="button" style={{ marginTop: '10px' }}>Edit</button>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ManagerDashboard;
