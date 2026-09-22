import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axiosClient from '../../api/axiosClient';
import { auth } from '../../config/firebase';
import { signOut } from 'firebase/auth';

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('users'); // users, academic, finance
  
  // --- Form States ---
  const [roleForm, setRoleForm] = useState({ email: '', role: 'student', full_name: '', department: 'Computer Science', custom_id: '' });
  const [assignForm, setAssignForm] = useState({ employee_id: '', semester: 1, department: 'Computer Science' });
  const [publishForm, setPublishForm] = useState({ semester: 1, department: 'Computer Science' });
  const [promoteForm, setPromoteForm] = useState({ roll_number: '' });
  
  // --- Data States ---
  const [payments, setPayments] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  
  // --- UI States ---
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  // --- API Handlers ---

  const handleSetRole = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        email: roleForm.email,
        role: roleForm.role,
        department: roleForm.department || 'Computer Science'
      };

      if (roleForm.full_name) payload.full_name = roleForm.full_name;

      // Dynamically attach the ID override based on the selected role
      if (roleForm.role === 'student' && roleForm.custom_id) {
        payload.roll_number = roleForm.custom_id;
      } else if (roleForm.role === 'teacher' && roleForm.custom_id) {
        payload.employee_id = roleForm.custom_id;
      }

      const res = await axiosClient.post('/auth/set-role', payload);
      showMessage(res.data.message);
      setRoleForm({ email: '', role: 'student', full_name: '', department: 'Computer Science', custom_id: '' });
    } catch (err) {
      showMessage(err.response?.data?.detail || 'Failed to assign role', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTeacher = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axiosClient.post('/admin/assign-class-teacher', assignForm);
      showMessage(res.data.message);
      setAssignForm({ ...assignForm, employee_id: '' });
    } catch (err) {
      showMessage(err.response?.data?.detail || 'Failed to assign teacher', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePublishResults = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axiosClient.post('/admin/publish-results', null, {
        params: { semester: publishForm.semester, department: publishForm.department }
      });
      showMessage(res.data.message);
    } catch (err) {
      showMessage(err.response?.data?.detail || 'Failed to publish results', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteStudent = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axiosClient.post('/admin/promote-student', { roll_number: promoteForm.roll_number });
      showMessage(res.data.message);
      setPromoteForm({ roll_number: '' });
    } catch (err) {
      showMessage(err.response?.data?.detail || 'Promotion failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status_filter = statusFilter;
      if (semesterFilter) params.semester_filter = semesterFilter;
      
      const res = await axiosClient.get('/admin/payment-requests', { params });
      setPayments(res.data);
    } catch (err) {
      showMessage('Failed to load payments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePayment = async (payment_id, status) => {
    try {
      await axiosClient.post('/payments/callback', { payment_id, status });
      showMessage(`Payment marked as ${status}`);
      fetchPayments();
    } catch (err) {
      showMessage(err.response?.data?.detail || 'Failed to update payment', 'error');
    }
  };

  useEffect(() => {
    if (activeTab === 'finance') fetchPayments();
  }, [activeTab, statusFilter, semesterFilter]);


  // --- Sub-components ---

  const UsersPanel = () => (
    <div className="admin-grid">
      <div className="results-card">
        <h3>Provision User Access</h3>
        <p className="helper-text">Upgrades a registered 'unassigned' user to a Student or Teacher profile.</p>
        <form onSubmit={handleSetRole} className="admin-form">
          <input type="email" placeholder="Registered Email" required value={roleForm.email} onChange={e => setRoleForm({...roleForm, email: e.target.value})} />
          
          <select value={roleForm.role} onChange={e => setRoleForm({...roleForm, role: e.target.value})}>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="admin">Admin</option>
          </select>
          
          <input type="text" placeholder="Full Name (Optional)" value={roleForm.full_name} onChange={e => setRoleForm({...roleForm, full_name: e.target.value})} />
          <input type="text" placeholder="Department" required value={roleForm.department} onChange={e => setRoleForm({...roleForm, department: e.target.value})} />
          
          {roleForm.role !== 'admin' && (
            <input 
              type="text" 
              placeholder={roleForm.role === 'student' ? "Roll Number Override (Optional)" : "Employee ID Override (Optional)"} 
              value={roleForm.custom_id} 
              onChange={e => setRoleForm({...roleForm, custom_id: e.target.value})} 
            />
          )}
          
          <button type="submit" className="btn-primary" disabled={loading}>Assign Role & Sync DB</button>
        </form>
      </div>
    </div>
  );

  const AcademicPanel = () => (
    <div className="admin-grid">
      <div className="results-card">
        <h3>Assign Class Teacher</h3>
        <form onSubmit={handleAssignTeacher} className="admin-form">
          <input type="text" placeholder="Employee ID (e.g. EMP123)" required value={assignForm.employee_id} onChange={e => setAssignForm({...assignForm, employee_id: e.target.value})} />
          <input type="text" placeholder="Department" required value={assignForm.department} onChange={e => setAssignForm({...assignForm, department: e.target.value})} />
          <select value={assignForm.semester} onChange={e => setAssignForm({...assignForm, semester: Number(e.target.value)})}>
            {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>Semester {n}</option>)}
          </select>
          <button type="submit" className="btn-primary" disabled={loading}>Assign Teacher</button>
        </form>
      </div>

      <div className="results-card">
        <h3>Publish Draft Results</h3>
        <form onSubmit={handlePublishResults} className="admin-form">
          <input type="text" placeholder="Department" required value={publishForm.department} onChange={e => setPublishForm({...publishForm, department: e.target.value})} />
          <select value={publishForm.semester} onChange={e => setPublishForm({...publishForm, semester: Number(e.target.value)})}>
            {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>Semester {n}</option>)}
          </select>
          <button type="submit" className="btn-primary" disabled={loading}>Publish Grades</button>
        </form>
      </div>

      <div className="results-card">
        <h3>Promote Student</h3>
        <p className="helper-text">Verifies academic passes & fee clearances.</p>
        <form onSubmit={handlePromoteStudent} className="admin-form">
          <input type="text" placeholder="Roll Number (e.g. CS001)" required value={promoteForm.roll_number} onChange={e => setPromoteForm({...promoteForm, roll_number: e.target.value})} />
          <button type="submit" className="btn-primary" disabled={loading}>Run Promotion Check</button>
        </form>
      </div>
    </div>
  );

  const FinancePanel = () => (
    <div className="results-card">
      <div className="filter-bar">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="SUCCESS">Success</option>
          <option value="FAILED">Failed</option>
        </select>
        <select value={semesterFilter} onChange={e => setSemesterFilter(e.target.value)}>
          <option value="">All Semesters</option>
          {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>Semester {n}</option>)}
        </select>
        <button onClick={fetchPayments} className="btn-secondary" disabled={loading}>Refresh</button>
      </div>

      <div className="table-responsive">
        <table className="marks-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Student</th>
              <th>Sem</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(p => (
              <tr key={p.payment_id}>
                <td>{new Date(p.created_at).toLocaleDateString()}</td>
                <td>{p.full_name}<br/><small>{p.roll_number}</small></td>
                <td>{p.semester}</td>
                <td>₹{p.amount}</td>
                <td><span className={`badge badge-${p.status.toLowerCase()}`}>{p.status}</span></td>
                <td>
                  {p.status === 'PENDING' && (
                    <div className="action-buttons">
                      <button onClick={() => handleUpdatePayment(p.payment_id, 'SUCCESS')} className="btn-success btn-sm">Approve</button>
                      <button onClick={() => handleUpdatePayment(p.payment_id, 'FAILED')} className="btn-danger btn-sm">Reject</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {payments.length === 0 && <tr><td colSpan="6" style={{textAlign: 'center'}}>No payment records found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="dashboard-layout">
      <nav className="navbar">
        <h2>Campus Portal | Admin Control</h2>
        <div className="nav-actions">
          <span>{currentUser?.email}</span>
          <button onClick={() => signOut(auth)} className="btn-secondary">Logout</button>
        </div>
      </nav>

      <main className="dashboard-content">
        <div className="tab-navigation">
          <button className={activeTab === 'users' ? 'tab active' : 'tab'} onClick={() => setActiveTab('users')}>User Access</button>
          <button className={activeTab === 'academic' ? 'tab active' : 'tab'} onClick={() => setActiveTab('academic')}>Academic Ops</button>
          <button className={activeTab === 'finance' ? 'tab active' : 'tab'} onClick={() => setActiveTab('finance')}>Financial Ledger</button>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        {activeTab === 'users' && <UsersPanel />}
        {activeTab === 'academic' && <AcademicPanel />}
        {activeTab === 'finance' && <FinancePanel />}
      </main>
    </div>
  );
}