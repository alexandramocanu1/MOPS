import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import './App.css';


import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import PatientDashboard from './pages/PatientDashboard';
import DoctorsPage from './pages/DoctorsPage';
import OnlineAppoinment from './pages/OnlineAppointment';
import DoctorDashboard from './pages/DoctorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Navbar from './components/Navbar';
import ReportsPage from './pages/ReportsPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar/>
        <div className="App">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path = "/patient/dashboard" element={<PatientDashboard />} />
            <Route path = "/doctors" element={<DoctorsPage />} />
            <Route path = "/appointments" element={<OnlineAppoinment />} />
            <Route path = "/doctor/dashboard" element={<DoctorDashboard />} />
            <Route path = "/admin/dashboard" element={<AdminDashboard />} />
            <Route path = "/admin/reports" element={<ReportsPage />} />
 

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;