import './MedicalReportViewer.css';

function MedicalReportViewer({ report, onClose }) {
    if (!report) return null;

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
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

    return (
        <div className="modal-overlay">
            <div className="modal-content medical-report-viewer">
                <div className="modal-header">
                    <h2>Medical Report</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="report-content">
                    <div className="report-header-info">
                        <div className="info-row">
                            <div className="info-item">
                                <label>Patient:</label>
                                <span>{report.appointment?.patient?.firstName} {report.appointment?.patient?.lastName}</span>
                            </div>
                            <div className="info-item">
                                <label>Doctor:</label>
                                <span>Dr. {report.appointment?.doctor?.user?.firstName} {report.appointment?.doctor?.user?.lastName}</span>
                            </div>
                        </div>
                        <div className="info-row">
                            <div className="info-item">
                                <label>Appointment Date:</label>
                                <span>{formatDate(report.appointment?.appointmentDate)}</span>
                            </div>
                            <div className="info-item">
                                <label>Report Created:</label>
                                <span>{formatDateTime(report.createdDate)}</span>
                            </div>
                        </div>
                        <div className="info-row">
                            <div className="info-item">
                                <label>Specialty:</label>
                                <span>{report.appointment?.doctor?.specialty?.name || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    {report.symptoms && (
                        <div className="report-section">
                            <h3>Complaints & Symptoms</h3>
                            <p>{report.symptoms}</p>
                        </div>
                    )}

                    {report.physicalExamination && (
                        <div className="report-section">
                            <h3>Physical Examination</h3>
                            <p>{report.physicalExamination}</p>
                        </div>
                    )}

                    {report.investigations && (
                        <div className="report-section">
                            <h3>Investigations & Tests</h3>
                            <p>{report.investigations}</p>
                        </div>
                    )}

                    <div className="report-section diagnosis-section">
                        <h3>Diagnosis</h3>
                        <p>{report.diagnosis}</p>
                    </div>

                    {report.prescriptions && report.prescriptions.length > 0 && (
                        <div className="report-section">
                            <h3>Prescriptions</h3>
                            <div className="prescriptions-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Medication</th>
                                            <th>Dosage</th>
                                            <th>Frequency</th>
                                            <th>Duration</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report.prescriptions.map((prescription, index) => (
                                            <tr key={index}>
                                                <td>{prescription.medication}</td>
                                                <td>{prescription.dosage || '-'}</td>
                                                <td>{prescription.frequency || '-'}</td>
                                                <td>{prescription.duration || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {report.recommendations && (
                        <div className="report-section">
                            <h3>Recommendations & Instructions</h3>
                            <p>{report.recommendations}</p>
                        </div>
                    )}

                    {report.followUpDate && (
                        <div className="report-section follow-up-section">
                            <h3>Follow-up Appointment</h3>
                            <p>Recommended follow-up date: <strong>{formatDate(report.followUpDate)}</strong></p>
                        </div>
                    )}

                    {report.additionalNotes && (
                        <div className="report-section">
                            <h3>Additional Notes</h3>
                            <p>{report.additionalNotes}</p>
                        </div>
                    )}
                </div>

                <div className="report-footer">
                    <button onClick={onClose} className="btn-close-report">Close</button>
                    <button onClick={() => window.print()} className="btn-print-report">Print Report</button>
                </div>
            </div>
        </div>
    );
}

export default MedicalReportViewer;
