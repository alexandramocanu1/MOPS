import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
    const [editingDoctor, setEditingDoctor] = useState(null);
    const [doctorForm, setDoctorForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phoneNumber: '',
        specialtyId: '',
        experienceYears: '',
        description: ''
    });

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

            const patients = await patientsRes.json();
            const doctorsData = await doctorsRes.json();
            const activeDoctorsData = await activeDoctorsRes.json();
            const appointments = await appointmentsRes.json();
            const pendingAppointments = await pendingAppointmentsRes.json();
            const confirmedAppointments = await confirmedAppointmentsRes.json();
            const completedAppointments = await completedAppointmentsRes.json();
            const specialtiesData = await specialtiesRes.json();

            setStats({
                totalPatients: patients.length,
                totalDoctors: doctorsData.length,
                activeDoctors: activeDoctorsData.length,
                totalAppointments: appointments.length,
                pendingAppointments: pendingAppointments.length,
                confirmedAppointments: confirmedAppointments.length,
                completedAppointments: completedAppointments.length,
                totalSpecialties: specialtiesData.length
            });

            setRecentAppointments(appointments.slice(0, 10));
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
        setDoctorForm({
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            phoneNumber: '',
            specialtyId: '',
            experienceYears: '',
            description: ''
        });
        setShowDoctorForm(true);
    };

    const handleEditDoctor = (doctor) => {
        setEditingDoctor(doctor);
        setDoctorForm({
            firstName: doctor.user?.firstName || '',
            lastName: doctor.user?.lastName || '',
            email: doctor.user?.email || '',
            password: '',
            phoneNumber: doctor.user?.phoneNumber || '',
            specialtyId: doctor.specialty?.id || '',
            experienceYears: doctor.experienceYears || '',
            description: doctor.description || ''
        });
        setShowDoctorForm(true);
    };

    const handleCancelForm = () => {
        setShowDoctorForm(false);
        setEditingDoctor(null);
        setDoctorForm({
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            phoneNumber: '',
            specialtyId: '',
            experienceYears: '',
            description: ''
        });
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setDoctorForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmitDoctor = async (e) => {
        e.preventDefault();

        try {
            if (editingDoctor) {
                // Update existing doctor
                const userResponse = await fetch(`${API_BASE_URL}/users/${editingDoctor.user.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: doctorForm.email,
                        password: doctorForm.password || editingDoctor.user.password,
                        firstName: doctorForm.firstName,
                        lastName: doctorForm.lastName,
                        phoneNumber: doctorForm.phoneNumber,
                        role: 'DOCTOR'
                    })
                });

                if (!userResponse.ok) {
                    alert('Failed to update user information');
                    return;
                }

                const doctorResponse = await fetch(`${API_BASE_URL}/doctors/${editingDoctor.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user: { id: editingDoctor.user.id },
                        specialty: { id: parseInt(doctorForm.specialtyId) },
                        experienceYears: parseInt(doctorForm.experienceYears),
                        description: doctorForm.description,
                        isActive: editingDoctor.isActive,
                        popularity: editingDoctor.popularity
                    })
                });

                if (doctorResponse.ok) {
                    alert('Doctor updated successfully');
                    handleCancelForm();
                    fetchDashboardData();
                } else {
                    alert('Failed to update doctor');
                }
            } else {
                // Create new doctor
                const userResponse = await fetch(`${API_BASE_URL}/users`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: doctorForm.email,
                        password: doctorForm.password,
                        firstName: doctorForm.firstName,
                        lastName: doctorForm.lastName,
                        phoneNumber: doctorForm.phoneNumber,
                        role: 'DOCTOR'
                    })
                });

                if (!userResponse.ok) {
                    alert('Failed to create user');
                    return;
                }

                const newUser = await userResponse.json();

                const doctorResponse = await fetch(`${API_BASE_URL}/doctors`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user: { id: newUser.id },
                        specialty: { id: parseInt(doctorForm.specialtyId) },
                        experienceYears: parseInt(doctorForm.experienceYears),
                        description: doctorForm.description,
                        isActive: true,
                        popularity: 0
                    })
                });

                if (doctorResponse.ok) {
                    alert('Doctor added successfully');
                    handleCancelForm();
                    fetchDashboardData();
                } else {
                    alert('Failed to create doctor');
                }
            }
        } catch (err) {
            console.error('Error saving doctor:', err);
            alert('Error saving doctor');
        }
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
                            <div className="stat-icon">👥</div>
                            <div className="stat-info">
                                <h3>Total Patients</h3>
                                <p className="stat-number">{stats.totalPatients}</p>
                            </div>
                        </div>

                        <div className="stat-card stat-success">
                            <div className="stat-icon">⚕️</div>
                            <div className="stat-info">
                                <h3>Active Doctors</h3>
                                <p className="stat-number">{stats.activeDoctors} / {stats.totalDoctors}</p>
                            </div>
                        </div>

                        <div className="stat-card stat-warning">
                            <div className="stat-icon">📅</div>
                            <div className="stat-info">
                                <h3>Pending Appointments</h3>
                                <p className="stat-number">{stats.pendingAppointments}</p>
                            </div>
                        </div>

                        <div className="stat-card stat-info">
                            <div className="stat-icon">✅</div>
                            <div className="stat-info">
                                <h3>Confirmed Appointments</h3>
                                <p className="stat-number">{stats.confirmedAppointments}</p>
                            </div>
                        </div>

                        <div className="stat-card stat-completed">
                            <div className="stat-icon">✓</div>
                            <div className="stat-info">
                                <h3>Completed Appointments</h3>
                                <p className="stat-number">{stats.completedAppointments}</p>
                            </div>
                        </div>

                        <div className="stat-card stat-secondary">
                            <div className="stat-icon">🏥</div>
                            <div className="stat-info">
                                <h3>Specialties</h3>
                                <p className="stat-number">{stats.totalSpecialties}</p>
                            </div>
                        </div>
                    </div>

                    <div className="quick-actions">
                        <h2>Quick Actions</h2>
                        <div className="actions-grid">
                            <Link to="/admin/reports" className="action-card">
                                <span className="action-icon">📊</span>
                                <span>View Reports</span>
                            </Link>
                            <button onClick={() => setActiveTab('doctors')} className="action-card">
                                <span className="action-icon">👨‍⚕️</span>
                                <span>Manage Doctors</span>
                            </button>
                            <button onClick={() => setActiveTab('appointments')} className="action-card">
                                <span className="action-icon">📋</span>
                                <span>View Appointments</span>
                            </button>
                            <button onClick={fetchDashboardData} className="action-card">
                                <span className="action-icon">🔄</span>
                                <span>Refresh Data</span>
                            </button>
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
                        <div className="modal-overlay">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h3>{editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}</h3>
                                    <button onClick={handleCancelForm} className="btn-close">×</button>
                                </div>
                                <form onSubmit={handleSubmitDoctor} className="doctor-form">
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="firstName">First Name *</label>
                                            <input
                                                type="text"
                                                id="firstName"
                                                name="firstName"
                                                value={doctorForm.firstName}
                                                onChange={handleFormChange}
                                                required
                                                className="form-input"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="lastName">Last Name *</label>
                                            <input
                                                type="text"
                                                id="lastName"
                                                name="lastName"
                                                value={doctorForm.lastName}
                                                onChange={handleFormChange}
                                                required
                                                className="form-input"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="email">Email *</label>
                                            <input
                                                type="email"
                                                id="email"
                                                name="email"
                                                value={doctorForm.email}
                                                onChange={handleFormChange}
                                                required
                                                className="form-input"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="phoneNumber">Phone Number *</label>
                                            <input
                                                type="tel"
                                                id="phoneNumber"
                                                name="phoneNumber"
                                                value={doctorForm.phoneNumber}
                                                onChange={handleFormChange}
                                                required
                                                className="form-input"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="password">Password {!editingDoctor && '*'}</label>
                                        <input
                                            type="password"
                                            id="password"
                                            name="password"
                                            value={doctorForm.password}
                                            onChange={handleFormChange}
                                            required={!editingDoctor}
                                            className="form-input"
                                            placeholder={editingDoctor ? 'Leave blank to keep current password' : ''}
                                        />
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="specialtyId">Specialty *</label>
                                            <select
                                                id="specialtyId"
                                                name="specialtyId"
                                                value={doctorForm.specialtyId}
                                                onChange={handleFormChange}
                                                required
                                                className="form-input"
                                            >
                                                <option value="">Select Specialty</option>
                                                {specialties.map(specialty => (
                                                    <option key={specialty.id} value={specialty.id}>
                                                        {specialty.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="experienceYears">Experience (years) *</label>
                                            <input
                                                type="number"
                                                id="experienceYears"
                                                name="experienceYears"
                                                value={doctorForm.experienceYears}
                                                onChange={handleFormChange}
                                                required
                                                min="0"
                                                className="form-input"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="description">Description</label>
                                        <textarea
                                            id="description"
                                            name="description"
                                            value={doctorForm.description}
                                            onChange={handleFormChange}
                                            rows="4"
                                            className="form-input"
                                            placeholder="Enter doctor's description, qualifications, etc."
                                        />
                                    </div>

                                    <div className="form-actions">
                                        <button type="button" onClick={handleCancelForm} className="btn-cancel">
                                            Cancel
                                        </button>
                                        <button type="submit" className="btn-submit">
                                            {editingDoctor ? 'Update Doctor' : 'Add Doctor'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
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
                                    <th>Date & Time</th>
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