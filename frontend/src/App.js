import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';


import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import PatientDashboard from './pages/PatientDashboard';
import OnlineAppoinment from './pages/OnlineAppointment';
import DoctorDashboard from './pages/DoctorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Navbar from './components/Navbar';
import Breadcrumb from './components/Breadcrumb';
import CookieConsent from './components/CookieConsent';
import ReportsPage from './pages/ReportsPage';
import PaymentPage from './pages/PaymentPage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';

function ProtectedHome() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Home /> : <Navigate to="/login" replace />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar/>
        <Breadcrumb/>
        <CookieConsent />
        <div className="App">
          <Routes>
            <Route path="/" element={<ProtectedHome />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/patient/dashboard" element={<PatientDashboard />} />
            <Route path="/appointments" element={<OnlineAppoinment />} />
            <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/reports" element={<ReportsPage />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;