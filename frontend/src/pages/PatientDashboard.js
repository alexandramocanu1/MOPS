import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MedicalReportViewer from '../components/MedicalReportViewer';
import './PatientDashboard.css';

const API_BASE_URL = 'http://localhost:7000/api';

function PatientDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [appointments, setAppointments] = useState([]);
    const [medicalReports, setMedicalReports] = useState([]);
    const [filteredAppointments, setFilteredAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [activeTab, setActiveTab] = useState('upcoming');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [selectedReport, setSelectedReport] = useState(null);
    const [showReportViewer, setShowReportViewer] = useState(false);

    useEffect(() => {
        if (!user || user.role !== 'PATIENT') {
            navigate('/');
            return;
        }
        fetchPatientData();
    }, [user, navigate]);

    useEffect(() => {
        filterAppointments();
    }, [appointments, activeTab, statusFilter]);

    const fetchPatientData = async () => {
        try {
            setLoading(true);
            setError(null);

            
            const appointmentsResponse = await fetch(`${API_BASE_URL}/appointments/patient/${user.id}`);
            if (!appointmentsResponse.ok) {
                throw new Error('Failed to fetch appointments');
            }
            const appointmentsData = await appointmentsResponse.json();
            setAppointments(appointmentsData);

            // Fetch medical reports
            const reportsResponse = await fetch(`${API_BASE_URL}/medical-reports/patient/${user.id}`);
            if (reportsResponse.ok) {
                const reportsData = await reportsResponse.json();
                setMedicalReports(reportsData);
            }

            setLoading(false);
        } catch (err) {
            console.error('Error fetching patient data:', err);
            setError('Failed to load dashboard data. Please try again.');
            setLoading(false);
        }
    };

    const filterAppointments = () => {
        let filtered = [...appointments];

        const now = new Date();
        if (activeTab === 'upcoming') {
            filtered = filtered.filter(apt => new Date(apt.appointmentDate) >= now);
            filtered.sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate));
        } else {
            filtered = filtered.filter(apt => new Date(apt.appointmentDate) < now);
            filtered.sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate));
        }

        if (statusFilter !== 'ALL') {
            filtered = filtered.filter(apt => apt.status === statusFilter);
        }

        setFilteredAppointments(filtered);
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
                setSuccess('Appointment cancelled successfully');
                fetchPatientData();
                setTimeout(() => setSuccess(null), 3000);
            } else {
                setError('Failed to cancel appointment');
                setTimeout(() => setError(null), 3000);
            }
        } catch (err) {
            console.error('Error cancelling appointment:', err);
            setError('Error cancelling appointment');
            setTimeout(() => setError(null), 3000);
        }
    };

    const handleViewReport = async (appointmentId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/medical-reports/appointment/${appointmentId}`);
            if (response.ok) {
                const report = await response.json();
                setSelectedReport(report);
                setShowReportViewer(true);
            } else {
                setError('Medical report not found for this appointment');
                setTimeout(() => setError(null), 3000);
            }
        } catch (err) {
            console.error('Error fetching report:', err);
            setError('Failed to load medical report');
            setTimeout(() => setError(null), 3000);
        }
    };

    const formatDate = (dateTimeString) => {
        if (!dateTimeString) return 'N/A';
        const date = new Date(dateTimeString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (dateTimeString) => {
        if (!dateTimeString) return 'N/A';
        const date = new Date(dateTimeString);
        return date.toLocaleTimeString('en-US', {
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

    const getAppointmentStats = () => {
        const now = new Date();
        const upcoming = appointments.filter(apt =>
            new Date(apt.appointmentDate) >= now &&
            (apt.status === 'CONFIRMED' || apt.status === 'PENDING')
        ).length;
        const completed = appointments.filter(apt => apt.status === 'COMPLETED').length;
        const cancelled = appointments.filter(apt =>
            apt.status === 'CANCELLED' || apt.status === 'REJECTED'
        ).length;

        return { upcoming, completed, cancelled, total: appointments.length };
    };

    const hasReport = (appointmentId) => {
        return medicalReports.some(report => report.appointment?.id === appointmentId);
    };

    if (loading) {
        return (
            <div className="patient-dashboard">
                <div className="loading">Loading dashboard data...</div>
            </div>
        );
    }

    if (error && !appointments.length) {
        return (
            <div className="patient-dashboard">
                <div className="error">{error}</div>
                <button onClick={fetchPatientData} className="btn-retry">Retry</button>
            </div>
        );
    }

    const stats = getAppointmentStats();

    return (
        <div className="patient-dashboard">
            <div className="dashboard-header">
                <div className="header-content">
                    <div className="patient-welcome">
                        <h1>Welcome, {user?.firstName} {user?.lastName}</h1>
                        <p className="patient-info">Manage your appointments and view medical reports</p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="alert alert-error">
                    {error}
                    <button onClick={() => setError(null)} className="alert-close">×</button>
                </div>
            )}

            {success && (
                <div className="alert alert-success">
                    {success}
                    <button onClick={() => setSuccess(null)} className="alert-close">×</button>
                </div>
            )}

            <div className="stats-section">
                <div className="stat-card stat-upcoming">
                    <div className="stat-info">
                        <h3>Upcoming</h3>
                        <p className="stat-number">{stats.upcoming}</p>
                    </div>
                </div>

                <div className="stat-card stat-completed">
                    <div className="stat-info">
                        <h3>Completed</h3>
                        <p className="stat-number">{stats.completed}</p>
                    </div>
                </div>

                <div className="stat-card stat-reports">
                    <div className="stat-info">
                        <h3>Medical Reports</h3>
                        <p className="stat-number">{medicalReports.length}</p>
                    </div>
                </div>

                <div className="stat-card stat-total">
                    <div className="stat-info">
                        <h3>Total</h3>
                        <p className="stat-number">{stats.total}</p>
                    </div>
                </div>
            </div>

            <div className="appointments-section">
                <div className="section-header">
                    <h2>My Appointments</h2>
                    <div className="header-controls">
                        <div className="tabs">
                            <button
                                className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
                                onClick={() => setActiveTab('upcoming')}
                            >
                                Upcoming
                            </button>
                            <button
                                className={`tab-btn ${activeTab === 'past' ? 'active' : ''}`}
                                onClick={() => setActiveTab('past')}
                            >
                                Past
                            </button>
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="status-filter"
                        >
                            <option value="ALL">All Status</option>
                            <option value="PENDING">Pending</option>
                            <option value="CONFIRMED">Confirmed</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                            <option value="REJECTED">Rejected</option>
                        </select>
                    </div>
                </div>

                {filteredAppointments.length === 0 ? (
                    <div className="no-appointments">
                        <p>No appointments found</p>
                    </div>
                ) : (
                    <div className="appointments-list">
                        {filteredAppointments.map(appointment => (
                            <div key={appointment.id} className="appointment-card">
                                <div className="appointment-header">
                                    <div className="appointment-id">
                                        <span>#{appointment.id}</span>
                                    </div>
                                    <span className={`status-badge ${getStatusBadgeClass(appointment.status)}`}>
                                        {appointment.status}
                                    </span>
                                </div>

                                <div className="appointment-body">
                                    <div className="appointment-main-info">
                                        <div className="doctor-info">
                                            <div className="doctor-avatar">
                                                {appointment.doctor?.user?.firstName?.charAt(0)}
                                                {appointment.doctor?.user?.lastName?.charAt(0)}
                                            </div>
                                            <div className="doctor-details">
                                                <h3>
                                                    Dr. {appointment.doctor?.user?.firstName} {appointment.doctor?.user?.lastName}
                                                </h3>
                                                <p className="doctor-specialty">{appointment.doctor?.specialty?.name}</p>
                                                <p className="doctor-experience">{appointment.doctor?.experienceYears} years of experience</p>
                                            </div>
                                        </div>

                                        <div className="appointment-details">
                                            <div className="detail-item">
                                                <div className="detail-content">
                                                    <span className="detail-label">Date</span>
                                                    <span className="detail-value">{formatDate(appointment.appointmentDate)}</span>
                                                </div>
                                            </div>
                                            <div className="detail-item">
                                                <div className="detail-content">
                                                    <span className="detail-label">Time</span>
                                                    <span className="detail-value">{formatTime(appointment.appointmentDate)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {appointment.notes && (
                                        <div className="appointment-notes">
                                            <h4>Your Notes:</h4>
                                            <p>{appointment.notes}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="appointment-actions">
                                    {appointment.status === 'COMPLETED' && hasReport(appointment.id) && (
                                        <button
                                            onClick={() => handleViewReport(appointment.id)}
                                            className="btn-view-report"
                                        >
                                             View Medical Report
                                        </button>
                                    )}
                                    {(appointment.status === 'PENDING' || appointment.status === 'CONFIRMED') && activeTab === 'upcoming' && (
                                        <button
                                            onClick={() => handleCancelAppointment(appointment.id)}
                                            className="btn-cancel-appointment"
                                        >
                                            Cancel Appointment
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showReportViewer && selectedReport && (
                <MedicalReportViewer
                    report={selectedReport}
                    onClose={() => {
                        setShowReportViewer(false);
                        setSelectedReport(null);
                    }}
                />
            )}
        </div>
    );
}

export default PatientDashboard;
