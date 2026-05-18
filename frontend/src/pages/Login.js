import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const EmailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
  </svg>
);

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

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [notVerified, setNotVerified] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:7000/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const userData = await response.json();
        login(userData);
        if (userData.role === 'PATIENT' || userData.role === 'USER') {
          navigate('/patient/dashboard');
        } else if (userData.role === 'DOCTOR') {
          navigate('/doctor/dashboard');
        } else if (userData.role === 'ADMIN') {
          navigate('/admin/dashboard');
        }
      } else {
        const errorData = await response.json();
        if (errorData.message === 'EMAIL_NOT_VERIFIED') {
          setNotVerified(true);
          setError('Please verify your email before logging in.');
        } else {
          setError(errorData.message || 'Invalid email or password');
        }
      }
    } catch (err) {
      setError('Connection error. Please check your server connection.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setResendSuccess(false);
    try {
      const response = await fetch('http://localhost:7000/api/users/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (response.ok) setResendSuccess(true);
    } catch (err) {
      // silently ignore
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2 className="auth-title">Welcome back</h2>
          <p className="auth-subtitle">Sign in to your MedEase account</p>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {notVerified && (
          <p className="auth-switch" style={{ marginTop: 0 }}>
            {resendSuccess
              ? 'Verification email sent! Check your inbox.'
              : <button className="auth-link" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }} onClick={handleResend} disabled={resendLoading}>
                  {resendLoading ? 'Sending...' : 'Resend verification email'}
                </button>
            }
          </p>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-form-group">
            <label className="auth-label">Email</label>
            <div className="input-wrapper">
              <span className="input-icon"><EmailIcon /></span>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); localStorage.setItem('lastLoginEmail', e.target.value); }}
                required
                className="auth-input"
                placeholder="example@email.com"
              />
            </div>
          </div>

          <div className="auth-form-group">
            <label className="auth-label">Password</label>
            <div className="input-wrapper">
              <span className="input-icon"><LockIcon /></span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="auth-input"
                placeholder="••••••••"
              />
              <button type="button" className="eye-toggle" onClick={() => setShowPassword(p => !p)}>
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="auth-button">
            {loading ? 'Loading...' : 'Login'}
          </button>
        </form>

        <p className="auth-switch">
          <Link to="/forgot-password" state={{ email }} className="auth-link">Forgot password?</Link>
        </p>

        <p className="auth-switch">
          Don't have an account? <Link to="/register" className="auth-link">Register</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
