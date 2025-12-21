import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:7000/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const userData = await response.json();
        login(userData);
        
        if (userData.role === 'PATIENT') {
          navigate('/');
        } else if (userData.role === 'DOCTOR') {
          navigate('/doctor/dashboard');
        } else if (userData.role === 'ADMIN') {
          navigate('/admin/dashboard');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Email sau parolă invalidă');
      }
    } catch (err) {
      setError('Eroare la conectare. Verificați conexiunea la server.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form-card">
        <h2 className="login-title">Login MedEase</h2>
        
        {error && <div className="login-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-form-group">
            <label className="login-label">Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="login-input"
              placeholder="exemplu@email.com"
            />
          </div>

          <div className="login-form-group">
            <label className="login-label">Parolă:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="login-input"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="login-button"
          >
            {loading ? 'Se încarcă...' : 'Login'}
          </button>
        </form>

        <p className="login-register-link">
          Nu ai cont? <Link to="/register" className="login-link">Înregistrează-te</Link>
        </p>
        
        <Link to="/" className="login-back-link">Înapoi la Home</Link>
      </div>
    </div>
  );
}

export default Login;