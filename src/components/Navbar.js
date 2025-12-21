import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const renderGuestMenu = () => (
    <>
      <div className="navbar-menu">
        <Link 
          to="/" 
          className={`navbar-link ${location.pathname === '/' ? 'active' : ''}`}
        >
          Acasă
        </Link>
      </div>

      <div className="navbar-auth">
        <Link to="/login" className="navbar-button login">
          Login
        </Link>
        <Link to="/register" className="navbar-button register">
          Înregistrare
        </Link>
      </div>
    </>
  );

  const renderPatientMenu = () => (
    <>
      <div className="navbar-menu">
        <Link 
          to="/" 
          className={`navbar-link ${location.pathname === '/' ? 'active' : ''}`}
        >
          Acasă
        </Link>
        
        <Link 
          to="/patient/dashboard" 
          className={`navbar-link ${location.pathname === '/patient/dashboard' ? 'active' : ''}`}
        >
          Dashboard
        </Link>

        <Link 
          to="/appointments" 
          className={`navbar-link ${location.pathname === '/appointments' ? 'active' : ''}`}
        >
          Programări
        </Link>
        
        <Link 
          to="/doctors" 
          className={`navbar-link ${location.pathname === '/doctors' ? 'active' : ''}`}
        >
          Doctori
        </Link>

      </div>

      <div className="navbar-auth">
        <div className="navbar-user">
          <span className="navbar-username">
            {user?.name || user?.email || 'Pacient'}
          </span>
          <button onClick={handleLogout} className="navbar-button logout">
            Logout
          </button>
        </div>
      </div>
    </>
  );

  const renderDoctorMenu = () => (
    <>
      <div className="navbar-menu">
        
        <Link 
          to="/doctor/dashboard" 
          className={`navbar-link ${location.pathname === '/doctor/dashboard' ? 'active' : ''}`}
        >
          Dashboard
        </Link>
      </div>

      <div className="navbar-auth">
        <div className="navbar-user">
          <span className="navbar-username">
            {user?.name || user?.email || 'Doctor'}
          </span>
          <button onClick={handleLogout} className="navbar-button logout">
            Logout
          </button>
        </div>
      </div>
    </>
  );

  const renderAdminMenu = () => (
    <>
      <div className="navbar-menu">
        
        <Link 
          to="/admin/dashboard" 
          className={`navbar-link ${location.pathname === '/admin/dashboard' ? 'active' : ''}`}
        >
          Dashboard
        </Link>

        <Link 
          to="/admin/reports" 
          className={`navbar-link ${location.pathname === '/admin/reports' ? 'active' : ''}`}
        >
          Reports
        </Link>
      </div>

      <div className="navbar-auth">
        <div className="navbar-user">
          <span className="navbar-username">
            {user?.name || user?.email || 'Admin'}
            <span className="user-role">Administrator</span>
          </span>
          <button onClick={handleLogout} className="navbar-button logout">
            Logout
          </button>
        </div>
      </div>
    </>
  );

  const renderMenu = () => {
    if (!isAuthenticated()) {
      return renderGuestMenu();
    }

    switch (user?.role) {
      case 'PATIENT':
        return renderPatientMenu();
      case 'DOCTOR':
        return renderDoctorMenu();
      case 'ADMIN':
        return renderAdminMenu();
      default:
        return renderGuestMenu();
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          MedEase
        </Link>

        {renderMenu()}
      </div>
    </nav>
  );
}

export default Navbar;