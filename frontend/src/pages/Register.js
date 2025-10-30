import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Register.css';

function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    role: 'PATIENT',
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Parolele nu coincid!');
      return;
    }

    if (formData.password.length < 6) {
      setError('Parola trebuie să aibă cel puțin 6 caractere!');
      return;
    }

    if (formData.phoneNumber.length < 10) {
      setError('Numărul de telefon trebuie să aibă cel puțin 10 cifre!');
      return;
    }

    setLoading(true);

    try {
      const userData = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        role: formData.role,
      };

      const response = await fetch('http://localhost:8080/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        const createdUser = await response.json();
        login(createdUser);
        
        if (createdUser.role === 'PATIENT') {
          navigate('/patient/dashboard');
        } else if (createdUser.role === 'DOCTOR') {
          navigate('/doctor/dashboard');
        } else if (createdUser.role === 'ADMIN') {
          navigate('/admin/dashboard');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Eroare la înregistrare');
      }
    } catch (err) {
      setError('Eroare la conectare. Verificați conexiunea la server.');
      console.error('Register error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-form-card">
        <h2 className="register-title">Înregistrare MedEase</h2>
        
        {error && <div className="register-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="register-form">
          <div className="register-row">
            <div className="register-form-group">
              <label className="register-label">Prenume:</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="register-input"
                placeholder="Ion"
              />
            </div>

            <div className="register-form-group">
              <label className="register-label">Nume:</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="register-input"
                placeholder="Popescu"
              />
            </div>
          </div>

          <div className="register-form-group">
            <label className="register-label">Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="register-input"
              placeholder="exemplu@email.com"
            />
          </div>

          <div className="register-form-group">
            <label className="register-label">Telefon:</label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              required
              className="register-input"
              placeholder="0712345678"
            />
          </div>

          <div className="register-row">
            <div className="register-form-group">
              <label className="register-label">Parolă:</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="register-input"
                placeholder="••••••••"
              />
            </div>

            <div className="register-form-group">
              <label className="register-label">Confirmă Parola:</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="register-input"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="register-form-group">
            <label className="register-label">Tip cont:</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="register-select"
            >
              <option value="PATIENT">Pacient</option>
              <option value="DOCTOR">Doctor</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="register-button"
          >
            {loading ? 'Se înregistrează...' : 'Înregistrare'}
          </button>
        </form>

        <p className="register-login-link">
          Ai deja cont? <Link to="/login" className="register-link">Login</Link>
        </p>
        
        <Link to="/" className="register-back-link"> Înapoi la Home</Link>
      </div>
    </div>
  );
}

export default Register;