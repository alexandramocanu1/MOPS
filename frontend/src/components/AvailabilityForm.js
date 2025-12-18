import { useState } from 'react';

const API_BASE_URL = 'http://localhost:7000/api';

function AvailabilityForm({ doctor, onCancel, onSuccess }) {
    const [mode, setMode] = useState('single'); 
    const [timeSlots, setTimeSlots] = useState([
        { startTime: '', endTime: '', id: Date.now() }
    ]);
    const [selectedDays, setSelectedDays] = useState([]);
    const [loading, setLoading] = useState(false);

    const daysOfWeek = [
        { value: 1, label: 'Monday' },
        { value: 2, label: 'Tuesday' },
        { value: 3, label: 'Wednesday' },
        { value: 4, label: 'Thursday' },
        { value: 5, label: 'Friday' },
        { value: 6, label: 'Saturday' },
        { value: 0, label: 'Sunday' }
    ];

    const handleAddTimeSlot = () => {
        setTimeSlots([...timeSlots, { startTime: '', endTime: '', id: Date.now() }]);
    };

    const handleRemoveTimeSlot = (id) => {
        if (timeSlots.length > 1) {
            setTimeSlots(timeSlots.filter(slot => slot.id !== id));
        }
    };

    const handleTimeSlotChange = (id, field, value) => {
        setTimeSlots(timeSlots.map(slot => 
            slot.id === id ? { ...slot, [field]: value } : slot
        ));
    };

    const handleDayToggle = (dayValue) => {
        if (selectedDays.includes(dayValue)) {
            setSelectedDays(selectedDays.filter(d => d !== dayValue));
        } else {
            setSelectedDays([...selectedDays, dayValue]);
        }
    };

    const validateTimeSlots = () => {
        for (let slot of timeSlots) {
            if (!slot.startTime || !slot.endTime) {
                alert('Please fill in all time slots');
                return false;
            }
            if (slot.startTime >= slot.endTime) {
                alert('End time must be after start time for all slots');
                return false;
            }
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateTimeSlots()) {
            return;
        }

        if (selectedDays.length === 0) {
            alert('Please select at least one day');
            return;
        }

        setLoading(true);

        try {
            const availabilitiesToCreate = [];

            // Creăm toate combinațiile de zile și sloturi
            for (let day of selectedDays) {
                for (let slot of timeSlots) {
                    availabilitiesToCreate.push({
                        doctor: { id: doctor.id },
                        dayOfWeek: day,
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        isActive: true
                    });
                }
            }

            console.log('Creating availabilities:', availabilitiesToCreate);

            // Trimitem toate request-urile
            const promises = availabilitiesToCreate.map(availability =>
                fetch(`${API_BASE_URL}/availability`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(availability)
                })
            );

            const results = await Promise.all(promises);
            
            const failedRequests = results.filter(res => !res.ok);
            
            if (failedRequests.length === 0) {
                alert(`Successfully added ${availabilitiesToCreate.length} availability slots!`);
                setTimeSlots([{ startTime: '', endTime: '', id: Date.now() }]);
                setSelectedDays([]);
                onSuccess();
            } else {
                alert(`Added ${results.length - failedRequests.length} slots, but ${failedRequests.length} failed.`);
                onSuccess();
            }
        } catch (err) {
            console.error('Error adding availability:', err);
            alert('Error adding availability. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleQuickSelect = (type) => {
        switch(type) {
            case 'weekdays':
                setSelectedDays([1, 2, 3, 4, 5]); // Luni - Vineri
                break;
            case 'weekend':
                setSelectedDays([0, 6]); // Duminică, Sâmbătă
                break;
            case 'all':
                setSelectedDays([0, 1, 2, 3, 4, 5, 6]); // Toate zilele
                break;
            case 'clear':
                setSelectedDays([]);
                break;
        }
    };

    const handlePresetTimeSlots = (preset) => {
        switch(preset) {
            case 'morning':
                setTimeSlots([
                    { startTime: '08:00', endTime: '08:45', id: Date.now() + 1 },
                    { startTime: '09:00', endTime: '09:45', id: Date.now() + 2 },
                    { startTime: '10:00', endTime: '10:45', id: Date.now() + 3 },
                    { startTime: '11:00', endTime: '11:45', id: Date.now() + 4 }
                ]);
                break;
            case 'afternoon':
                setTimeSlots([
                    { startTime: '13:00', endTime: '13:45', id: Date.now() + 1 },
                    { startTime: '14:00', endTime: '14:45', id: Date.now() + 2 },
                    { startTime: '15:00', endTime: '15:45', id: Date.now() + 3 },
                    { startTime: '16:00', endTime: '16:45', id: Date.now() + 4 }
                ]);
                break;
            case 'fullday':
                setTimeSlots([
                    { startTime: '08:00', endTime: '08:45', id: Date.now() + 1 },
                    { startTime: '09:00', endTime: '09:45', id: Date.now() + 2 },
                    { startTime: '10:00', endTime: '10:45', id: Date.now() + 3 },
                    { startTime: '11:00', endTime: '11:45', id: Date.now() + 4 },
                    { startTime: '13:00', endTime: '13:45', id: Date.now() + 5 },
                    { startTime: '14:00', endTime: '14:45', id: Date.now() + 6 },
                    { startTime: '15:00', endTime: '15:45', id: Date.now() + 7 },
                    { startTime: '16:00', endTime: '16:45', id: Date.now() + 8 }
                ]);
                break;
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{maxWidth: '700px', maxHeight: '90vh', overflow: 'auto'}}>
                <div className="modal-header">
                    <h3>Set Availability for Dr. {doctor.user?.firstName} {doctor.user?.lastName}</h3>
                    <button onClick={onCancel} className="btn-close">×</button>
                </div>
                <form onSubmit={handleSubmit} className="doctor-form">
                    {/* Selectare zile */}
                    <div className="form-group">
                        <label>Select Days *</label>
                        <div style={{marginBottom: '10px'}}>
                            <button type="button" onClick={() => handleQuickSelect('weekdays')} className="btn-quick-select">
                                Mon-Fri
                            </button>
                            <button type="button" onClick={() => handleQuickSelect('weekend')} className="btn-quick-select">
                                Weekend
                            </button>
                            <button type="button" onClick={() => handleQuickSelect('all')} className="btn-quick-select">
                                All Week
                            </button>
                            <button type="button" onClick={() => handleQuickSelect('clear')} className="btn-quick-select">
                                Clear
                            </button>
                        </div>
                        <div className="days-grid">
                            {daysOfWeek.map(day => (
                                <label key={day.value} className="day-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={selectedDays.includes(day.value)}
                                        onChange={() => handleDayToggle(day.value)}
                                    />
                                    <span>{day.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Preset time slots */}
                    <div className="form-group">
                        <label>Quick Time Presets (Optional)</label>
                        <div style={{marginBottom: '10px'}}>
                            <button type="button" onClick={() => handlePresetTimeSlots('morning')} className="btn-quick-select">
                                Morning (8-12)
                            </button>
                            <button type="button" onClick={() => handlePresetTimeSlots('afternoon')} className="btn-quick-select">
                                Afternoon (1-5)
                            </button>
                            <button type="button" onClick={() => handlePresetTimeSlots('fullday')} className="btn-quick-select">
                                Full Day
                            </button>
                        </div>
                    </div>

                    {/* Time slots */}
                    <div className="form-group">
                        <label>Time Slots *</label>
                        {timeSlots.map((slot, index) => (
                            <div key={slot.id} className="time-slot-row">
                                <input
                                    type="time"
                                    value={slot.startTime}
                                    onChange={(e) => handleTimeSlotChange(slot.id, 'startTime', e.target.value)}
                                    required
                                    className="form-input"
                                    style={{flex: 1}}
                                />
                                <span style={{margin: '0 10px'}}>to</span>
                                <input
                                    type="time"
                                    value={slot.endTime}
                                    onChange={(e) => handleTimeSlotChange(slot.id, 'endTime', e.target.value)}
                                    required
                                    className="form-input"
                                    style={{flex: 1}}
                                />
                                <button
                                    type="button"
                                    onClick={() => handleRemoveTimeSlot(slot.id)}
                                    className="btn-remove-slot"
                                    disabled={timeSlots.length === 1}
                                    title="Remove slot"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={handleAddTimeSlot}
                            className="btn-add-slot"
                        >
                            + Add Another Time Slot
                        </button>
                    </div>

                    {/* Preview */}
                    {selectedDays.length > 0 && timeSlots.length > 0 && (
                        <div className="availability-preview">
                            <h4>Preview:</h4>
                            <p style={{fontSize: '14px', color: '#666'}}>
                                You're adding <strong>{selectedDays.length * timeSlots.length}</strong> availability slots:
                            </p>
                            <ul style={{fontSize: '13px', color: '#555', maxHeight: '150px', overflow: 'auto'}}>
                                {selectedDays.map(day => {
                                    const dayName = daysOfWeek.find(d => d.value === day)?.label;
                                    return timeSlots.map((slot, index) => (
                                        <li key={`${day}-${index}`}>
                                            {dayName}: {slot.startTime} - {slot.endTime}
                                        </li>
                                    ));
                                })}
                            </ul>
                        </div>
                    )}

                    <div className="form-actions">
                        <button type="button" onClick={onCancel} className="btn-cancel">
                            Cancel
                        </button>
                        <button type="submit" className="btn-submit" disabled={loading}>
                            {loading ? 'Adding...' : 'Add Availability Slots'}
                        </button>
                    </div>
                </form>

                <div style={{marginTop: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '5px'}}>
                    <p style={{fontSize: '14px', color: '#666', margin: 0}}>
                        💡 <strong>Tip:</strong> Select multiple days and add multiple time slots to quickly set up availability for the entire week or month.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default AvailabilityForm;