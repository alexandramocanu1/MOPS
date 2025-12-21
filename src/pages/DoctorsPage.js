import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './DoctorsPage.css';

const API_BASE_URL = 'http://localhost:7000/api';

function DoctorsPage() {
    const navigate = useNavigate();

    const [doctors, setDoctors] = useState([]);
    const [specialties, setSpecialties] = useState([]);
    const [filteredDoctors, setFilteredDoctors] = useState([]);
    const [selectedSpecialty, setSelectedSpecialty] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        filterDoctors();
    }, [doctors, selectedSpecialty, searchTerm]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [doctorsRes, specialtiesRes] = await Promise.all([
                fetch(`${API_BASE_URL}/doctors`),
                fetch(`${API_BASE_URL}/specialties`)
            ]);

            const doctorsData = await doctorsRes.json();
            const specialtiesData = await specialtiesRes.json();

            // Sort doctors by popularity (highest first)
            const sortedDoctors = doctorsData.sort((a, b) => b.popularity - a.popularity);

            setDoctors(sortedDoctors);
            setSpecialties(specialtiesData);
            setFilteredDoctors(sortedDoctors);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching doctors:', err);
            setError('Failed to load doctors. Please try again.');
            setLoading(false);
        }
    };

    const filterDoctors = () => {
        let filtered = [...doctors];

        // Filter by specialty
        if (selectedSpecialty) {
            filtered = filtered.filter(
                doctor => doctor.specialty?.id === parseInt(selectedSpecialty)
            );
        }

        // Filter by search term (name or specialty)
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(
                doctor => {
                    const fullName = doctor.user?.fullName ||
                        (doctor.user?.firstName && doctor.user?.lastName
                            ? `${doctor.user.firstName} ${doctor.user.lastName}`
                            : '');
                    return fullName.toLowerCase().includes(term) ||
                           doctor.user?.firstName?.toLowerCase().includes(term) ||
                           doctor.user?.lastName?.toLowerCase().includes(term) ||
                           doctor.specialty?.name?.toLowerCase().includes(term);
                }
            );
        }

        setFilteredDoctors(filtered);
    };

    const handleBookAppointment = (doctorId) => {
        navigate('/appointments');
    };

    if (loading) {
        return (
            <div className="doctors-page">
                <div className="loading">Loading doctors...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="doctors-page">
                <div className="error-container">
                    <div className="error">{error}</div>
                    <button onClick={fetchData} className="btn-retry">Retry</button>
                </div>
            </div>
        );
    }

    return (
        <div className="doctors-page">
            <div className="doctors-header">
                <h1>Our Doctors</h1>
                <p>Meet our experienced medical professionals</p>
            </div>

            <div className="doctors-filters">
                <div className="filter-container">
                    <div className="search-box">
                        <input
                            type="text"
                            placeholder="Search by doctor name or specialty..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>

                    <div className="specialty-filter">
                        <select
                            value={selectedSpecialty}
                            onChange={(e) => setSelectedSpecialty(e.target.value)}
                            className="specialty-select"
                        >
                            <option value="">All Specialties</option>
                            {specialties.map(specialty => (
                                <option key={specialty.id} value={specialty.id}>
                                    {specialty.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="results-info">
                    <p>Showing {filteredDoctors.length} of {doctors.length} doctors</p>
                </div>
            </div>

            {filteredDoctors.length === 0 ? (
                <div className="no-results">
                    <p>No doctors found matching your criteria.</p>
                    <button
                        onClick={() => {
                            setSearchTerm('');
                            setSelectedSpecialty('');
                        }}
                        className="btn-clear-filters"
                    >
                        Clear Filters
                    </button>
                </div>
            ) : (
                <div className="doctors-listing-grid">
                    {filteredDoctors.map(doctor => (
                        <div key={doctor.id} className={`doctor-card-detail ${!doctor.isActive ? 'inactive' : ''}`}>
                            <div className="doctor-card-header">
                                <div className="doctor-avatar">👨‍⚕️</div>
                                <div className="doctor-status-badge">
                                    {doctor.isActive ? (
                                        <span className="badge-active">Active</span>
                                    ) : (
                                        <span className="badge-inactive">Inactive</span>
                                    )}
                                </div>
                            </div>

                            <div className="doctor-card-body">
                                <h3 className="doctor-name">
                                    {doctor.user?.fullName ||
                                     (doctor.user?.firstName && doctor.user?.lastName
                                        ? `${doctor.user.firstName} ${doctor.user.lastName}`
                                        : 'N/A')}
                                </h3>
                                <p className="doctor-specialty-badge">{doctor.specialty?.name || 'N/A'}</p>

                                <div className="doctor-details">
                                    <div className="detail-item">
                                        <span className="detail-icon">📧</span>
                                        <span className="detail-text">{doctor.user?.email || 'N/A'}</span>
                                    </div>

                                    <div className="detail-item">
                                        <span className="detail-icon">💼</span>
                                        <span className="detail-text">{doctor.experienceYears} years experience</span>
                                    </div>

                                    <div className="detail-item">
                                        <span className="detail-icon">⭐</span>
                                        <span className="detail-text">Popularity: {doctor.popularity}</span>
                                    </div>
                                </div>

                                {doctor.description && (
                                    <div className="doctor-description">
                                        <p>{doctor.description}</p>
                                    </div>
                                )}
                            </div>

                            {doctor.isActive && (
                                <div className="doctor-card-footer">
                                    <button
                                        onClick={() => handleBookAppointment(doctor.id)}
                                        className="btn-book-appointment"
                                    >
                                        Book Appointment
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default DoctorsPage;
