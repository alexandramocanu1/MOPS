import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

function Home() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="home-container">
      <div className="home-hero">
        <h1 className="home-title">MedEase</h1>
        <p className="home-subtitle">
          Sistem modern de gestionare a programărilor medicale online
        </p>

        {!isAuthenticated() ? (
          <div className="home-button-group">
            <Link to="/login" className="home-primary-button">
              Login
            </Link>
            <Link to="/register" className="home-secondary-button">
              Înregistrare
            </Link>
          </div>
        ) : (
          <div className="home-button-group">
            <Link
              to={
                user.role === 'PATIENT'
                  ? '/patient/dashboard'
                  : user.role === 'DOCTOR'
                  ? '/doctor/dashboard'
                  : '/admin/dashboard'
              }
              className="home-primary-button"
            >
              Dashboard
            </Link>
          </div>
        )}
      </div>

      <div className="home-features">
        <div className="home-feature">
          <h3>Programări Online</h3>
          <p>Faceți programări rapid și ușor din confortul casei</p>
        </div>
        <div className="home-feature">
          <h3>Doctori Calificați</h3>
          <p>Alegeți din lista noastră de medici experimentați</p>
        </div>
        <div className="home-feature">
          <h3>Gestionare Eficientă</h3>
          <p>Vizualizați și gestionați toate programările într-un singur loc</p>
        </div>
      </div>
    </div>
  );
}

export default Home;