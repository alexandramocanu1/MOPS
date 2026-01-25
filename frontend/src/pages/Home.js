import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import './Home.css';

function Home() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'DOCTOR') {
      navigate('/doctor/dashboard', { replace: true });
    } else if (user?.role === 'ADMIN') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="home-container">
      <div className="home-hero">
        <h1 className="home-title">MedEase</h1>
        <p className="home-subtitle">
          Modern online medical appointment management system
        </p>

      </div>

      <div className="home-features">
        <div 
          className="home-feature clickable" 
          onClick={() => navigate('/appointments')}
          role="button"
          tabIndex={0}
          onKeyPress={(e) => e.key === 'Enter' && navigate('/appointments')}
        >
          <h3>Online Appointments</h3>
          <p>Book appointments quickly and easily from the comfort of your home</p>
          
        </div>
        
        <div 
          className="home-feature clickable" 
          onClick={() => navigate('/doctors')}
          role="button"
          tabIndex={0}
          onKeyPress={(e) => e.key === 'Enter' && navigate('/doctors')}
        >
          <h3>Qualified Doctors</h3>
          <p>Choose from our list of experienced physicians</p>
          
        </div>
        
        <div className="home-feature">
          <h3>Efficient Management</h3>
          <p>View and manage all your appointments in one place</p>
        </div>
      </div>
    </div>
  );
}

export default Home;