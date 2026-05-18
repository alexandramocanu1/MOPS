import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { login } = useAuth();
  const navigate = useNavigate();
  const hasRun = useRef(false);

  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    if (!token) {
      setStatus('error');
      setError('Verification link is missing or invalid.');
      return;
    }

    fetch(`http://localhost:7000/api/users/verify?token=${token}`)
      .then(async (res) => {
        if (res.ok) {
          const userData = await res.json();
          login(userData);
          setStatus('success');
          setTimeout(() => {
            if (userData.role === 'DOCTOR') {
              navigate('/doctor/dashboard');
            } else if (userData.role === 'ADMIN') {
              navigate('/admin/dashboard');
            } else {
              navigate('/patient/dashboard');
            }
          }, 2000);
        } else {
          const data = await res.json();
          setError(data.message || 'Verification failed.');
          setStatus('error');
        }
      })
      .catch(() => {
        setError('Connection error. Please try again later.');
        setStatus('error');
      });
  }, []);

  return (
    <div className="auth-container">
      <div className="auth-card">
        {status === 'loading' && (
          <div className="auth-header">
            <h2 className="auth-title">Verifying your account...</h2>
            <p className="auth-subtitle">Please wait a moment.</p>
          </div>
        )}
        {status === 'success' && (
          <div className="auth-header">
            <h2 className="auth-title">Email verified!</h2>
            <p className="auth-subtitle">Your account is now active. Redirecting you to the dashboard...</p>
          </div>
        )}
        {status === 'error' && (
          <>
            <div className="auth-header">
              <h2 className="auth-title">Verification failed</h2>
              <p className="auth-subtitle">{error}</p>
            </div>
            <p className="auth-switch">
              <Link to="/login" className="auth-link">Back to Login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default VerifyEmail;
