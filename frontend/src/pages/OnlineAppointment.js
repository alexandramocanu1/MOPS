import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isFunctionalAllowed } from '../hooks/useCookiePreferences';
import MedicalReportViewer from '../components/MedicalReportViewer';
import './OnlineAppoinment.css';

const API_BASE_URL = 'http://localhost:7000/api';

function OnlineAppoinment() {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [activeView, setActiveView] = useState('book');
    const [specialties, setSpecialties] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [filteredDoctors, setFilteredDoctors] = useState([]);
    const [myAppointments, setMyAppointments] = useState([]);
    const [availabilities, setAvailabilities] = useState([]);

    const [selectedSpecialty, setSelectedSpecialty] = useState('');
    const [doctorSearch, setDoctorSearch] = useState('');
    const [sortBy, setSortBy] = useState('');
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const [doctorNextSlots, setDoctorNextSlots] = useState({});
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [notes, setNotes] = useState('');

    // Stare pentru reprogramare
    const [isRescheduling, setIsRescheduling] = useState(false);
    const [reschedulingAppointment, setReschedulingAppointment] = useState(null);

    const [doctorAppointments, setDoctorAppointments] = useState([]);

    const [medicalReports, setMedicalReports] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    const [showReportViewer, setShowReportViewer] = useState(false);

    const [activeTab, setActiveTab] = useState('upcoming');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [monthFilter, setMonthFilter] = useState('ALL');
    const [filteredAppointments, setFilteredAppointments] = useState([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
    if (authLoading) return;
    if (!user) {
        navigate('/login');
        return;
    }
    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
}, [user, navigate, authLoading]); 

    useEffect(() => {
        let filtered = doctors.filter(d => d.isActive);
        if (selectedSpecialty) {
            filtered = filtered.filter(d => d.specialty?.id === parseInt(selectedSpecialty));
        }
        if (doctorSearch.trim()) {
            const q = doctorSearch.trim().toLowerCase();
            filtered = filtered.filter(d => {
                const name = (d.user?.fullName ||
                    (d.user?.firstName && d.user?.lastName
                        ? `${d.user.firstName} ${d.user.lastName}`
                        : '')).toLowerCase();
                const specialty = (d.specialty?.name || '').toLowerCase();
                const description = (d.description || '').toLowerCase();
                const experience = d.experienceYears != null ? `${d.experienceYears} years` : '';
                return name.includes(q) || specialty.includes(q) || description.includes(q) || experience.includes(q);
            });
        }
        if (sortBy === 'popularity') {
            filtered = [...filtered].sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
        } else if (sortBy === 'experience') {
            filtered = [...filtered].sort((a, b) => (b.experienceYears ?? 0) - (a.experienceYears ?? 0));
        } else if (sortBy === 'firstAvailable') {
            filtered = [...filtered].sort((a, b) => {
                const sa = doctorNextSlots[a.id] ?? Infinity;
                const sb = doctorNextSlots[b.id] ?? Infinity;
                return sa - sb;
            });
        }
        setFilteredDoctors(filtered);
        if (!isRescheduling) {
            setSelectedDoctor(null);
        }
    }, [selectedSpecialty, doctorSearch, sortBy, doctors, isRescheduling, doctorNextSlots]);

    useEffect(() => {
        if (sortBy !== 'firstAvailable') return;
        const compute = async () => {
            const [availRes, apptRes] = await Promise.all([
                fetch(`${API_BASE_URL}/availability`),
                fetch(`${API_BASE_URL}/appointments`)
            ]);
            const allAvail = await availRes.json();
            const allAppts = await apptRes.json();

            const bookedSet = new Set(
                allAppts
                    .filter(a => a.status !== 'CANCELLED' && a.status !== 'REJECTED' && a.status !== 'COMPLETED')
                    .map(a => {
                        const d = new Date(a.appointmentDate);
                        const dateStr = d.toISOString().split('T')[0];
                        const timeStr = d.toTimeString().slice(0, 5);
                        return `${a.doctor?.id}_${dateStr}_${timeStr}`;
                    })
            );

            const slots = {};
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            doctors.filter(d => d.isActive).forEach(doctor => {
                const doctorAvails = allAvail.filter(av => av.doctor?.id === doctor.id && av.isActive);
                if (!doctorAvails.length) { slots[doctor.id] = Infinity; return; }

                for (let i = 0; i < 60; i++) {
                    const day = new Date(today);
                    day.setDate(today.getDate() + i);
                    const dayOfWeek = day.getDay();
                    const dateStr = day.toISOString().split('T')[0];

                    const match = doctorAvails.find(av => parseInt(av.dayOfWeek) === dayOfWeek);
                    if (!match) continue;

                    const timeStr = typeof match.startTime === 'string'
                        ? match.startTime.slice(0, 5)
                        : `${String(match.startTime.hour).padStart(2, '0')}:${String(match.startTime.minute).padStart(2, '0')}`;

                    const key = `${doctor.id}_${dateStr}_${timeStr}`;
                    if (!bookedSet.has(key)) {
                        slots[doctor.id] = day.getTime();
                        return;
                    }
                }
                if (slots[doctor.id] === undefined) slots[doctor.id] = Infinity;
            });

            setDoctorNextSlots(slots);
        };
        compute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sortBy, doctors]);

    useEffect(() => {
        if (selectedDoctor) {
            fetchDoctorAvailability(selectedDoctor.id);
            fetchDoctorAppointments(selectedDoctor.id);
        } else {
            setAvailabilities([]);
            setDoctorAppointments([]);
        }
    }, [selectedDoctor]);

    useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const activeViewParam = urlParams.get('view');
    const pendingAppointmentId = isFunctionalAllowed() ? localStorage.getItem('pendingAppointmentId') : null;

    const handlePaymentSuccess = (appointmentId) => {
        localStorage.removeItem('pendingAppointmentId');
        fetch(`${API_BASE_URL}/appointments/${appointmentId}/confirm-payment`, {
            method: 'PUT'
        }).then(() => {
            setSuccess('Payment successful! Your appointment has been confirmed. A confirmation email has been sent.');
            setActiveView('myappointments');
            fetchMyAppointments();
        });
        setTimeout(() => setSuccess(null), 5000);
    };

    if (paymentStatus === 'success' && pendingAppointmentId) {
        handlePaymentSuccess(pendingAppointmentId);
        navigate('/appointments?view=myappointments', { replace: true });
    } else if (activeViewParam === 'myappointments' && pendingAppointmentId) {
        // Stripe redirected back with ?view=myappointments after payment
        handlePaymentSuccess(pendingAppointmentId);
    } else if (paymentStatus === 'cancelled') {
        localStorage.removeItem('pendingAppointmentId');
        setError('Payment was cancelled. Please try again or contact support.');
        navigate('/appointments?view=book', { replace: true });
        setTimeout(() => setError(null), 5000);
    }
// eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

    useEffect(() => {
        const view = searchParams.get('view');
        if (view === 'myappointments') {
            setActiveView('myappointments');
            setIsRescheduling(false);
            setReschedulingAppointment(null);
        } else {
            setActiveView('book');
        }
    }, [searchParams]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [specialtiesRes, doctorsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/specialties`),
                fetch(`${API_BASE_URL}/doctors/active`)
            ]);

            const specialtiesData = await specialtiesRes.json();
            const doctorsData = await doctorsRes.json();

            setSpecialties(specialtiesData);
            setDoctors(doctorsData);
            setFilteredDoctors(doctorsData);

            if (user.role === 'PATIENT' || user.role === 'USER') {
                await fetchMyAppointments();
                await fetchMedicalReports();
            }

            setLoading(false);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to load data. Please try again.');
            setLoading(false);
        }
    };

    const fetchMyAppointments = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/appointments/patient/${user.id}`);
            const data = await response.json();
            setMyAppointments(data);
        } catch (err) {
            console.error('Error fetching appointments:', err);
        }
    };

    useEffect(() => {
        const now = new Date();
        let filtered = [...myAppointments];
        if (activeTab === 'upcoming') {
            filtered = filtered.filter(apt => new Date(apt.appointmentDate) >= now);
            filtered.sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate));
            if (statusFilter !== 'ALL') filtered = filtered.filter(apt => apt.status === statusFilter);
        } else {
            filtered = filtered.filter(apt => new Date(apt.appointmentDate) < now);
            filtered.sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate));
            if (monthFilter !== 'ALL') {
                filtered = filtered.filter(apt => {
                    const d = new Date(apt.appointmentDate);
                    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === monthFilter;
                });
            }
        }
        setFilteredAppointments(filtered);
    }, [myAppointments, activeTab, statusFilter, monthFilter]);

    const getAppointmentStats = () => {
        const now = new Date();
        const upcoming = myAppointments.filter(apt =>
            new Date(apt.appointmentDate) >= now && (apt.status === 'CONFIRMED' || apt.status === 'PENDING')
        ).length;
        const completed = myAppointments.filter(apt => apt.status === 'COMPLETED').length;
        const cancelled = myAppointments.filter(apt => apt.status === 'CANCELLED' || apt.status === 'REJECTED').length;
        return { upcoming, completed, cancelled, total: myAppointments.length };
    };

    const fetchMedicalReports = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/medical-reports/patient/${user.id}`);
            if (response.ok) {
                const data = await response.json();
                setMedicalReports(data);
            }
        } catch (err) {
            console.error('Error fetching medical reports:', err);
        }
    };

    const hasReport = (appointmentId) => {
        return medicalReports.some(report => report.appointment?.id === appointmentId);
    };

    const handleViewReport = async (appointmentId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/medical-reports/appointment/${appointmentId}`);
            if (response.ok) {
                const report = await response.json();
                setSelectedReport(report);
                setShowReportViewer(true);
            }
        } catch (err) {
            console.error('Error fetching report:', err);
        }
    };

    const fetchDoctorAppointments = async (doctorId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/appointments/doctor/${doctorId}`);
            if (response.ok) {
                const data = await response.json();
                setDoctorAppointments(data);
            }
        } catch (err) {
            console.error('Error fetching doctor appointments:', err);
        }
    };

    const isSlotBooked = (startTime) => {
        if (!selectedDate || !doctorAppointments.length) return false;
        return doctorAppointments.some(apt => {
            if (apt.status === 'CANCELLED' || apt.status === 'REJECTED' || apt.status === 'COMPLETED') return false;
            const aptDate = new Date(apt.appointmentDate);
            const aptDateStr = aptDate.toISOString().split('T')[0];
            if (aptDateStr !== selectedDate) return false;
            const aptTime = aptDate.toTimeString().slice(0, 5);
            const slotTime = startTime.slice(0, 5);
            return aptTime === slotTime;
        });
    };

    const fetchDoctorAvailability = async (doctorId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/availability/doctor/${doctorId}`);
            const data = await response.json();
            setAvailabilities(data);
        } catch (err) {
            console.error('Error fetching availability:', err);
            setAvailabilities([]);
        }
    };

    const handleBookAppointment = async (e) => {
        e.preventDefault();

        if (!selectedDoctor || !selectedDate || !selectedTime) {
            setError('Please fill in all required fields.');
            return;
        }

        if (isRescheduling && reschedulingAppointment) {
            try {
                setLoading(true);
                setError(null);
                const appointmentDateTime = `${selectedDate}T${selectedTime}`;
                const response = await fetch(`${API_BASE_URL}/appointments/${reschedulingAppointment.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        patient: { id: user.id },
                        doctor: { id: selectedDoctor.id },
                        appointmentDate: appointmentDateTime,
                        notes: notes || reschedulingAppointment.notes || '',
                        status: 'CONFIRMED',
                        cost: reschedulingAppointment.cost || 150
                    })
                });
                if (response.ok) {
                    setSuccess('Appointment rescheduled successfully!');
                    setIsRescheduling(false);
                    setReschedulingAppointment(null);
                    resetForm();
                    await fetchMyAppointments();
                    setActiveView('myappointments');
                    setTimeout(() => setSuccess(null), 3000);
                } else {
                    setError('Error rescheduling appointment.');
                }
            } catch (err) {
                setError('Server connection error.');
            } finally {
                setLoading(false);
            }
        } else {
            setActiveView('checkout');
        }
    };

    const handleConfirmAndPay = async () => {
        try {
            setLoading(true);
            setError(null);
            const appointmentDateTime = `${selectedDate}T${selectedTime}`;
            const response = await fetch(`${API_BASE_URL}/appointments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patient: { id: user.id },
                    doctor: { id: selectedDoctor.id },
                    appointmentDate: appointmentDateTime,
                    notes: notes || '',
                    status: 'CONFIRMED',
                    cost: selectedDoctor.appointmentCost || 150
                })
            });
            if (response.ok) {
                const newAppointment = await response.json();
                if (isFunctionalAllowed()) localStorage.setItem('pendingAppointmentId', newAppointment.id);
                window.location.href = 'https://buy.stripe.com/test_28EcN432ycud6Km8YjcjS00';
            } else {
                setError('Error creating appointment.');
            }
        } catch (err) {
            setError('Server connection error.');
        } finally {
            setLoading(false);
        }
    };

    const handleRescheduleAppointment = (appointment) => {
        setIsRescheduling(true);
        setReschedulingAppointment(appointment);
        setSelectedDoctor(appointment.doctor);
        setSelectedSpecialty(appointment.doctor.specialty?.id?.toString() || '');
        setNotes(appointment.notes || '');
        setSelectedDate('');
        setSelectedTime('');
        setActiveView('book');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelRescheduling = () => {
        setIsRescheduling(false);
        setReschedulingAppointment(null);
        resetForm();
    };

    const resetForm = () => {
        setSelectedSpecialty('');
        setDoctorSearch('');
        setSelectedDoctor(null);
        setSelectedDate('');
        setSelectedTime('');
        setNotes('');
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
                await fetchMyAppointments();
                setTimeout(() => setSuccess(null), 3000);
            } else {
                setError('Failed to cancel appointment');
            }
        } catch (err) {
            console.error('Error cancelling appointment:', err);
            setError('Error cancelling appointment');
        }
    };

    const formatDateTime = (dateTimeString) => {
        if (!dateTimeString) return 'N/A';
        const date = new Date(dateTimeString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDate = (dateTimeString) => {
        if (!dateTimeString) return 'N/A';
        const date = new Date(dateTimeString);
        return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    const formatTime = (dateTimeString) => {
        if (!dateTimeString) return 'N/A';
        const date = new Date(dateTimeString);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'PENDING': return 'status-pending';
            case 'CONFIRMED': return 'status-confirmed';
            case 'REJECTED': return 'status-rejected';
            case 'CANCELLED': return 'status-cancelled';
            case 'COMPLETED': return 'status-completed';
            default: return '';
        }
    };

    const getMinDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    const getDayOfWeek = (dateString) => {
        const date = new Date(dateString + 'T00:00:00');
        return date.getDay();
    };

    const getDayOfWeekName = (dayNumber) => {
        const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
        return days[dayNumber];
    };

    const getAvailableTimesForDate = () => {
    if (!selectedDate || !availabilities.length) {
        return [];
    }

    const selectedDayOfWeek = getDayOfWeek(selectedDate);

    const dayAvailabilities = availabilities.filter(availability => {
        const availabilityDay = parseInt(availability.dayOfWeek);
        const isActive = availability.isActive;
        return availabilityDay === selectedDayOfWeek && isActive;
    });

    return dayAvailabilities;
};

    if (!user) {
        return null;
    }

    return (
        <div className="appointments-page">


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

            {activeView === 'book' && (
                <div className="booking-section">
                    <div className="booking-container">
                        {isRescheduling && (
                            <div className="rescheduling-banner">
                                <div className="banner-content">
                                    <div className="banner-text">
                                        <h3>Rescheduling Appointment</h3>
                                        <p>Original appointment with Dr. {reschedulingAppointment.doctor?.user?.firstName} {reschedulingAppointment.doctor?.user?.lastName} on {formatDateTime(reschedulingAppointment.appointmentDate)}</p>
                                    </div>
                                </div>
                                <button onClick={handleCancelRescheduling} className="btn-cancel-rescheduling">
                                    Cancel Rescheduling
                                </button>
                            </div>
                        )}

                        <h2>{isRescheduling ? 'Select New Date & Time' : 'Book a New Appointment'}</h2>

                        <form onSubmit={handleBookAppointment} className="booking-form">
                            {!isRescheduling && (
                                <>
                                    <div className="form-group">
                                        <label htmlFor="doctorSearch">Search Doctor</label>
                                        <div className="doctor-search-box" style={{ position: 'relative' }}>
                                            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="11" cy="11" r="7" />
                                                <line x1="16.5" y1="16.5" x2="22" y2="22" />
                                            </svg>
                                            <input
                                                id="doctorSearch"
                                                type="text"
                                                value={doctorSearch}
                                                onChange={(e) => setDoctorSearch(e.target.value)}
                                                className="form-control search-input"
                                                placeholder="Search by name, specialty, experience..."
                                                onFocus={() => setShowSortDropdown(true)}
                                                onBlur={() => setTimeout(() => setShowSortDropdown(false), 150)}
                                            />
                                            {showSortDropdown && (
                                                <div className="sort-dropdown">
                                                    <div
                                                        className={`sort-dropdown-item ${sortBy === 'popularity' ? 'active' : ''}`}
                                                        onMouseDown={() => setSortBy(sortBy === 'popularity' ? '' : 'popularity')}
                                                    >
                                                        ★ Most Popular Doctors
                                                    </div>
                                                    <div
                                                        className={`sort-dropdown-item ${sortBy === 'experience' ? 'active' : ''}`}
                                                        onMouseDown={() => setSortBy(sortBy === 'experience' ? '' : 'experience')}
                                                    >
                                                        ⏱ Most Experienced Doctors
                                                    </div>
                                                    <div
                                                        className={`sort-dropdown-item ${sortBy === 'firstAvailable' ? 'active' : ''}`}
                                                        onMouseDown={() => setSortBy(sortBy === 'firstAvailable' ? '' : 'firstAvailable')}
                                                    >
                                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:'5px',verticalAlign:'middle'}}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><circle cx="12" cy="16" r="2" fill="currentColor"/></svg>First Available Hour
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="specialty">Select Specialty</label>
                                        <select
                                            id="specialty"
                                            value={selectedSpecialty}
                                            onChange={(e) => setSelectedSpecialty(e.target.value)}
                                            className="form-control"
                                        >
                                            <option value="">All Specialties</option>
                                            {specialties.map(specialty => (
                                                <option key={specialty.id} value={specialty.id}>
                                                    {specialty.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Select Doctor *</label>
                                        <div className="doctors-grid">
                                            {filteredDoctors.length === 0 ? (
                                                <p className="no-doctors">No doctors available for this specialty</p>
                                            ) : (
                                                (selectedDoctor
                                                    ? filteredDoctors.filter(d => d.id === selectedDoctor.id)
                                                    : filteredDoctors
                                                ).map(doctor => (
                                                    <div
                                                        key={doctor.id}
                                                        className={`doctor-card-wrapper ${selectedDoctor?.id === doctor.id ? 'selected' : ''}`}
                                                        onClick={() => setSelectedDoctor(selectedDoctor?.id === doctor.id ? null : doctor)}
                                                    >
                                                        <div className="doctor-card-inner">
                                                            <div className="doctor-card">
                                                                <h3>
                                                                    {doctor.user?.fullName ||
                                                                     (doctor.user?.firstName && doctor.user?.lastName
                                                                        ? `${doctor.user.firstName} ${doctor.user.lastName}`
                                                                        : 'N/A')}
                                                                </h3>
                                                                <p className="doctor-specialty">{doctor.specialty?.name}</p>
                                                                <p className="doctor-experience">{doctor.experienceYears} years experience</p>
                                                                <div className="doctor-rating">
                                                                    Popularity: {doctor.popularity}
                                                                </div>
                                                            </div>
                                                            <div className="doctor-card-back">
                                                                <p className="back-description">{doctor.description || 'No description available.'}</p>
                                                                {doctor.information && <p className="back-information">{doctor.information}</p>}
                                                                <div className="back-cost">
                                                                    {doctor.appointmentCost ? `${doctor.appointmentCost} RON / consultation` : 'Contact clinic for pricing'}
                                                                </div>
                                                                <span className="back-select-hint">Click to select</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}

                            {isRescheduling && (
                                <div className="selected-doctor-info">
                                    <h3>Doctor: Dr. {selectedDoctor?.user?.firstName} {selectedDoctor?.user?.lastName}</h3>
                                    <p>{selectedDoctor?.specialty?.name}</p>
                                </div>
                            )}

                            {selectedDoctor && (
                                <>
                                    {availabilities.length === 0 ? (
                                        <div className="no-availability-warning">
                                            <p style={{color: '#ff6b6b', padding: '15px', background: '#ffe0e0', borderRadius: '5px', marginTop: '20px'}}>
                                                This doctor hasn't set their availability yet. Please select another doctor or contact the clinic administrator.
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="form-group">
                                                <label htmlFor="date">Select Date *</label>
                                                <input
                                                    type="date"
                                                    id="date"
                                                    value={selectedDate}
                                                    onChange={(e) => {
                                                        setSelectedDate(e.target.value);
                                                        setSelectedTime('');
                                                    }}
                                                    onClick={(e) => e.target.showPicker?.()}
                                                    min={getMinDate()}
                                                    className="form-control"
                                                    required
                                                />
                                            </div>

                                            {selectedDate && (
                                                <div className="form-group">
                                                    <label htmlFor="time">Select Time *</label>
                                                    {getAvailableTimesForDate().length > 0 ? (
                                                        <div className="time-slots">
                                                            {getAvailableTimesForDate().map((availability, index) => {
                                                                const booked = isSlotBooked(availability.startTime);
                                                                return (
                                                                <button
                                                                    key={index}
                                                                    type="button"
                                                                    className={`time-slot ${selectedTime === availability.startTime ? 'selected' : ''} ${booked ? 'booked' : ''}`}
                                                                    onClick={() => !booked && setSelectedTime(availability.startTime)}
                                                                    disabled={booked}
                                                                >
                                                                    {availability.startTime} - {availability.endTime}
                                                                    {booked && <span className="booked-label"> (Booked)</span>}
                                                                </button>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <div className="no-availability-info">
                                                            <p className="no-availability">
                                                                No available time slots for {getDayOfWeekName(getDayOfWeek(selectedDate))}.
                                                                Please select another date.
                                                            </p>
                                                            <p className="debug-info" style={{fontSize: '12px', color: '#666', marginTop: '10px'}}>
                                                                Debug: Selected day is {getDayOfWeek(selectedDate)} ({getDayOfWeekName(getDayOfWeek(selectedDate))})
                                                                <br />
                                                                Available days: {availabilities.filter(a => a.isActive).map(a => `${a.dayOfWeek} (${getDayOfWeekName(parseInt(a.dayOfWeek))})`).join(', ') || 'None'}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div className="form-group">
                                                <label htmlFor="notes">Additional Notes (Optional)</label>
                                                <textarea
                                                    id="notes"
                                                    value={notes}
                                                    onChange={(e) => setNotes(e.target.value)}
                                                    className="form-control"
                                                    rows="4"
                                                    placeholder="Describe your symptoms or reason for appointment..."
                                                />
                                            </div>

                                            <button
                                                type="submit"
                                                className="btn-submit"
                                                disabled={loading || !selectedDoctor || !selectedDate || !selectedTime}
                                            >
                                                {loading ? (isRescheduling ? 'Rescheduling...' : 'Booking...') : (isRescheduling ? 'Confirm Reschedule' : 'Book Appointment')}
                                            </button>
                                        </>
                                    )}
                                </>
                            )}
                        </form>
                    </div>
                </div>
            )}

            {activeView === 'checkout' && selectedDoctor && (
                <div className="checkout-section">
                    <div className="checkout-container">
                        <h2>Appointment Summary</h2>

                        <div className="checkout-card">
                            <div className="checkout-doctor-row">
                                <div className="checkout-doctor-info">
                                    <h3>Dr. {selectedDoctor.user?.firstName} {selectedDoctor.user?.lastName}</h3>
                                    <p>{selectedDoctor.specialty?.name}</p>
                                    {selectedDoctor.experienceYears && <p>{selectedDoctor.experienceYears} years experience</p>}
                                </div>
                            </div>

                            <div className="checkout-details">
                                <div className="checkout-row">
                                    <span className="checkout-label">Date</span>
                                    <span className="checkout-value">
                                        {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </span>
                                </div>
                                <div className="checkout-row">
                                    <span className="checkout-label">Time</span>
                                    <span className="checkout-value">{selectedTime}</span>
                                </div>
                                {notes && (
                                    <div className="checkout-row">
                                        <span className="checkout-label">Notes</span>
                                        <span className="checkout-value">{notes}</span>
                                    </div>
                                )}
                                <div className="checkout-row checkout-total-row">
                                    <span className="checkout-label">Consultation Fee</span>
                                    <span className="checkout-total-value">
                                        {selectedDoctor.appointmentCost ? `${selectedDoctor.appointmentCost} RON` : '150 RON'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="checkout-actions">
                            <button onClick={() => setActiveView('book')} className="btn-back-checkout">
                                ← Back
                            </button>
                            <button onClick={handleConfirmAndPay} disabled={loading} className="btn-confirm-pay">
                                {loading ? 'Processing...' : 'Confirm & Pay →'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeView === 'myappointments' && (user.role === 'PATIENT' || user.role === 'USER') && (
                <div className="my-appointments-section">
                    <div className="appointments-container">
                        <div className="section-header">
                            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px', flexWrap: 'nowrap' }}>
                                <p className="dashboard-title" style={{ whiteSpace: 'nowrap' }}>My Appointments</p>
                                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '6px', flexWrap: 'nowrap' }}>
                                    {(() => { const stats = getAppointmentStats(); return (<>
                                        <div className="stat-card">
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#7c6bc9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                            <span className="stat-label">Upcoming</span><span className="stat-number">{stats.upcoming}</span>
                                        </div>
                                        <div className="stat-card">
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#7c6bc9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>
                                            <span className="stat-label">Completed</span><span className="stat-number">{stats.completed}</span>
                                        </div>
                                        <div className="stat-card">
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#7c6bc9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                                            <span className="stat-label">Medical Reports</span><span className="stat-number">{medicalReports.length}</span>
                                        </div>
                                        <div className="stat-card">
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#7c6bc9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                                            <span className="stat-label">Total</span><span className="stat-number">{stats.total}</span>
                                        </div>
                                    </>); })()}
                                </div>
                            </div>
                            <div className="header-controls">
                                <div className="tabs">
                                    <button className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`} onClick={() => { setActiveTab('upcoming'); setMonthFilter('ALL'); }}>Upcoming</button>
                                    <button className={`tab-btn ${activeTab === 'past' ? 'active' : ''}`} onClick={() => { setActiveTab('past'); setStatusFilter('ALL'); }}>Past</button>
                                </div>
                                {activeTab === 'upcoming' ? (
                                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="status-filter">
                                        <option value="ALL">All Status</option>
                                        <option value="PENDING">Pending</option>
                                        <option value="CONFIRMED">Confirmed</option>
                                        <option value="COMPLETED">Completed</option>
                                        <option value="CANCELLED">Cancelled</option>
                                        <option value="REJECTED">Rejected</option>
                                    </select>
                                ) : (
                                    <select value={monthFilter} onChange={e => setMonthFilter(e.target.value)} className="status-filter">
                                        <option value="ALL">All Months</option>
                                        {[...new Set(
                                            myAppointments
                                                .filter(apt => new Date(apt.appointmentDate) < new Date())
                                                .map(apt => {
                                                    const d = new Date(apt.appointmentDate);
                                                    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                                                })
                                        )].sort((a, b) => b.localeCompare(a)).map(ym => {
                                            const [year, month] = ym.split('-');
                                            const label = new Date(year, month - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
                                            return <option key={ym} value={ym}>{label}</option>;
                                        })}
                                    </select>
                                )}
                            </div>
                        </div>

                        {filteredAppointments.length === 0 ? (
                            <div className="no-appointments">
                                <p>No appointments found.</p>
                            </div>
                        ) : (
                            <div className="appointments-list">
                                {filteredAppointments.map(appointment => (
                                    <div key={appointment.id} className="appointment-card">
                                        <div className="appointment-header">
                                            <span className={`status-badge ${getStatusClass(appointment.status)}`}>
                                                {appointment.status}
                                            </span>
                                        </div>

                                        {(appointment.status === 'CANCELLED' || appointment.status === 'REJECTED') && (
                                            <div className="cancellation-notice">
                                                <span className="notice-text">
                                                    This appointment has been {appointment.status.toLowerCase()}. 
                                                    {appointment.status === 'CANCELLED' && ' You can reschedule it below.'}
                                                </span>
                                            </div>
                                        )}

                                        <div className="appointment-body">
                                            <div className="appointment-main-info">
                                                <div className="doctor-info">
                                                    <div className="doctor-avatar">
                                                        {appointment.doctor?.user?.firstName?.charAt(0)}
                                                        {appointment.doctor?.user?.lastName?.charAt(0)}
                                                    </div>
                                                    <div className="doctor-details">
                                                        <h3>Dr. {appointment.doctor?.user?.firstName} {appointment.doctor?.user?.lastName}</h3>
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
                                            {(appointment.status === 'CANCELLED' || appointment.status === 'REJECTED') && (
                                                <button
                                                    onClick={() => handleRescheduleAppointment(appointment)}
                                                    className="btn-reschedule"
                                                >
                                                    Reschedule Appointment
                                                </button>
                                            )}
                                            {(appointment.status === 'PENDING' || appointment.status === 'CONFIRMED') && (
                                                <button
                                                    onClick={() => handleCancelAppointment(appointment.id)}
                                                    className="btn-cancel"
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
                </div>
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

export default OnlineAppoinment;