import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axiosClient from '../../api/axiosClient';
import { auth } from '../../config/firebase';
import { signOut } from 'firebase/auth';

export default function TeacherDashboard() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('upload');
  const [semester, setSemester] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  // --- Upload Draft State ---
  const [marks, setMarks] = useState([
    { roll_number: '', subject_code: '', subject_name: '', marks_obtained: '', max_marks: 100, grade: '' }
  ]);

  // --- Reevaluation State ---
  const [pendingRequests, setPendingRequests] = useState([]);
  const [updateForms, setUpdateForms] = useState({});

  // Fetch pending requests when switching tabs or changing semesters
  useEffect(() => {
    if (activeTab === 'reevaluate') {
      fetchPendingRequests();
    }
  }, [activeTab, semester]);

  const showFeedback = (msg, isError = false) => {
    isError ? setError(msg) : setMessage(msg);
    setTimeout(() => { setError(''); setMessage(''); }, 5000);
  };

  // --- 1. Draft Marks Logic ---

  const handleAddRow = () => setMarks([...marks, { roll_number: '', subject_code: '', subject_name: '', marks_obtained: '', max_marks: 100, grade: '' }]);
  const handleRemoveRow = (index) => setMarks(marks.filter((_, i) => i !== index));
  
  const handleChange = (index, field, value) => {
    const updated = [...marks];
    updated[index][field] = value;
    setMarks(updated);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const formattedMarks = marks.map(m => ({
        ...m,
        marks_obtained: parseFloat(m.marks_obtained),
        max_marks: parseFloat(m.max_marks)
      }));

      const response = await axiosClient.post('/results/upload-marks', {
        semester: Number(semester),
        marks: formattedMarks
      });

      showFeedback(response.data.message);
      if (response.data.errors?.length > 0) {
        showFeedback(`Issues encountered: ${response.data.errors.join(', ')}`, true);
      } else {
        setMarks([{ roll_number: '', subject_code: '', subject_name: '', marks_obtained: '', max_marks: 100, grade: '' }]);
      }
    } catch (err) {
      showFeedback(err.response?.data?.detail || 'Failed to upload marks. Check your Class Teacher assignment.', true);
    } finally {
      setLoading(false);
    }
  };

  // --- 2. Reevaluation Logic ---

  const fetchPendingRequests = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/results/reevaluations/pending', { params: { semester } });
      setPendingRequests(res.data);
      
      // Initialize form inputs for each pending request
      const initialForms = {};
      res.data.forEach(req => {
        initialForms[`${req.roll_number}-${req.subject_code}`] = { 
          new_marks: req.current_marks, 
          new_grade: req.current_grade 
        };
      });
      setUpdateForms(initialForms);
    } catch (err) {
      if (err.response?.status === 403) {
        showFeedback('You are not assigned as Class Teacher for this semester.', true);
      } else {
        showFeedback('Failed to fetch pending reevaluations.', true);
      }
      setPendingRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReevalChange = (key, field, value) => {
    setUpdateForms(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  };

  const submitReevaluation = async (req) => {
    const key = `${req.roll_number}-${req.subject_code}`;
    const form = updateForms[key];
    setLoading(true);
    
    try {
      const res = await axiosClient.post('/results/reevaluations/complete', {
        roll_number: req.roll_number,
        semester: Number(semester),
        subject_code: req.subject_code,
        new_marks_obtained: parseFloat(form.new_marks),
        new_grade: form.new_grade
      });
      showFeedback(res.data.message);
      fetchPendingRequests(); // Refresh the list to remove the completed row
    } catch (err) {
      showFeedback(err.response?.data?.detail || 'Update failed', true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <nav className="navbar">
        <h2>Campus Portal | Teacher</h2>
        <div className="nav-actions">
          <span>{currentUser?.email}</span>
          <button onClick={() => signOut(auth)} className="btn-secondary">Logout</button>
        </div>
      </nav>

      <main className="dashboard-content">
        <header className="page-header">
          <div className="tab-navigation" style={{ marginBottom: 0, borderBottom: 'none' }}>
            <button className={activeTab === 'upload' ? 'tab active' : 'tab'} onClick={() => setActiveTab('upload')}>Draft Marks</button>
            <button className={activeTab === 'reevaluate' ? 'tab active' : 'tab'} onClick={() => setActiveTab('reevaluate')}>Pending Reevaluations</button>
          </div>
          <div className="semester-selector">
            <label>Target Semester: </label>
            <select value={semester} onChange={(e) => setSemester(Number(e.target.value))}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                <option key={num} value={num}>Semester {num}</option>
              ))}
            </select>
          </div>
        </header>

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <div className="results-card">
          {activeTab === 'upload' ? (
            <form onSubmit={handleUploadSubmit}>
              <div className="table-responsive">
                <table className="marks-table form-table">
                  <thead>
                    <tr>
                      <th>Roll Number</th>
                      <th>Subject Code</th>
                      <th>Subject Name</th>
                      <th>Obtained</th>
                      <th>Max</th>
                      <th>Grade</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {marks.map((row, idx) => (
                      <tr key={idx}>
                        <td><input type="text" required value={row.roll_number} onChange={(e) => handleChange(idx, 'roll_number', e.target.value)} placeholder="CS001" /></td>
                        <td><input type="text" required value={row.subject_code} onChange={(e) => handleChange(idx, 'subject_code', e.target.value)} placeholder="CS101" /></td>
                        <td><input type="text" required value={row.subject_name} onChange={(e) => handleChange(idx, 'subject_name', e.target.value)} /></td>
                        <td><input type="number" step="0.1" required value={row.marks_obtained} onChange={(e) => handleChange(idx, 'marks_obtained', e.target.value)} /></td>
                        <td><input type="number" step="1" required value={row.max_marks} onChange={(e) => handleChange(idx, 'max_marks', e.target.value)} /></td>
                        <td><input type="text" required value={row.grade} onChange={(e) => handleChange(idx, 'grade', e.target.value)} placeholder="A" /></td>
                        <td>
                          {marks.length > 1 && (
                            <button type="button" onClick={() => handleRemoveRow(idx)} className="btn-remove">✕</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="form-actions">
                <button type="button" onClick={handleAddRow} className="btn-secondary">+ Add Row</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Saving Drafts...' : 'Submit Draft Marks'}
                </button>
              </div>
            </form>
          ) : (
            <div className="table-responsive">
              <table className="marks-table form-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Subject</th>
                    <th>Old Marks</th>
                    <th>New Marks</th>
                    <th>New Grade</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingRequests.length === 0 ? (
                    <tr><td colSpan="6" style={{textAlign: 'center', padding: '2rem'}}>No pending reevaluations for Semester {semester}.</td></tr>
                  ) : (
                    pendingRequests.map(req => {
                      const key = `${req.roll_number}-${req.subject_code}`;
                      const form = updateForms[key] || { new_marks: '', new_grade: '' };
                      return (
                        <tr key={key}>
                          <td>{req.student_name}<br/><small>{req.roll_number}</small></td>
                          <td>{req.subject_code}</td>
                          <td>{req.current_marks} ({req.current_grade})</td>
                          <td>
                            <input type="number" step="0.1" required value={form.new_marks} onChange={e => handleReevalChange(key, 'new_marks', e.target.value)} />
                          </td>
                          <td>
                            <input type="text" required value={form.new_grade} onChange={e => handleReevalChange(key, 'new_grade', e.target.value)} />
                          </td>
                          <td>
                            <button onClick={() => submitReevaluation(req)} disabled={loading} className="btn-success btn-sm">Update Grade</button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}