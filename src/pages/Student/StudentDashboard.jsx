import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axiosClient from '../../api/axiosClient';
import { auth } from '../../config/firebase';
import { signOut } from 'firebase/auth';

export default function StudentDashboard() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('results');
  
  // --- Results State ---
  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [semester, setSemester] = useState(1);

  // --- Payment State ---
  const [paySemester, setPaySemester] = useState(2); // Defaults to next semester
  const [payAmount, setPayAmount] = useState(15000);
  const [payLoading, setPayLoading] = useState(false);
  const [payMessage, setPayMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    if (activeTab === 'results') {
      fetchResults(semester);
    }
  }, [semester, activeTab]);

  const showFeedback = (text, type = 'success') => {
    setPayMessage({ text, type });
    setTimeout(() => setPayMessage({ text: '', type: '' }), 7000);
  };

  // --- Results & Reevaluation Logic ---
  const fetchResults = async (sem) => {
    setLoading(true);
    setError('');
    try {
      const response = await axiosClient.get(`/results/${sem}`);
      setResultData(response.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setError(`No published results found for Semester ${sem}.`);
      } else {
        setError('Failed to fetch results. Please try again later.');
      }
      setResultData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await axiosClient.get(`/results/${semester}/download`);
      alert(`Download link generated: ${response.data.download_url}`);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to generate download link.');
    }
  };

  const handleRequestReevaluation = async (subjectCode) => {
    if (!window.confirm(`Are you sure you want to request a reevaluation for ${subjectCode}? This can only be done once.`)) return;
    try {
      const res = await axiosClient.post(`/results/${semester}/request-reevaluation`, {
        subject_code: subjectCode
      });
      alert(res.data.message);
      fetchResults(semester);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to request reevaluation.');
    }
  };

  // --- Payment Logic ---
  const handleInitiatePayment = async (e) => {
    e.preventDefault();
    setPayLoading(true);
    setPayMessage({ text: '', type: '' });

    try {
      const res = await axiosClient.post('/payments/initiate', {
        amount: Number(payAmount),
        semester: Number(paySemester),
        purpose: "SEMESTER_FEE"
      });
      
      // Handle the recovery attempt or existing intent messages gracefully
      if (res.data.status === 'SUCCESS') {
        showFeedback(res.data.message, 'success');
      } else {
        showFeedback(`Payment initiated. Intent Status: ${res.data.status}. (Payment ID: ${res.data.payment_id})`, 'pending');
      }
    } catch (err) {
      showFeedback(err.response?.data?.detail || 'Failed to initiate payment.', 'error');
    } finally {
      setPayLoading(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <nav className="navbar">
        <h2>Campus Portal | Student</h2>
        <div className="nav-actions">
          <span>{currentUser?.email}</span>
          <button onClick={() => signOut(auth)} className="btn-secondary">Logout</button>
        </div>
      </nav>

      <main className="dashboard-content">
        <header className="page-header">
          <div className="tab-navigation" style={{ marginBottom: 0, borderBottom: 'none' }}>
            <button className={activeTab === 'results' ? 'tab active' : 'tab'} onClick={() => setActiveTab('results')}>Academic Results</button>
            <button className={activeTab === 'payments' ? 'tab active' : 'tab'} onClick={() => setActiveTab('payments')}>Fee Payments</button>
          </div>
        </header>

        {activeTab === 'results' ? (
          <>
            <div className="semester-selector" style={{ marginBottom: '1.5rem' }}>
              <label>View Semester: </label>
              <select value={semester} onChange={(e) => setSemester(Number(e.target.value))}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(num => <option key={num} value={num}>Semester {num}</option>)}
              </select>
            </div>

            {loading ? (
              <div className="loading-state">Loading your academic records...</div>
            ) : error ? (
              <div className="alert alert-error">{error}</div>
            ) : resultData?.data ? (
              <div className="results-card">
                <div className="student-info">
                  <p><strong>Name:</strong> {resultData.data.full_name}</p>
                  <p><strong>Roll Number:</strong> {resultData.data.roll_number}</p>
                  <p className="data-source">Data Source: {resultData.source}</p>
                </div>

                <div className="table-responsive">
                  <table className="marks-table">
                    <thead>
                      <tr>
                        <th>Subject Code</th>
                        <th>Subject Name</th>
                        <th>Obtained</th>
                        <th>Max</th>
                        <th>Grade</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultData.data.subjects.map((sub, idx) => (
                        <tr key={idx}>
                          <td>{sub.subject_code}</td>
                          <td>{sub.subject_name}</td>
                          <td>{sub.marks_obtained}</td>
                          <td>{sub.max_marks}</td>
                          <td><strong>{sub.grade}</strong></td>
                          <td>
                            {sub.reevaluation_status === 'REQUESTED' ? (
                              <span className="badge badge-pending">Under Review</span>
                            ) : sub.reevaluation_status === 'COMPLETED' ? (
                              <span className="badge badge-success">Completed</span>
                            ) : (
                              <button 
                                onClick={() => handleRequestReevaluation(sub.subject_code)} 
                                className="btn-secondary btn-sm"
                              >
                                Request Reevaluation
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button onClick={handleDownload} className="btn-primary mt-4">
                  Download Official Grade Card
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <div className="admin-grid">
            <div className="results-card" style={{ maxWidth: '500px' }}>
              <h3>Initiate Semester Fee Payment</h3>
              <p className="helper-text">Generates a secure payment intent. Admins will review pending transactions.</p>
              
              {payMessage.text && (
                <div className={`alert alert-${payMessage.type === 'error' ? 'error' : payMessage.type === 'pending' ? 'pending' : 'success'}`}>
                  {payMessage.text}
                </div>
              )}

              <form onSubmit={handleInitiatePayment} className="admin-form">
                <div>
                  <label>Target Semester</label>
                  <select value={paySemester} onChange={(e) => setPaySemester(Number(e.target.value))}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(num => <option key={num} value={num}>Semester {num}</option>)}
                  </select>
                </div>

                <div>
                  <label>Amount (₹)</label>
                  <input 
                    type="number" 
                    value={payAmount} 
                    onChange={(e) => setPayAmount(e.target.value)} 
                    required 
                  />
                </div>

                <button type="submit" className="btn-primary" disabled={payLoading}>
                  {payLoading ? 'Processing Request...' : 'Initiate Payment'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}