import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MedicalReportGenerator from '../components/MedicalReportGenerator';
import MedicalReportViewer from '../components/MedicalReportViewer';
import './DoctorDashboard.css';

const API_BASE_URL = 'http://localhost:7000/api';

function DoctorDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [doctorInfo, setDoctorInfo] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [filteredAppointments, setFilteredAppointments] = useState([]);
    const [availabilities, setAvailabilities] = useState([]);
    const [medicalReports, setMedicalReports] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [activeTab, setActiveTab] = useState('upcoming');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [showReportGenerator, setShowReportGenerator] = useState(false);
    const [showReportViewer, setShowReportViewer] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [selectedReport, setSelectedReport] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);

    useEffect(() => {
        if (!user || user.role !== 'DOCTOR') {
            navigate('/');
            return;
        }
        fetchDoctorData();
    }, [user, navigate]);

    useEffect(() => {
        filterAppointments();
    }, [appointments, activeTab, statusFilter]);

    const fetchMedicalReports = async (appointmentsData) => {
        const reportsMap = {};
        const completedAppointments = appointmentsData.filter(apt => apt.status === 'COMPLETED');

        for (const appointment of completedAppointments) {
            try {
                const response = await fetch(`${API_BASE_URL}/medical-reports/appointment/${appointment.id}`);
                if (response.ok) {
                    const report = await response.json();
                    reportsMap[appointment.id] = report;
                }
            } catch (err) {
                console.error(`Error fetching report for appointment ${appointment.id}:`, err);
            }
        }

        setMedicalReports(reportsMap);
    };

    const fetchDoctorData = async () => {
        try {
            setLoading(true);
            setError(null);

            
            const doctorResponse = await fetch(`${API_BASE_URL}/doctors/user/${user.id}`);
            if (!doctorResponse.ok) {
                throw new Error('Failed to fetch doctor information');
            }
            const doctorData = await doctorResponse.json();
            setDoctorInfo(doctorData);

            
            const appointmentsResponse = await fetch(`${API_BASE_URL}/appointments/doctor/${doctorData.id}`);
            if (!appointmentsResponse.ok) {
                throw new Error('Failed to fetch appointments');
            }
            const appointmentsData = await appointmentsResponse.json();
            setAppointments(appointmentsData);

            // Fetch medical reports for completed appointments
            await fetchMedicalReports(appointmentsData);


            const availabilitiesResponse = await fetch(`${API_BASE_URL}/availability/doctor/${doctorData.id}`);
            if (availabilitiesResponse.ok) {
                const availabilitiesData = await availabilitiesResponse.json();
                setAvailabilities(availabilitiesData);
            }

            setLoading(false);
        } catch (err) {
            console.error('Error fetching doctor data:', err);
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
                fetchDoctorData();
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

    const handleCompleteAppointment = async (appointmentId) => {
        if (!window.confirm('Mark this appointment as completed?')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/complete`, {
                method: 'PUT'
            });

            if (response.ok) {
                setSuccess('Appointment marked as completed');
                fetchDoctorData();
                setTimeout(() => setSuccess(null), 3000);
            } else {
                setError('Failed to update appointment');
                setTimeout(() => setError(null), 3000);
            }
        } catch (err) {
            console.error('Error completing appointment:', err);
            setError('Error updating appointment');
            setTimeout(() => setError(null), 3000);
        }
    };

    const handleMarkAsPending = async (appointmentId) => {
        if (!window.confirm('Mark this appointment as pending?')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/pending`, {
                method: 'PUT'
            });

            if (response.ok) {
                setSuccess('Appointment marked as pending');
                fetchDoctorData();
                setTimeout(() => setSuccess(null), 3000);
            } else {
                setError('Failed to update appointment');
                setTimeout(() => setError(null), 3000);
            }
        } catch (err) {
            console.error('Error updating appointment:', err);
            setError('Error updating appointment');
            setTimeout(() => setError(null), 3000);
        }
    };

    const handleGenerateReport = (appointment) => {
        setSelectedAppointment(appointment);
        setSelectedReport(null);
        setIsEditMode(false);
        setShowReportGenerator(true);
    };

    const handleViewReport = (appointment) => {
        const report = medicalReports[appointment.id];
        if (report) {
            setSelectedReport(report);
            setShowReportViewer(true);
        }
    };

    const handleEditReport = (appointment) => {
        const report = medicalReports[appointment.id];
        if (report) {
            setSelectedAppointment(appointment);
            setSelectedReport(report);
            setIsEditMode(true);
            setShowReportGenerator(true);
        }
    };

    const handleReportCreated = (report) => {
        setSuccess('Medical report created successfully');
        setTimeout(() => setSuccess(null), 3000);
        fetchDoctorData();
    };

    const handleReportUpdated = (report) => {
        setSuccess('Medical report updated successfully');
        setTimeout(() => setSuccess(null), 3000);
        fetchDoctorData();
    };

    const formatDateTime = (dateTimeString) => {
        if (!dateTimeString) return 'N/A';
        const date = new Date(dateTimeString);
        return date.toLocaleString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
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

    const getTodayAppointments = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return appointments.filter(apt => {
            const aptDate = new Date(apt.appointmentDate);
            return aptDate >= today && aptDate < tomorrow && 
                   (apt.status === 'CONFIRMED' || apt.status === 'PENDING');
        });
    };

    if (loading) {
        return (
            <div className="doctor-dashboard">
                <div className="loading">Loading dashboard data...</div>
            </div>
        );
    }

    if (error && !doctorInfo) {
        return (
            <div className="doctor-dashboard">
                <div className="error">{error}</div>
                <button onClick={fetchDoctorData} className="btn-retry">Retry</button>
            </div>
        );
    }

    const stats = getAppointmentStats();
    const todayAppointments = getTodayAppointments();

    return (
        <div className="doctor-dashboard">
            <div className="dashboard-header">
                <div className="header-content">
                    <div className="doctor-welcome">
                        <h1>Welcome, Dr. {user?.firstName} {user?.lastName}</h1>
                        <p className="specialty">{doctorInfo?.specialty?.name}</p>
                        <p className="experience">{doctorInfo?.experienceYears} years of experience</p>
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

            {/* Statistics */}
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

                <div className="stat-card stat-cancelled">
                    <div className="stat-info">
                        <h3>Cancelled</h3>
                        <p className="stat-number">{stats.cancelled}</p>
                    </div>
                </div>

                <div className="stat-card stat-total">
                    <div className="stat-info">
                        <h3>Total</h3>
                        <p className="stat-number">{stats.total}</p>
                    </div>
                </div>
            </div>

            {todayAppointments.length > 0 && (
                <div className="today-section">
                    <h2>Today's Appointments ({todayAppointments.length})</h2>
                    <div className="today-appointments">
                        {todayAppointments.map(appointment => (
                            <div key={appointment.id} className="today-appointment-card">
                                <div className="appointment-time">
                                    <span className="time">{formatTime(appointment.appointmentDate)}</span>
                                </div>
                                <div className="appointment-patient">
                                    <h4>
                                        {appointment.patient?.firstName} {appointment.patient?.lastName}
                                    </h4>
                                    <p>{appointment.notes || 'No notes provided'}</p>
                                </div>
                                <span className={`status-badge ${getStatusBadgeClass(appointment.status)}`}>
                                    {appointment.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="appointments-section">
                <div className="section-header">
                    <h2>Appointments</h2>
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
                                        <div className="patient-info">
                                            <div className="patient-avatar">
                                                {appointment.patient?.firstName?.charAt(0)}
                                                {appointment.patient?.lastName?.charAt(0)}
                                            </div>
                                            <div className="patient-details">
                                                <h3>
                                                    {appointment.patient?.firstName} {appointment.patient?.lastName}
                                                </h3>
                                                <p className="patient-contact">{appointment.patient?.email}</p>
                                                <p className="patient-contact">{appointment.patient?.phoneNumber}</p>
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
                                            {appointment.cost && (
                                                <div className="detail-item">
                                                    <div className="detail-content">
                                                        <span className="detail-label">Cost</span>
                                                        <span className="detail-value">${appointment.cost}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {appointment.notes && (
                                        <div className="appointment-notes">
                                            <h4>Patient Notes:</h4>
                                            <p>{appointment.notes}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="appointment-actions">
                                    {(appointment.status === 'CONFIRMED' || appointment.status === 'PENDING') && (
                                        <>
                                            <button
                                                onClick={() => handleCompleteAppointment(appointment.id)}
                                                className="btn-complete"
                                            >
                                                ✓ Complete
                                            </button>
                                            <button
                                                onClick={() => handleCancelAppointment(appointment.id)}
                                                className="btn-cancel-appointment"
                                            >
                                                Cancel
                                            </button>
                                        </>
                                    )}
                                    {appointment.status === 'COMPLETED' && (
                                        <>
                                            {medicalReports[appointment.id] ? (
                                                <>
                                                    <button
                                                        onClick={() => handleViewReport(appointment)}
                                                        className="btn-view-report"
                                                    >
                                                        👁 View Report
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditReport(appointment)}
                                                        className="btn-edit-report"
                                                    >
                                                        ✏️ Edit Report
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={() => handleGenerateReport(appointment)}
                                                    className="btn-generate-report"
                                                >
                                                    📋 Generate Medical Report
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleMarkAsPending(appointment.id)}
                                                className="btn-mark-pending"
                                            >
                                                ← Mark as Pending
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="availability-section">
                <h2>Your Availability</h2>
                {availabilities.length === 0 ? (
                    <p className="no-availability">You haven't set your availability yet. Please contact the administrator.</p>
                ) : (
                    <div className="availability-grid">
                        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => {
                            const dayAvailabilities = availabilities.filter(
                                a => parseInt(a.dayOfWeek) === index && a.isActive
                            );
                            return (
                                <div key={index} className="availability-day">
                                    <h4>{day}</h4>
                                    {dayAvailabilities.length === 0 ? (
                                        <p className="no-slots">Not available</p>
                                    ) : (
                                        <div className="time-slots-list">
                                            {dayAvailabilities.map((slot, idx) => (
                                                <div key={idx} className="time-slot-item">
                                                    {slot.startTime} - {slot.endTime}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {showReportGenerator && selectedAppointment && (
                <MedicalReportGenerator
                    appointment={selectedAppointment}
                    existingReport={isEditMode ? selectedReport : null}
                    isEditMode={isEditMode}
                    onClose={() => {
                        setShowReportGenerator(false);
                        setSelectedAppointment(null);
                        setSelectedReport(null);
                        setIsEditMode(false);
                    }}
                    onReportCreated={isEditMode ? handleReportUpdated : handleReportCreated}
                />
            )}

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

export default DoctorDashboard;