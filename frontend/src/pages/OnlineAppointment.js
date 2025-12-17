import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './OnlineAppoinment.css';

const API_BASE_URL = 'http://localhost:7000/api';

function OnlineAppoinment() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [activeView, setActiveView] = useState('book'); // 'book' or 'myappointments'
    const [specialties, setSpecialties] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [filteredDoctors, setFilteredDoctors] = useState([]);
    const [myAppointments, setMyAppointments] = useState([]);
    const [availabilities, setAvailabilities] = useState([]);

    const [selectedSpecialty, setSelectedSpecialty] = useState('');
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [notes, setNotes] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchInitialData();
    }, [user, navigate]);

    useEffect(() => {
        if (selectedSpecialty) {
            const filtered = doctors.filter(
                d => d.specialty?.id === parseInt(selectedSpecialty) && d.isActive
            );
            setFilteredDoctors(filtered);
            setSelectedDoctor(null);
        } else {
            setFilteredDoctors(doctors.filter(d => d.isActive));
        }
    }, [selectedSpecialty, doctors]);

    useEffect(() => {
        if (selectedDoctor) {
            fetchDoctorAvailability(selectedDoctor.id);
        }
    }, [selectedDoctor]);

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

            if (user.role === 'PATIENT') {
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
            setError('Please fill in all required fields');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const appointmentDateTime = `${selectedDate}T${selectedTime}`;

            const response = await fetch(`${API_BASE_URL}/appointments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    patient: { id: user.id },
                    doctor: { id: selectedDoctor.id },
                    appointmentDate: appointmentDateTime,
                    notes: notes || '',
                    status: 'PENDING'
                })
            });

            if (response.ok) {
                setSuccess('Appointment booked successfully! Waiting for doctor confirmation.');
                setSelectedDoctor(null);
                setSelectedDate('');
                setSelectedTime('');
                setNotes('');
                setSelectedSpecialty('');

                if (user.role === 'PATIENT') {
                    await fetchMyAppointments();
                }

                setTimeout(() => setSuccess(null), 5000);
            } else {
                setError('Failed to book appointment. Please try again.');
            }

            setLoading(false);
        } catch (err) {
            console.error('Error booking appointment:', err);
            setError('Error booking appointment. Please try again.');
            setLoading(false);
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
        const date = new Date(dateString);
        return date.getDay(); // Returns 0-6 (0 = Sunday, 6 = Saturday)
    };

    const getDayOfWeekName = (dayNumber) => {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        return days[dayNumber];
    };

    const getAvailableTimesForDate = () => {
        if (!selectedDate || !availabilities.length) return [];

        const dayOfWeek = getDayOfWeek(selectedDate);
        const dayAvailabilities = availabilities.filter(
            a => parseInt(a.dayOfWeek) === dayOfWeek && a.isActive
        );

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

            {user.role === 'PATIENT' && (
                <div className="view-toggle">
                    <button
                        className={`toggle-btn ${activeView === 'book' ? 'active' : ''}`}
                        onClick={() => setActiveView('book')}
                    >
                        Book Appointment
                    </button>
                    <button
                        className={`toggle-btn ${activeView === 'myappointments' ? 'active' : ''}`}
                        onClick={() => setActiveView('myappointments')}
                    >
                        My Appointments
                    </button>
                </div>
            )}

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
                        <h2>Book a New Appointment</h2>

                        <form onSubmit={handleBookAppointment} className="booking-form">
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
                                        filteredDoctors.map(doctor => (
                                            <div
                                                key={doctor.id}
                                                className={`doctor-card ${selectedDoctor?.id === doctor.id ? 'selected' : ''}`}
                                                onClick={() => setSelectedDoctor(doctor)}
                                            >
                                                <div className="doctor-icon">👨‍⚕️</div>
                                                <h3>{doctor.user?.name}</h3>
                                                <p className="doctor-specialty">{doctor.specialty?.name}</p>
                                                <p className="doctor-experience">{doctor.experienceYears} years experience</p>
                                                <div className="doctor-rating">
                                                    ⭐ Popularity: {doctor.popularity}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {selectedDoctor && (
                                <>
                                    <div className="form-group">
                                        <label htmlFor="date">Select Date *</label>
                                        <input
                                            type="date"
                                            id="date"
                                            value={selectedDate}
                                            onChange={(e) => setSelectedDate(e.target.value)}
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
                                                    {getAvailableTimesForDate().map((availability, index) => (
                                                        <button
                                                            key={index}
                                                            type="button"
                                                            className={`time-slot ${selectedTime === availability.startTime ? 'selected' : ''}`}
                                                            onClick={() => setSelectedTime(availability.startTime)}
                                                        >
                                                            {availability.startTime} - {availability.endTime}
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="no-availability">
                                                    No available time slots for {getDayOfWeekName(getDayOfWeek(selectedDate))}.
                                                    Please select another date.
                                                </p>
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
                                        {loading ? 'Booking...' : 'Book Appointment'}
                                    </button>
                                </>
                            )}
                        </form>
                    </div>
                </div>
            )}

            {activeView === 'myappointments' && user.role === 'PATIENT' && (
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

                                        <div className="appointment-body">
                                            <div className="appointment-info">
                                                <div className="info-row">
                                                    <span className="info-label">Doctor:</span>
                                                    <span className="info-value">{appointment.doctor?.user?.name}</span>
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

                                        {(appointment.status === 'PENDING' || appointment.status === 'CONFIRMED') && (
                                            <div className="appointment-actions">
                                                <button
                                                    onClick={() => handleCancelAppointment(appointment.id)}
                                                    className="btn-cancel"
                                                >
                                                    Cancel Appointment
                                                </button>
                                            </div>
                                        )}
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