import { useState } from 'react';

const API_BASE_URL = 'http://localhost:7000/api';

function DoctorForm({ 
    editingDoctor, 
    specialties, 
    onCancel, 
    onSuccess 
}) {
    const [doctorForm, setDoctorForm] = useState({
        firstName: editingDoctor?.user?.firstName || '',
        lastName: editingDoctor?.user?.lastName || '',
        email: editingDoctor?.user?.email || '',
        password: '',
        phoneNumber: editingDoctor?.user?.phoneNumber || '',
        specialtyId: editingDoctor?.specialty?.name || '',
        experienceYears: editingDoctor?.experienceYears || '',
        description: editingDoctor?.description || ''
    });

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
            
            if (!editingDoctor) {
                const checkEmailResponse = await fetch(`${API_BASE_URL}/users/email/${encodeURIComponent(doctorForm.email)}`);
                
                if (checkEmailResponse.ok) {
                    alert('A user with this email already exists. Please use a different email address.');
                    return;
                }
            }

            
            let specialtyId = doctorForm.specialtyId;
            
            
            if (isNaN(specialtyId)) {
                const specialtyName = doctorForm.specialtyId.trim();
                
                if (!specialtyName) {
                    alert('Please enter a specialty');
                    return;
                }
                
                
                const existingSpecialty = specialties.find(
                    s => s.name.toLowerCase() === specialtyName.toLowerCase()
                );
                
                if (existingSpecialty) {
                    specialtyId = existingSpecialty.id;
                } else {
                    
                    try {
                        const newSpecialtyResponse = await fetch(`${API_BASE_URL}/specialties`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                name: specialtyName,
                                description: `Medical specialty: ${specialtyName}`
                            })
                        });

                        if (newSpecialtyResponse.ok) {
                            const newSpecialty = await newSpecialtyResponse.json();
                            specialtyId = newSpecialty.id;
                        } else if (newSpecialtyResponse.status === 409) {
                            
                            const specialtiesRes = await fetch(`${API_BASE_URL}/specialties`);
                            if (specialtiesRes.ok) {
                                const specialtiesData = await specialtiesRes.json();
                                
                                const foundSpecialty = specialtiesData.find(
                                    s => s.name.toLowerCase() === specialtyName.toLowerCase()
                                );
                                
                                if (foundSpecialty) {
                                    specialtyId = foundSpecialty.id;
                                } else {
                                    alert('Failed to create or find specialty');
                                    return;
                                }
                            } else {
                                alert('Failed to load specialties');
                                return;
                            }
                        } else {
                            const errorData = await newSpecialtyResponse.json().catch(() => ({}));
                            alert(`Failed to create specialty: ${errorData.message || 'Unknown error'}`);
                            return;
                        }
                    } catch (err) {
                        console.error('Error creating specialty:', err);
                        alert('Error creating specialty. Please try again.');
                        return;
                    }
                }
            }

            if (editingDoctor) {
                
                if (doctorForm.email !== editingDoctor.user.email) {
                    const checkEmailResponse = await fetch(`${API_BASE_URL}/users/email/${encodeURIComponent(doctorForm.email)}`);
                    
                    if (checkEmailResponse.ok) {
                        alert('A user with this email already exists. Please use a different email address.');
                        return;
                    }
                }

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
                    const errorData = await userResponse.json().catch(() => ({}));
                    if (userResponse.status === 409) {
                        alert('Email already exists. Please use a different email address.');
                    } else {
                        alert(`Failed to update user: ${errorData.message || 'Unknown error'}`);
                    }
                    return;
                }

                const doctorResponse = await fetch(`${API_BASE_URL}/doctors/${editingDoctor.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user: { id: editingDoctor.user.id },
                        specialty: { id: parseInt(specialtyId) },
                        experienceYears: parseInt(doctorForm.experienceYears),
                        description: doctorForm.description,
                        isActive: editingDoctor.isActive,
                        popularity: editingDoctor.popularity
                    })
                });

                if (doctorResponse.ok) {
                    alert('Doctor updated successfully!');
                    onSuccess();
                } else {
                    const errorData = await doctorResponse.json().catch(() => ({}));
                    alert(`Failed to update doctor: ${errorData.message || 'Unknown error'}`);
                }
            } else {
                
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
                    const errorData = await userResponse.json().catch(() => ({}));
                    if (userResponse.status === 409) {
                        alert('A user with this email already exists. Please use a different email address.');
                    } else {
                        alert(`Failed to create user: ${errorData.message || 'Unknown error'}`);
                    }
                    return;
                }

                const newUser = await userResponse.json();

                const doctorResponse = await fetch(`${API_BASE_URL}/doctors`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user: { id: newUser.id },
                        specialty: { id: parseInt(specialtyId) },
                        experienceYears: parseInt(doctorForm.experienceYears),
                        description: doctorForm.description,
                        isActive: true,
                        popularity: 0
                    })
                });

                if (doctorResponse.ok) {
                    alert('Doctor added successfully!');
                    onSuccess();
                } else {
                    const errorData = await doctorResponse.json().catch(() => ({}));
                    alert(`Failed to create doctor: ${errorData.message || 'Unknown error'}`);
                    
                    
                    try {
                        await fetch(`${API_BASE_URL}/users/${newUser.id}`, {
                            method: 'DELETE'
                        });
                        console.log('Cleaned up user after failed doctor creation');
                    } catch (deleteErr) {
                        console.error('Failed to cleanup user:', deleteErr);
                    }
                }
            }
        } catch (err) {
            console.error('Error saving doctor:', err);
            alert('Error saving doctor. Please check your connection and try again.');
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>{editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}</h3>
                    <button onClick={onCancel} className="btn-close">×</button>
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
                            <input
                                list="specialties-list"
                                id="specialtyId"
                                name="specialtyId"
                                value={doctorForm.specialtyId}
                                onChange={handleFormChange}
                                required
                                className="form-input"
                                placeholder="Enter or select specialty"
                            />
                            <datalist id="specialties-list">
                                {specialties.map(specialty => (
                                    <option key={specialty.id} value={specialty.name}>
                                        {specialty.name}
                                    </option>
                                ))}
                            </datalist>
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
                        <button type="button" onClick={onCancel} className="btn-cancel">
                            Cancel
                        </button>
                        <button type="submit" className="btn-submit">
                            {editingDoctor ? 'Update Doctor' : 'Add Doctor'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default DoctorForm;