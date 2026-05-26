import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { login } = useAuth();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const rules = {
    length:  newPassword.length >= 5,
    number:  /\d/.test(newPassword),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword),
    match:   newPassword === confirmPassword && confirmPassword !== '',
  };

  if (!token) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2 className="auth-title">Invalid link</h2>
            <p className="auth-subtitle">This password reset link is missing or invalid.</p>
          </div>
          <p className="auth-switch"><Link to="/login" className="auth-link">Back to Login</Link></p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setError('');

    if (!rules.length || !rules.number || !rules.special || !rules.match) return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:7000/api/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      if (response.ok) {
        const userData = await response.json();
        login(userData);
        if (userData.role === 'DOCTOR') {
          navigate('/doctor/dashboard');
        } else if (userData.role === 'ADMIN') {
          navigate('/admin/dashboard');
        } else {
          navigate('/appointments?view=myappointments');
        }
      } else {
        const data = await response.json();
        setError(data.message || 'Something went wrong. The link may have expired.');
      }
    } catch (err) {
      setError('Connection error. Please check your server connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2 className="auth-title">Choose a new password</h2>
          <p className="auth-subtitle">Enter and confirm your new password below.</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-form-group">
            <label className="auth-label">New Password</label>
            <div className="input-wrapper">
              <span className="input-icon"><LockIcon /></span>
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="auth-input"
                placeholder="••••••••"
              />
              <button type="button" className="eye-toggle" onClick={() => setShowNew(p => !p)}>
                {showNew ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {submitted && (
              <div className="password-hints">
                {!rules.length  && <p className="password-hint">Password should have at least 5 characters.</p>}
                {!rules.number  && <p className="password-hint">Password should contain at least one number.</p>}
                {!rules.special && <p className="password-hint">Password should contain at least one special character (!@#$%...).</p>}
              </div>
            )}
          </div>

          <div className="auth-form-group">
            <label className="auth-label">Confirm Password</label>
            <div className="input-wrapper">
              <span className="input-icon"><LockIcon /></span>
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="auth-input"
                placeholder="••••••••"
              />
              <button type="button" className="eye-toggle" onClick={() => setShowConfirm(p => !p)}>
                {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {submitted && !rules.match && (
              <div className="password-hints">
                <p className="password-hint">Passwords do not match.</p>
              </div>
            )}
          </div>

          <button type="submit" disabled={loading} className="auth-button">
            {loading ? 'Saving...' : 'Set New Password'}
          </button>
        </form>

        <p className="auth-switch">
          <Link to="/login" className="auth-link">Back to Login</Link>
        </p>
      </div>
    </div>
  );
}

export default ResetPassword;
