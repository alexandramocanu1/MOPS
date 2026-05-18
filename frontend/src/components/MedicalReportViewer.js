import './MedicalReportViewer.css';

function MedicalReportViewer({ report, onClose }) {
    if (!report) return null;

    const formatDate = (d) => d
        ? new Date(d).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        : 'N/A';

    const formatDateTime = (d) => d
        ? new Date(d).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        : 'N/A';

    return (
        <div className="modal-overlay">
            <div className="modal-content medical-report-viewer">
                <div className="modal-header">
                    <h2>Medical Report</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="report-content">

                    {/* Patient info card */}
                    <div className="report-header-info">
                        <div className="info-item">
                            <label>Patient</label>
                            <span>{report.appointment?.patient?.firstName} {report.appointment?.patient?.lastName}</span>
                        </div>
                        <div className="info-item">
                            <label>Doctor</label>
                            <span>Dr. {report.appointment?.doctor?.user?.firstName} {report.appointment?.doctor?.user?.lastName}</span>
                        </div>
                        <div className="info-item">
                            <label>Specialty</label>
                            <span>{report.appointment?.doctor?.specialty?.name || 'N/A'}</span>
                        </div>
                        <div className="info-item">
                            <label>Appointment Date</label>
                            <span>{formatDate(report.appointment?.appointmentDate)}</span>
                        </div>
                        <div className="info-item">
                            <label>Report Issued</label>
                            <span>{formatDateTime(report.createdDate)}</span>
                        </div>
                    </div>

                    {report.symptoms && (
                        <div className="report-section">
                            <span className="section-label">Complaints &amp; Symptoms</span>
                            <p>{report.symptoms}</p>
                        </div>
                    )}

                    {report.physicalExamination && (
                        <div className="report-section">
                            <span className="section-label">Physical Examination</span>
                            <p>{report.physicalExamination}</p>
                        </div>
                    )}

                    {report.investigations && (
                        <div className="report-section">
                            <span className="section-label">Investigations &amp; Tests</span>
                            <p>{report.investigations}</p>
                        </div>
                    )}

                    <div className="report-section">
                        <span className="section-label">Diagnosis</span>
                        <p>{report.diagnosis}</p>
                    </div>

                    {report.recommendations && (
                        <div className="report-section">
                            <span className="section-label">Recommendations</span>
                            <p>{report.recommendations}</p>
                        </div>
                    )}

                    {report.followUpDate && (
                        <div className="report-section">
                            <span className="section-label">Follow-up</span>
                            <p>Recommended on <strong>{formatDate(report.followUpDate)}</strong>. Please contact the clinic to schedule.</p>
                        </div>
                    )}

                    {report.additionalNotes && (
                        <div className="report-section">
                            <span className="section-label">Notes</span>
                            <p>{report.additionalNotes}</p>
                        </div>
                    )}

                    {report.prescriptions && report.prescriptions.length > 0 && (
                        <div className="report-section prescriptions-section">
                            <span className="section-label">Prescriptions</span>
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
                                        {report.prescriptions.map((p, i) => (
                                            <tr key={i}>
                                                <td>{p.medication}</td>
                                                <td>{p.dosage || '—'}</td>
                                                <td>{p.frequency || '—'}</td>
                                                <td>{p.duration || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                </div>

                <div className="report-footer">
                    <button onClick={onClose} className="btn-close-report">Close</button>
                    <button onClick={() => window.print()} className="btn-print-report">Print</button>
                </div>
            </div>
        </div>
    );
}

export default MedicalReportViewer;
