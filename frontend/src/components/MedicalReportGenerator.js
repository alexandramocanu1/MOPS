import { useState, useEffect } from 'react';
import './MedicalReportGenerator.css';

const API_BASE_URL = 'http://localhost:7000/api';

function MedicalReportGenerator({ appointment, existingReport, isEditMode, onClose, onReportCreated }) {
    const [reportData, setReportData] = useState({
        diagnosis: '',
        symptoms: '',
        physicalExamination: '',
        investigations: '',
        prescriptions: [{ medication: '', dosage: '', frequency: '', duration: '' }],
        recommendations: '',
        followUpDate: '',
        additionalNotes: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (existingReport && isEditMode) {
            setReportData({
                diagnosis: existingReport.diagnosis || '',
                symptoms: existingReport.symptoms || '',
                physicalExamination: existingReport.physicalExamination || '',
                investigations: existingReport.investigations || '',
                prescriptions: existingReport.prescriptions && existingReport.prescriptions.length > 0
                    ? existingReport.prescriptions.map(p => ({
                        medication: p.medication || '',
                        dosage: p.dosage || '',
                        frequency: p.frequency || '',
                        duration: p.duration || ''
                    }))
                    : [{ medication: '', dosage: '', frequency: '', duration: '' }],
                recommendations: existingReport.recommendations || '',
                followUpDate: existingReport.followUpDate ? existingReport.followUpDate.split('T')[0] : '',
                additionalNotes: existingReport.additionalNotes || ''
            });
        }
    }, [existingReport, isEditMode]);

    const handleInputChange = (field, value) => {
        setReportData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handlePrescriptionChange = (index, field, value) => {
        const newPrescriptions = [...reportData.prescriptions];
        newPrescriptions[index][field] = value;
        setReportData(prev => ({
            ...prev,
            prescriptions: newPrescriptions
        }));
    };

    const addPrescription = () => {
        setReportData(prev => ({
            ...prev,
            prescriptions: [...prev.prescriptions, { medication: '', dosage: '', frequency: '', duration: '' }]
        }));
    };

    const removePrescription = (index) => {
        if (reportData.prescriptions.length > 1) {
            const newPrescriptions = reportData.prescriptions.filter((_, i) => i !== index);
            setReportData(prev => ({
                ...prev,
                prescriptions: newPrescriptions
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!reportData.diagnosis.trim()) {
            setError('Diagnosis is required');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const reportPayload = {
                appointment: { id: appointment.id },
                diagnosis: reportData.diagnosis,
                symptoms: reportData.symptoms,
                physicalExamination: reportData.physicalExamination,
                investigations: reportData.investigations,
                prescriptions: reportData.prescriptions.filter(p => p.medication.trim() !== ''),
                recommendations: reportData.recommendations,
                followUpDate: reportData.followUpDate || null,
                additionalNotes: reportData.additionalNotes,
                createdDate: isEditMode && existingReport ? existingReport.createdDate : new Date().toISOString()
            };

            const url = isEditMode && existingReport
                ? `${API_BASE_URL}/medical-reports/${existingReport.id}`
                : `${API_BASE_URL}/medical-reports`;

            const method = isEditMode && existingReport ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(reportPayload)
            });

            if (!response.ok) {
                throw new Error('Failed to create medical report');
            }

            const createdReport = await response.json();
            
            if (onReportCreated) {
                onReportCreated(createdReport);
            }
            
            onClose();
        } catch (err) {
            console.error('Error creating report:', err);
            setError('Failed to create medical report. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content medical-report-modal">
                <div className="modal-header">
                    <h2>{isEditMode ? 'Edit Medical Report' : 'Generate Medical Report'}</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="patient-info-summary">
                    <h3>Patient Information</h3>
                    <p><strong>Name:</strong> {appointment.patient?.firstName} {appointment.patient?.lastName}</p>
                    <p><strong>Date:</strong> {new Date(appointment.appointmentDate).toLocaleDateString()}</p>
                </div>

                {error && (
                    <div className="alert alert-error">
                        {error}
                        <button onClick={() => setError(null)} className="alert-close">×</button>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="report-form">
                    <div className="form-section">
                        <h3>Complaints & Symptoms</h3>
                        <textarea
                            value={reportData.symptoms}
                            onChange={(e) => handleInputChange('symptoms', e.target.value)}
                            placeholder="Describe patient's symptoms and complaints..."
                            rows="3"
                            className="form-control"
                        />
                    </div>

                    <div className="form-section">
                        <h3>Physical Examination</h3>
                        <textarea
                            value={reportData.physicalExamination}
                            onChange={(e) => handleInputChange('physicalExamination', e.target.value)}
                            placeholder="Physical examination findings..."
                            rows="3"
                            className="form-control"
                        />
                    </div>

                    <div className="form-section">
                        <h3>Investigations & Tests</h3>
                        <textarea
                            value={reportData.investigations}
                            onChange={(e) => handleInputChange('investigations', e.target.value)}
                            placeholder="Lab tests, X-rays, scans performed and results..."
                            rows="3"
                            className="form-control"
                        />
                    </div>

                    <div className="form-section">
                        <h3>Diagnosis *</h3>
                        <textarea
                            value={reportData.diagnosis}
                            onChange={(e) => handleInputChange('diagnosis', e.target.value)}
                            placeholder="Primary and differential diagnosis..."
                            rows="2"
                            className="form-control"
                            required
                        />
                    </div>

                    <div className="form-section">
                        <h3>Prescriptions</h3>
                        {reportData.prescriptions.map((prescription, index) => (
                            <div key={index} className="prescription-row">
                                <div className="prescription-fields">
                                    <input
                                        type="text"
                                        value={prescription.medication}
                                        onChange={(e) => handlePrescriptionChange(index, 'medication', e.target.value)}
                                        placeholder="Medication name"
                                        className="form-control"
                                    />
                                    <input
                                        type="text"
                                        value={prescription.dosage}
                                        onChange={(e) => handlePrescriptionChange(index, 'dosage', e.target.value)}
                                        placeholder="Dosage (e.g., 500mg)"
                                        className="form-control"
                                    />
                                    <input
                                        type="text"
                                        value={prescription.frequency}
                                        onChange={(e) => handlePrescriptionChange(index, 'frequency', e.target.value)}
                                        placeholder="Frequency (e.g., 2x/day)"
                                        className="form-control"
                                    />
                                    <input
                                        type="text"
                                        value={prescription.duration}
                                        onChange={(e) => handlePrescriptionChange(index, 'duration', e.target.value)}
                                        placeholder="Duration (e.g., 7 days)"
                                        className="form-control"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removePrescription(index)}
                                    className="btn-remove-prescription"
                                    disabled={reportData.prescriptions.length === 1}
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={addPrescription}
                            className="btn-add-prescription"
                        >
                            + Add Medication
                        </button>
                    </div>

                    <div className="form-section">
                        <h3>Recommendations & Instructions</h3>
                        <textarea
                            value={reportData.recommendations}
                            onChange={(e) => handleInputChange('recommendations', e.target.value)}
                            placeholder="Lifestyle changes, diet recommendations, precautions..."
                            rows="3"
                            className="form-control"
                        />
                    </div>

                    <div className="form-section">
                        <h3>Follow-up Date</h3>
                        <input
                            type="date"
                            value={reportData.followUpDate}
                            onChange={(e) => handleInputChange('followUpDate', e.target.value)}
                            className="form-control"
                            min={new Date().toISOString().split('T')[0]}
                        />
                    </div>

                    <div className="form-section">
                        <h3>Additional Notes</h3>
                        <textarea
                            value={reportData.additionalNotes}
                            onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                            placeholder="Any additional information..."
                            rows="2"
                            className="form-control"
                        />
                    </div>

                    <div className="form-actions">
                        <button type="button" onClick={onClose} className="btn-cancel">
                            Cancel
                        </button>
                        <button type="submit" className="btn-submit" disabled={loading}>
                            {loading
                                ? (isEditMode ? 'Updating Report...' : 'Generating Report...')
                                : (isEditMode ? 'Update Report' : 'Generate Report')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default MedicalReportGenerator;