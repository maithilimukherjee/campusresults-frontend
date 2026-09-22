import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axiosClient from '../../api/axiosClient';
import { auth } from '../../config/firebase';
import { signOut } from 'firebase/auth';

export default function StudentDashboard() {
  const { currentUser } = useAuth();
  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [semester, setSemester] = useState(1);

  useEffect(() => {
    fetchResults(semester);
  }, [semester]);

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
      alert('Failed to generate download link.');
    }
  };

  const handleRequestReevaluation = async (subjectCode) => {
    if (!window.confirm(`Are you sure you want to request a reevaluation for ${subjectCode}? This can only be done once.`)) return;
    
    try {
      const res = await axiosClient.post(`/results/${semester}/request-reevaluation`, {
        subject_code: subjectCode
      });
      alert(res.data.message);
      fetchResults(semester); // Refresh the UI to show the 'Under Review' badge
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to request reevaluation.');
    }
  };

  const handleLogout = () => signOut(auth);

  return (
    <div className="dashboard-layout">
      <nav className="navbar">
        <h2>Campus Portal | Student</h2>
        <div className="nav-actions">
          <span>{currentUser?.email}</span>
          <button onClick={handleLogout} className="btn-secondary">Logout</button>
        </div>
      </nav>

      <main className="dashboard-content">
        <header className="page-header">
          <h1>Academic Results</h1>
          <div className="semester-selector">
            <label>Semester: </label>
            <select value={semester} onChange={(e) => setSemester(Number(e.target.value))}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                <option key={num} value={num}>Semester {num}</option>
              ))}
            </select>
          </div>
        </header>

        {loading ? (
          <div className="loading-state">Loading your academic records...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : resultData?.data ? (
          <div className="results-card">
            <div className="student-info">
              <p><strong>Name:</strong> {resultData.data.full_name}</p>
              <p><strong>Roll Number:</strong> {resultData.data.roll_number}</p>
              <p className="data-source">Data Source: {resultData.source}</p>
            </div>

            <table className="marks-table">
              <thead>
                <tr>
                  <th>Subject Code</th>
                  <th>Subject Name</th>
                  <th>Marks Obtained</th>
                  <th>Max Marks</th>
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
                    <td>{sub.grade}</td>
                    <td>
                      <button
                        onClick={() => handleRequestReevaluation(sub.subject_code)}
                        className="btn-primary"
                        disabled={sub.reevaluation_requested}
                      >
                        Request Reevaluation
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="no-results">No results found.</div>
        )}
      </main>
    </div>
  );
}