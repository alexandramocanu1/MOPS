import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DoctorForm from '../components/DoctorForm';
import AvailabilityForm from '../components/AvailabilityForm';
import './AdminDashboard.css';

const API_BASE_URL = 'http://localhost:7000/api';

function AdminDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        totalPatients: 0,
        totalDoctors: 0,
        activeDoctors: 0,
        totalAppointments: 0,
        pendingAppointments: 0,
        confirmedAppointments: 0,
        completedAppointments: 0,
        totalSpecialties: 0
    });

    const [recentAppointments, setRecentAppointments] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [specialties, setSpecialties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [showDoctorForm, setShowDoctorForm] = useState(false);
    const [showAvailabilityForm, setShowAvailabilityForm] = useState(false);
    const [editingDoctor, setEditingDoctor] = useState(null);
    const [selectedDoctorForAvailability, setSelectedDoctorForAvailability] = useState(null);

    useEffect(() => {
        if (user?.role !== 'ADMIN') {
            navigate('/');
            return;
        }
        fetchDashboardData();
    }, [user, navigate]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [
                patientsRes,
                doctorsRes,
                activeDoctorsRes,
                appointmentsRes,
                pendingAppointmentsRes,
                confirmedAppointmentsRes,
                completedAppointmentsRes,
                specialtiesRes
            ] = await Promise.all([
                fetch(`${API_BASE_URL}/users/role/PATIENT`),
                fetch(`${API_BASE_URL}/doctors`),
                fetch(`${API_BASE_URL}/doctors/active`),
                fetch(`${API_BASE_URL}/appointments`),
                fetch(`${API_BASE_URL}/appointments/status/PENDING`),
                fetch(`${API_BASE_URL}/appointments/status/CONFIRMED`),
                fetch(`${API_BASE_URL}/appointments/status/COMPLETED`),
                fetch(`${API_BASE_URL}/specialties`)
            ]);

            if (!patientsRes.ok || !doctorsRes.ok || !activeDoctorsRes.ok || 
                !appointmentsRes.ok || !pendingAppointmentsRes.ok || 
                !confirmedAppointmentsRes.ok || !completedAppointmentsRes.ok || 
                !specialtiesRes.ok) {
                throw new Error('Failed to fetch some data');
            }

            const patients = await patientsRes.json();
            const doctorsData = await doctorsRes.json();
            const activeDoctorsData = await activeDoctorsRes.json();
            const appointments = await appointmentsRes.json();
            const pendingAppointments = await pendingAppointmentsRes.json();
            const confirmedAppointments = await confirmedAppointmentsRes.json();
            const completedAppointments = await completedAppointmentsRes.json();
            const specialtiesData = await specialtiesRes.json();

            setStats({
                totalPatients: patients.length || 0,
                totalDoctors: doctorsData.length || 0,
                activeDoctors: activeDoctorsData.length || 0,
                totalAppointments: appointments.length || 0,
                pendingAppointments: pendingAppointments.length || 0,
                confirmedAppointments: confirmedAppointments.length || 0,
                completedAppointments: completedAppointments.length || 0,
                totalSpecialties: specialtiesData.length || 0
            });

            // Sort by createdAt descending to show most recent appointments first
            const sortedAppointments = [...appointments].sort((a, b) =>
                new Date(b.createdAt) - new Date(a.createdAt)
            );
            setRecentAppointments(sortedAppointments.slice(0, 10));
            setDoctors(doctorsData);
            setSpecialties(specialtiesData);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError('Failed to load dashboard data. Please try again.');
            setLoading(false);
        }
    };

    const handleToggleDoctorStatus = async (doctorId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/doctors/${doctorId}/toggle-status`, {
                method: 'PUT'
            });

            if (response.ok) {
                fetchDashboardData();
            } else {
                alert('Failed to toggle doctor status');
            }
        } catch (err) {
            console.error('Error toggling doctor status:', err);
            alert('Error toggling doctor status');
        }
    };

    const handleDeleteDoctor = async (doctorId) => {
        if (!window.confirm('Are you sure you want to delete this doctor?')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/doctors/${doctorId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                fetchDashboardData();
            } else {
                alert('Failed to delete doctor');
            }
        } catch (err) {
            console.error('Error deleting doctor:', err);
            alert('Error deleting doctor');
        }
    };

    const handleAddDoctor = () => {
        setEditingDoctor(null);
        setShowDoctorForm(true);
    };

    const handleEditDoctor = (doctor) => {
        setEditingDoctor(doctor);
        setShowDoctorForm(true);
    };

    const handleSetAvailability = (doctor) => {
        setSelectedDoctorForAvailability(doctor);
        setShowAvailabilityForm(true);
    };

    const handleDoctorFormSuccess = () => {
        setShowDoctorForm(false);
        setEditingDoctor(null);
        fetchDashboardData();
    };

    const handleAvailabilityFormSuccess = () => {
        setShowAvailabilityForm(false);
        setSelectedDoctorForAvailability(null);
    };

    const handleCancelAppointment = async (appointmentId) => {
        if (!window.confirm('Are you sure you want to cancel this appointment?')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/cancel`, {
                method: 'PUT'
            });

            if (response.ok) {
                alert('Appointment cancelled successfully');
                fetchDashboardData();
            } else {
                alert('Failed to cancel appointment');
            }
        } catch (err) {
            console.error('Error cancelling appointment:', err);
            alert('Error cancelling appointment');
        }
    };

    const formatDateTime = (dateTimeString) => {
        if (!dateTimeString) return 'N/A';
        const date = new Date(dateTimeString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'PENDING': return 'status-pending';
            case 'CONFIRMED': return 'status-confirmed';
            case 'REJECTED': return 'status-rejected';
            case 'CANCELLED': return 'status-cancelled';
            case 'COMPLETED': return 'status-completed';
            default: return '';
        }
    };

    if (loading) {
        return (
            <div className="admin-dashboard">
                <div className="loading">Loading dashboard data...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="admin-dashboard">
                <div className="error">{error}</div>
                <button onClick={fetchDashboardData} className="btn-retry">Retry</button>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            <div className="dashboard-header">
                <h1>Admin Dashboard</h1>
                <p>Welcome back, {user?.name || 'Admin'}</p>
            </div>

            <div className="dashboard-tabs">
                <button
                    className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    Overview
                </button>
                <button
                    className={`tab-button ${activeTab === 'doctors' ? 'active' : ''}`}
                    onClick={() => setActiveTab('doctors')}
                >
                    Doctors Management
                </button>
                <button
                    className={`tab-button ${activeTab === 'appointments' ? 'active' : ''}`}
                    onClick={() => setActiveTab('appointments')}
                >
                    Appointments
                </button>
                <button
                    className={`tab-button ${activeTab === 'specialties' ? 'active' : ''}`}
                    onClick={() => setActiveTab('specialties')}
                >
                    Specialties
                </button>
            </div>

            {activeTab === 'overview' && (
                <div className="tab-content">
                    <div className="stats-grid">
                        <div className="stat-card stat-primary">
                            <div className="stat-info">
                                <h3>Total Patients</h3>
                                <p className="stat-number">{stats.totalPatients}</p>
                            </div>
                        </div>

                        <div className="stat-card stat-success">
                            <div className="stat-info">
                                <h3>Active Doctors</h3>
                                <p className="stat-number">{stats.activeDoctors} / {stats.totalDoctors}</p>
                            </div>
                        </div>

                        <div className="stat-card stat-warning">
                            <div className="stat-info">
                                <h3>Pending Appointments</h3>
                                <p className="stat-number">{stats.pendingAppointments}</p>
                            </div>
                        </div>

                        <div className="stat-card stat-info">
                            <div className="stat-info">
                                <h3>Confirmed Appointments</h3>
                                <p className="stat-number">{stats.confirmedAppointments}</p>
                            </div>
                        </div>

                        <div className="stat-card stat-completed">
                            <div className="stat-info">
                                <h3>Completed Appointments</h3>
                                <p className="stat-number">{stats.completedAppointments}</p>
                            </div>
                        </div>

                        <div className="stat-card stat-secondary">
                            <div className="stat-info">
                                <h3>Specialties</h3>
                                <p className="stat-number">{stats.totalSpecialties}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'doctors' && (
                <div className="tab-content">
                    <div className="section-header">
                        <h2>Doctors Management</h2>
                        <div className="header-actions">
                            <p>Total: {doctors.length} doctors</p>
                            <button onClick={handleAddDoctor} className="btn-add-doctor">
                                + Add Doctor
                            </button>
                        </div>
                    </div>

                    {showDoctorForm && (
                        <DoctorForm
                            editingDoctor={editingDoctor}
                            specialties={specialties}
                            onCancel={() => setShowDoctorForm(false)}
                            onSuccess={handleDoctorFormSuccess}
                        />
                    )}

                    {showAvailabilityForm && selectedDoctorForAvailability && (
                        <AvailabilityForm
                            doctor={selectedDoctorForAvailability}
                            onCancel={() => setShowAvailabilityForm(false)}
                            onSuccess={handleAvailabilityFormSuccess}
                        />
                    )}

                    <div className="doctors-table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Specialty</th>
                                    <th>Experience</th>
                                    <th>Popularity</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {doctors.map(doctor => (
                                    <tr key={doctor.id}>
                                        <td>{doctor.id}</td>
                                        <td>
                                            {doctor.user?.fullName ||
                                             (doctor.user?.firstName && doctor.user?.lastName
                                                ? `${doctor.user.firstName} ${doctor.user.lastName}`
                                                : 'N/A')}
                                        </td>
                                        <td>{doctor.user?.email || 'N/A'}</td>
                                        <td>{doctor.specialty?.name || 'N/A'}</td>
                                        <td>{doctor.experienceYears} years</td>
                                        <td>{doctor.popularity}</td>
                                        <td>
                                            <span className={`status-badge ${doctor.isActive ? 'status-active' : 'status-inactive'}`}>
                                                {doctor.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    onClick={() => handleEditDoctor(doctor)}
                                                    className="btn-edit"
                                                    title="Edit"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => handleSetAvailability(doctor)}
                                                    className="btn-availability"
                                                    title="Set Availability"
                                                >
                                                    📅
                                                </button>
                                                <button
                                                    onClick={() => handleToggleDoctorStatus(doctor.id)}
                                                    className="btn-toggle"
                                                    title={doctor.isActive ? 'Deactivate' : 'Activate'}
                                                >
                                                    {doctor.isActive ? '⏸' : '▶'}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteDoctor(doctor.id)}
                                                    className="btn-delete"
                                                    title="Delete"
                                                >
                                                    🗑
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'appointments' && (
                <div className="tab-content">
                    <div className="section-header">
                        <h2>Recent Appointments</h2>
                        <p>Showing latest {recentAppointments.length} appointments</p>
                    </div>

                    <div className="appointments-table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Patient</th>
                                    <th>Doctor</th>
                                    <th>Appointment Date</th>
                                    <th>Created At</th>
                                    <th>Status</th>
                                    <th>Notes</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentAppointments.map(appointment => (
                                    <tr key={appointment.id}>
                                        <td>{appointment.id}</td>
                                        <td>
                                            {appointment.patient?.fullName ||
                                             (appointment.patient?.firstName && appointment.patient?.lastName
                                                ? `${appointment.patient.firstName} ${appointment.patient.lastName}`
                                                : 'N/A')}
                                        </td>
                                        <td>
                                            {appointment.doctor?.user?.fullName ||
                                             (appointment.doctor?.user?.firstName && appointment.doctor?.user?.lastName
                                                ? `${appointment.doctor.user.firstName} ${appointment.doctor.user.lastName}`
                                                : 'N/A')}
                                        </td>
                                        <td>{formatDateTime(appointment.appointmentDate)}</td>
                                        <td>{formatDateTime(appointment.createdAt)}</td>
                                        <td>
                                            <span className={`status-badge ${getStatusBadgeClass(appointment.status)}`}>
                                                {appointment.status}
                                            </span>
                                        </td>
                                        <td className="notes-cell">{appointment.notes || '-'}</td>
                                        <td>
                                            {(appointment.status === 'PENDING' || appointment.status === 'CONFIRMED') && (
                                                <button
                                                    onClick={() => handleCancelAppointment(appointment.id)}
                                                    className="btn-cancel-appointment"
                                                    title="Cancel Appointment"
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'specialties' && (
                <div className="tab-content">
                    <div className="section-header">
                        <h2>Medical Specialties</h2>
                        <p>Total: {specialties.length} specialties</p>
                    </div>

                    <div className="specialties-grid">
                        {specialties.map(specialty => {
                            const specialtyDoctors = doctors.filter(d => d.specialty?.id === specialty.id);
                            const activeDoctorsCount = specialtyDoctors.filter(d => d.isActive).length;

                            return (
                                <div key={specialty.id} className="specialty-card">
                                    <h3>{specialty.name}</h3>
                                    <p className="specialty-description">{specialty.description || 'No description available'}</p>
                                    <div className="specialty-stats">
                                        <div className="specialty-stat">
                                            <span className="stat-label">Total Doctors:</span>
                                            <span className="stat-value">{specialtyDoctors.length}</span>
                                        </div>
                                        <div className="specialty-stat">
                                            <span className="stat-label">Active:</span>
                                            <span className="stat-value">{activeDoctorsCount}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminDashboard;