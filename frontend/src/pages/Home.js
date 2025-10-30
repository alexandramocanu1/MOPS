import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

function Home() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <div className="home-hero">
        <h1 className="home-title">MedEase</h1>
        <p className="home-subtitle">
          Sistem modern de gestionare a programărilor medicale online
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
          <h3>Programări Online</h3>
          <p>Faceți programări rapid și ușor din confortul casei</p>
          
        </div>
        
        <div 
          className="home-feature clickable" 
          onClick={() => navigate('/doctors')}
          role="button"
          tabIndex={0}
          onKeyPress={(e) => e.key === 'Enter' && navigate('/doctors')}
        >
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