import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    setLoading(true);
    try {
      // Calls the FastAPI backend to create the user and set the 'unassigned' custom claim
      const response = await axiosClient.post('/auth/register', { 
        email, 
        password 
      });
      
      setMessage(`${response.data.message}. Redirecting to login...`);
      
      // Delay redirect so the user can read the success message
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to register account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleRegister}>
        <h2>Create Campus Account</h2>
        
        {error && <div className="error-message">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}
        
        <div className="form-group">
          <label>Email Address</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            placeholder="student@campus.edu"
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            minLength="6"
          />
        </div>

        <div className="form-group">
          <label>Confirm Password</label>
          <input 
            type="password" 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
            required 
            minLength="6"
          />
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>

        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem' }}>
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </form>
    </div>
  );
}