import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [notes, setNotes] = useState('');

    // Stare pentru reprogramare
    const [isRescheduling, setIsRescheduling] = useState(false);
    const [reschedulingAppointment, setReschedulingAppointment] = useState(null);

    const [doctorAppointments, setDoctorAppointments] = useState([]);

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
}, [user, navigate, authLoading]); 

    useEffect(() => {
        let filtered = doctors.filter(d => d.isActive);
        if (selectedSpecialty) {
            filtered = filtered.filter(d => d.specialty?.id === parseInt(selectedSpecialty));
        }
        if (doctorSearch.trim()) {
            const q = doctorSearch.trim().toLowerCase();
            filtered = filtered.filter(d => {
                const name = d.user?.fullName ||
                    (d.user?.firstName && d.user?.lastName
                        ? `${d.user.firstName} ${d.user.lastName}`
                        : '');
                return name.toLowerCase().includes(q);
            });
        }
        setFilteredDoctors(filtered);
        if (!isRescheduling) {
            setSelectedDoctor(null);
        }
    }, [selectedSpecialty, doctorSearch, doctors]);

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
    const pendingAppointmentId = localStorage.getItem('pendingAppointmentId');
    
    if (paymentStatus === 'success') {
        if (pendingAppointmentId) {
            fetch(`${API_BASE_URL}/appointments/${pendingAppointmentId}/confirm-payment`, {
                method: 'PUT'
            }).then(() => {
                localStorage.removeItem('pendingAppointmentId');
                setSuccess('Payment successful! Your appointment has been confirmed. A confirmation email has been sent.');
                setActiveView('myappointments');
                fetchMyAppointments();
            });
        } else {
            setSuccess('Payment successful! Your appointment has been confirmed.');
            setActiveView('myappointments');
            fetchMyAppointments();
        }
        
        navigate('/appointments?view=myappointments', { replace: true, state: { fromBooking: true } });
        setTimeout(() => setSuccess(null), 5000);
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
            setError('Te rugăm să completezi toate câmpurile obligatorii'); 
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const appointmentDateTime = `${selectedDate}T${selectedTime}`;

            if (isRescheduling && reschedulingAppointment) {
                // Reprogramăm programarea existentă
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
                    setError('Eroare la reprogramarea programării.');
                }
            } else {
                const response = await fetch(`${API_BASE_URL}/appointments`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        patient: { id: user.id },
                        doctor: { id: selectedDoctor.id },
                        appointmentDate: appointmentDateTime,
                        notes: notes || '',
                        status: 'CONFIRMED', 
                        cost: 150
                    })
                });

                if (response.ok) {
                    const newAppointment = await response.json();
                    
                    localStorage.setItem('pendingAppointmentId', newAppointment.id);
                    window.location.href = 'https://buy.stripe.com/test_28EcN432ycud6Km8YjcjS00';
                } else {
                    console.log(response.body);
    setError('Eroare la crearea programării.');
}
            }
        } catch (err) {
            setError('Eroare de conexiune la server.');
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
            <div className="appointments-header">
                <h1>Online Appointments</h1>
                <p>Book and manage your medical appointments</p>
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
                                        <div className="doctor-search-box">
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
                                                placeholder="Search by doctor name..."
                                            />
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
                                                        className={`doctor-card ${selectedDoctor?.id === doctor.id ? 'selected' : ''}`}
                                                        onClick={() => setSelectedDoctor(selectedDoctor?.id === doctor.id ? null : doctor)}
                                                    >
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

            {activeView === 'myappointments' && (user.role === 'PATIENT' || user.role === 'USER') && (
                <div className="my-appointments-section">
                    <div className="appointments-container">
                        <h2>My Appointments</h2>

                        {myAppointments.length === 0 ? (
                            <div className="no-appointments">
                                <p>You don't have any appointments yet.</p>
                                <button
                                    onClick={() => setActiveView('book')}
                                    className="btn-book-now"
                                >
                                    Book Your First Appointment
                                </button>
                            </div>
                        ) : (
                            <div className="appointments-list">
                                {myAppointments.map(appointment => (
                                    <div key={appointment.id} className="appointment-card">
                                        <div className="appointment-header">
                                            <span className={`status-badge ${getStatusClass(appointment.status)}`}>
                                                {appointment.status}
                                            </span>
                                            <span className="appointment-id">#{appointment.id}</span>
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
                                            <div className="appointment-info">
                                                <div className="info-row">
                                                    <span className="info-label">Doctor:</span>
                                                    <span className="info-value">
                                                        {appointment.doctor?.user?.fullName ||
                                                         (appointment.doctor?.user?.firstName && appointment.doctor?.user?.lastName
                                                            ? `${appointment.doctor.user.firstName} ${appointment.doctor.user.lastName}`
                                                            : 'N/A')}
                                                    </span>
                                                </div>
                                                <div className="info-row">
                                                    <span className="info-label">Specialty:</span>
                                                    <span className="info-value">{appointment.doctor?.specialty?.name}</span>
                                                </div>
                                                <div className="info-row">
                                                    <span className="info-label">Date & Time:</span>
                                                    <span className="info-value">{formatDateTime(appointment.appointmentDate)}</span>
                                                </div>
                                                {appointment.notes && (
                                                    <div className="info-row">
                                                        <span className="info-label">Notes:</span>
                                                        <span className="info-value">{appointment.notes}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="appointment-actions">
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
        </div>
    );
}

export default OnlineAppoinment;