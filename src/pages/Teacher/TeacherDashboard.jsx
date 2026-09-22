import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import axiosClient from '../../api/axiosClient';
import { auth } from '../../config/firebase';
import { signOut } from 'firebase/auth';

export default function TeacherDashboard() {
  const { currentUser } = useAuth();
  const [semester, setSemester] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  // Initialize with one empty row
  const [marks, setMarks] = useState([
    { roll_number: '', subject_code: '', subject_name: '', marks_obtained: '', max_marks: 100, grade: '' }
  ]);

  const handleAddRow = () => {
    setMarks([...marks, { roll_number: '', subject_code: '', subject_name: '', marks_obtained: '', max_marks: 100, grade: '' }]);
  };

  const handleRemoveRow = (index) => {
    const updated = marks.filter((_, i) => i !== index);
    setMarks(updated);
  };

  const handleChange = (index, field, value) => {
    const updated = [...marks];
    updated[index][field] = value;
    setMarks(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      // Format numeric fields before sending
      const formattedMarks = marks.map(m => ({
        ...m,
        marks_obtained: parseFloat(m.marks_obtained),
        max_marks: parseFloat(m.max_marks)
      }));

      const response = await axiosClient.post('/results/upload-marks', {
        semester: Number(semester),
        marks: formattedMarks
      });

      setMessage(response.data.message);
      if (response.data.errors?.length > 0) {
        setError(`Issues encountered: ${response.data.errors.join(', ')}`);
      } else {
        // Clear form on perfect success
        setMarks([{ roll_number: '', subject_code: '', subject_name: '', marks_obtained: '', max_marks: 100, grade: '' }]);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload marks. Check your Class Teacher assignment.');
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
          <h1>Upload Draft Marks</h1>
          <div className="semester-selector">
            <label>Target Semester: </label>
            <select value={semester} onChange={(e) => setSemester(e.target.value)}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                <option key={num} value={num}>Semester {num}</option>
              ))}
            </select>
          </div>
        </header>

        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}

        <div className="results-card">
          <form onSubmit={handleSubmit}>
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
        </div>
      </main>
    </div>
  );
}