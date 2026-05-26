import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MedicalReportGenerator from '../components/MedicalReportGenerator';
import MedicalReportViewer from '../components/MedicalReportViewer';
import './DoctorDashboard.css';

const API_BASE_URL = 'http://localhost:7000/api';

function DoctorDashboard() {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [doctorInfo, setDoctorInfo] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [filteredAppointments, setFilteredAppointments] = useState([]);
    const [medicalReports, setMedicalReports] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [activeTab, setActiveTab] = useState('upcoming');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [showReportGenerator, setShowReportGenerator] = useState(false);
    const [showReportViewer, setShowReportViewer] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [selectedReport, setSelectedReport] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);

    useEffect(() => {
        if (authLoading) return;
        if (!user || user.role !== 'DOCTOR') {
            navigate('/');
            return;
        }
        fetchDoctorData();
    }, [user, authLoading, navigate]);

    useEffect(() => {
        filterAppointments();
    }, [appointments, activeTab, statusFilter, searchQuery]);

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

        // Filter by search query (patient name or ID)
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(apt => {
                const patientName = `${apt.patient?.firstName || ''} ${apt.patient?.lastName || ''}`.toLowerCase();
                const patientId = apt.patient?.id?.toString() || '';
                const appointmentId = apt.id?.toString() || '';

                return patientName.includes(query) ||
                       patientId.includes(query) ||
                       appointmentId.includes(query);
            });
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

            {/* Main appointments section */}
            <div className="my-appointments-section">
                <div className="appointments-container">

                    <div className="section-header">
                        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px', flexWrap: 'nowrap' }}>
                            <div>
                                <p className="dashboard-title" style={{ whiteSpace: 'nowrap' }}>Dashboard</p>
                                <p className="dd-subtitle">Dr. {user?.firstName} {user?.lastName} · {doctorInfo?.specialty?.name} · {doctorInfo?.experienceYears}y exp.</p>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '6px', flexWrap: 'nowrap' }}>
                                <div className="stat-card">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#7c6bc9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                    <span className="stat-label">Upcoming</span><span className="stat-number">{stats.upcoming}</span>
                                </div>
                                <div className="stat-card">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#7c6bc9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>
                                    <span className="stat-label">Completed</span><span className="stat-number">{stats.completed}</span>
                                </div>
                                <div className="stat-card">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#7c6bc9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                                    <span className="stat-label">Cancelled</span><span className="stat-number">{stats.cancelled}</span>
                                </div>
                                <div className="stat-card">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#7c6bc9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                                    <span className="stat-label">Total</span><span className="stat-number">{stats.total}</span>
                                </div>
                            </div>
                        </div>
                        <div className="header-controls">
                            <div className="tabs">
                                <button className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`} onClick={() => setActiveTab('upcoming')}>Upcoming</button>
                                <button className={`tab-btn ${activeTab === 'past' ? 'active' : ''}`} onClick={() => setActiveTab('past')}>Past</button>
                            </div>
                            <input
                                type="text"
                                placeholder="Search patient..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="status-filter dd-search"
                            />
                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="status-filter">
                                <option value="ALL">All Status</option>
                                <option value="PENDING">Pending</option>
                                <option value="CONFIRMED">Confirmed</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="CANCELLED">Cancelled</option>
                                <option value="REJECTED">Rejected</option>
                            </select>
                        </div>
                    </div>

                    {todayAppointments.length > 0 && (
                        <div className="dd-today-banner">
                            <span className="dd-today-label">Today ({todayAppointments.length})</span>
                            {todayAppointments.map(apt => (
                                <span key={apt.id} className="dd-today-item">
                                    {formatTime(apt.appointmentDate)} — {apt.patient?.firstName} {apt.patient?.lastName}
                                </span>
                            ))}
                        </div>
                    )}

                    {filteredAppointments.length === 0 ? (
                        <div className="no-appointments"><p>No appointments found.</p></div>
                    ) : (
                        <div className="appointments-list">
                            {filteredAppointments.map(appointment => (
                                <div key={appointment.id} className="appointment-card">
                                    <div className="appointment-header">
                                        {appointment.status === 'COMPLETED' && !medicalReports[appointment.id] && (
                                            <span className="status-badge badge-missing-report" style={{ fontSize: '10px' }}>Action Required</span>
                                        )}
                                        <span className={`status-badge ${getStatusBadgeClass(appointment.status)}`}>
                                            {appointment.status}
                                        </span>
                                    </div>

                                    <div className="appointment-body">
                                        <div className="appointment-main-info">
                                            <div className="doctor-info">
                                                <div className="doctor-avatar">
                                                    {appointment.patient?.firstName?.charAt(0)}
                                                    {appointment.patient?.lastName?.charAt(0)}
                                                </div>
                                                <div className="doctor-details">
                                                    <h3>{appointment.patient?.firstName} {appointment.patient?.lastName}</h3>
                                                    <p className="doctor-specialty">{appointment.patient?.email}</p>
                                                    <p className="doctor-experience">{appointment.patient?.phoneNumber}</p>
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
                                                <h4>Patient Notes:</h4>
                                                <p>{appointment.notes}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="appointment-actions">
                                        {(appointment.status === 'CONFIRMED' || appointment.status === 'PENDING') && (
                                            <>
                                                <button onClick={() => handleCompleteAppointment(appointment.id)} className="btn-complete">Complete</button>
                                                <button onClick={() => handleCancelAppointment(appointment.id)} className="btn-cancel">Cancel</button>
                                            </>
                                        )}
                                        {appointment.status === 'COMPLETED' && (
                                            <>
                                                {medicalReports[appointment.id] ? (
                                                    <>
                                                        <button onClick={() => handleViewReport(appointment)} className="btn-view-report">View Report</button>
                                                        <button onClick={() => handleEditReport(appointment)} className="btn-edit-report">Edit Report</button>
                                                    </>
                                                ) : (
                                                    <button onClick={() => handleGenerateReport(appointment)} className="btn-generate-report">Generate Medical Report</button>
                                                )}
                                                <button onClick={() => handleMarkAsPending(appointment.id)} className="btn-mark-pending">Mark as Pending</button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Booked hours section */}
            <div className="my-appointments-section" style={{ marginTop: '24px' }}>
                <div className="appointments-container">
                    <div className="section-header" style={{ marginBottom: '16px' }}>
                        <p className="dashboard-title" style={{ whiteSpace: 'nowrap' }}>Booked Hours</p>
                    </div>
                    {(() => {
                        const now = new Date();
                        now.setHours(0, 0, 0, 0);
                        const booked = appointments
                            .filter(a => (a.status === 'CONFIRMED' || a.status === 'PENDING') && new Date(a.appointmentDate) >= now)
                            .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate));

                        if (booked.length === 0) {
                            return <p style={{ color: '#888', fontSize: '14px' }}>No upcoming booked appointments.</p>;
                        }

                        const byDate = {};
                        booked.forEach(apt => {
                            const d = new Date(apt.appointmentDate);
                            const key = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                            if (!byDate[key]) byDate[key] = [];
                            byDate[key].push(apt);
                        });

                        return (
                            <div className="dd-booked-grid">
                                {Object.entries(byDate).map(([date, apts]) => (
                                    <div key={date} className="dd-booked-day">
                                        <h4 className="dd-booked-date">{date}</h4>
                                        {apts.map(apt => (
                                            <div key={apt.id} className="dd-booked-slot">
                                                <span className="dd-booked-time">{formatTime(apt.appointmentDate)}</span>
                                                <span className="dd-booked-patient">{apt.patient?.firstName} {apt.patient?.lastName}</span>
                                                <span className={`status-badge ${getStatusBadgeClass(apt.status)}`} style={{ fontSize: '10px', padding: '2px 6px' }}>{apt.status}</span>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        );
                    })()}
                </div>
            </div>

            {showReportGenerator && selectedAppointment && (
                <div className="modal-overlay">
                    <div className="modal-content report-modal-container">
                        <MedicalReportGenerator
                            appointment={selectedAppointment}
                            existingReport={isEditMode ? selectedReport : null}
                            isEditMode={isEditMode}
                            onClose={() => { setShowReportGenerator(false); setSelectedAppointment(null); setSelectedReport(null); setIsEditMode(false); }}
                            onReportCreated={isEditMode ? handleReportUpdated : handleReportCreated}
                        />
                    </div>
                </div>
            )}

            {showReportViewer && selectedReport && (
                <div className="modal-overlay">
                    <div className="modal-content report-modal-container">
                        <MedicalReportViewer
                            report={selectedReport}
                            onClose={() => { setShowReportViewer(false); setSelectedReport(null); }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default DoctorDashboard;