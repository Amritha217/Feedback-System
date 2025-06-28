import React, { useEffect, useState } from 'react';
import axios from 'axios';
import jsPDF from "jspdf";
import './EmployeeDashboard.css';

function EmployeeDashboard() {
  const [myFeedback, setMyFeedback] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [peerFeedback, setPeerFeedback] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [peerTargetId, setPeerTargetId] = useState("");
  const [peerContent, setPeerContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  const email = localStorage.getItem('email');
  const currentUserId = Number(localStorage.getItem('userId'));
  const managerId = 1;

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const exportAsPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(`Feedback for ${email}`, 10, 10);

    myFeedback.forEach((fb, index) => {
      const y = 20 + index * 40;
      doc.setFontSize(12);
      doc.text(`Feedback ${index + 1}:`, 10, y);
      doc.text(`Strengths: ${fb.strengths}`, 10, y + 6);
      doc.text(`Improvements: ${fb.improvements}`, 10, y + 12);
      doc.text(`Sentiment: ${fb.sentiment}`, 10, y + 18);
      doc.text(`Tags: ${fb.tags || "N/A"}`, 10, y + 24);
    });

    doc.save("feedback.pdf");
  };

  useEffect(() => {
    if (currentUserId) {
      fetchFeedback();
      fetchUnreadCount();
      fetchPeerFeedback();

      axios.get("http://localhost:5000/api/employees")
        .then(res => {
          const others = res.data.filter(emp => emp.id !== currentUserId);
          setEmployees(others);
        })
        .catch(err => console.error("Error fetching employees", err));
    }
  }, [currentUserId]);

  const fetchFeedback = () => {
    axios.get(`http://localhost:5000/api/feedback/${currentUserId}`)
      .then(res => {
        const updated = res.data.map(fb => ({ ...fb, newComment: "" }));
        setMyFeedback(updated);
      })
      .catch(err => console.error("Error fetching feedback", err));
  };

  const fetchUnreadCount = () => {
    axios.get(`http://localhost:5000/api/feedback/unread/${currentUserId}`)
      .then(res => setUnreadCount(res.data.unread_count))
      .catch(err => console.error("Error fetching unread count", err));
  };

  const fetchPeerFeedback = () => {
    axios.get(`http://localhost:5000/api/peer-feedback/${currentUserId}`)
      .then(res => setPeerFeedback(res.data))
      .catch(err => console.error("Error fetching peer feedback", err));
  };

  const handleAcknowledge = async (feedbackId) => {
    try {
      await axios.put(`http://localhost:5000/api/feedback/${feedbackId}/acknowledge`);
      fetchFeedback();
      fetchUnreadCount();
    } catch (err) {
      console.error("Error acknowledging feedback", err);
    }
  };

  const submitComment = (feedbackId, content, index) => {
    if (!content || !content.trim()) {
      alert("Comment cannot be empty");
      return;
    }

    axios.post(`http://localhost:5000/api/feedback/${feedbackId}/comment`, {
      content,
      employee_id: currentUserId
    }).then(() => {
      alert("✅ Comment submitted");
      fetchFeedback();
    }).catch(err => {
      console.error("Error submitting comment", err);
      alert("❌ Failed to submit comment");
    });
  };

  const handleRequestFeedback = () => {
    axios.post("http://localhost:5000/api/request-feedback", {
      employee_id: currentUserId,
      manager_id: managerId
    }).then(() => {
      alert("✅ Feedback request sent!");
    }).catch(err => {
      console.error("Error sending request", err);
      alert("❌ Failed to send request");
    });
  };

  const handleSubmitPeerFeedback = () => {
    if (!peerTargetId || !peerContent.trim()) {
      alert("Please select a colleague and write some feedback.");
      return;
    }

    axios.post("http://localhost:5000/api/peer-feedback", {
      sender_id: currentUserId,
      receiver_id: peerTargetId,
      content: peerContent,
      anonymous: isAnonymous
    })
      .then(() => {
        alert("✅ Peer feedback sent!");
        setPeerContent("");
        setPeerTargetId("");
        setIsAnonymous(false);
      })
      .catch(err => {
        console.error("Error submitting peer feedback", err);
        alert("❌ Failed to submit peer feedback.");
      });
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Welcome, {email}</h2>
        <button onClick={handleLogout} className="logout-button">🚪 Logout</button>
      </div>

      {unreadCount > 0 && (
        <div className="alert-box">
          🔔 You have {unreadCount} unread feedback{unreadCount > 1 ? 's' : ''}!
        </div>
      )}

      <button onClick={handleRequestFeedback} className="button">➕ Request Feedback</button>

      <div className="card-section">
        <h3>Give Peer Feedback</h3>
        <select
          value={peerTargetId}
          onChange={(e) => setPeerTargetId(e.target.value)}
        >
          <option value="">Select a colleague</option>
          {employees.map(emp => (
            <option key={emp.id} value={emp.id}>{emp.email}</option>
          ))}
        </select>

        <textarea
          value={peerContent}
          onChange={(e) => setPeerContent(e.target.value)}
          rows={4}
          placeholder="Write your feedback here..."
        />

        <label>
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
          /> Submit anonymously
        </label>

        <button
          onClick={handleSubmitPeerFeedback}
          className="button"
          style={{ backgroundColor: '#17a2b8' }}
        >
          Submit Peer Feedback
        </button>
      </div>

      <div className="card-section">
        <h3>Your Feedback Timeline</h3>
        {myFeedback.length === 0 ? (
          <p>No manager feedback yet.</p>
        ) : (
          myFeedback.map((fb, index) => (
            <div key={index} className="feedback-card manager-feedback">
              <strong>Strengths:</strong> {fb.strengths}<br />
              <strong>Improvements:</strong> {fb.improvements}<br />
              <strong>Sentiment:</strong> {fb.sentiment}<br />
              <small><i>{new Date(fb.timestamp).toLocaleString()}</i></small><br />
              {fb.acknowledged ? (
                <p style={{ color: 'green', fontWeight: 'bold' }}>✅ Acknowledged</p>
              ) : (
                <button
                  onClick={() => handleAcknowledge(fb.id)}
                  className="acknowledge-button"
                >
                  Acknowledge
                </button>
              )}

              {fb.comment ? (
                <div className="comment-display">
                  💬 <strong>Your Comment:</strong><br />
                  {fb.comment.content}
                  <br />
                  <small><i>{new Date(fb.comment.timestamp).toLocaleString()}</i></small>
                </div>
              ) : (
                <div className="comment-section">
                  <textarea
                    placeholder="Add a comment..."
                    value={fb.newComment}
                    onChange={(e) => {
                      const updated = [...myFeedback];
                      updated[index].newComment = e.target.value;
                      setMyFeedback(updated);
                    }}
                    rows={2}
                    style={{ width: "100%", marginTop: "10px" }}
                  />
                  <button
                    onClick={() => submitComment(fb.id, fb.newComment, index)}
                    className="button"
                    style={{ backgroundColor: '#007bff', marginTop: '5px' }}
                  >
                    💬 Submit Comment
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <button onClick={exportAsPDF} className="export-button">
        📄 Export as PDF
      </button>

      <div className="card-section">
        <h3>Peer Feedback Received</h3>
        {peerFeedback.length === 0 ? (
          <p>No peer feedback yet.</p>
        ) : (
          peerFeedback.map((pf, index) => (
            <div key={index} className="feedback-card peer-feedback">
              <p>{pf.content}</p>
              <small>
                {pf.anonymous
                  ? <i>Anonymous</i>
                  : <i>From User ID: {pf.sender_id}</i>}
                <br />
                {new Date(pf.timestamp).toLocaleString()}
              </small>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default EmployeeDashboard;
