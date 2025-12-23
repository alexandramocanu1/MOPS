import { useState, useRef } from 'react';
import axios from 'axios';
import { useReactToPrint } from 'react-to-print';
import './ReportsPage.css';

function ReportsPage() {
    const printRef = useRef(null);

    const currentDate = new Date();
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const months = [
        { value: 1, label: 'January' },
        { value: 2, label: 'February' },
        { value: 3, label: 'March' },
        { value: 4, label: 'April' },
        { value: 5, label: 'May' },
        { value: 6, label: 'June' },
        { value: 7, label: 'July' },
        { value: 8, label: 'August' },
        { value: 9, label: 'September' },
        { value: 10, label: 'October' },
        { value: 11, label: 'November' },
        { value: 12, label: 'December' }
    ];

    const years = [];
    for (let year = currentDate.getFullYear(); year >= 2020; year--) {
        years.push(year);
    }

    const generateReport = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get('http://localhost:7000/api/reports/monthly', {
                params: {
                    year: selectedYear,
                    month: selectedMonth
                }
            });
            setReportData(response.data);
        } catch (err) {
            setError('Failed to generate report. Please try again.');
            console.error('Error generating report:', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Monthly_Report_${selectedYear}_${selectedMonth}`,
    });

    const getMonthName = (monthNumber) => {
        return months.find(m => m.value === monthNumber)?.label || '';
    };

    return (
        <div className="reports-page">
            <div className="reports-header">
                <h1>Monthly Reports</h1>
                <p>Generate and download monthly appointment reports</p>
            </div>

            <div className="reports-container">
                <div className="report-controls">
                    <h2>Select Month and Year</h2>
                    <div className="controls-group">
                        <div className="control-item">
                            <label htmlFor="month">Month:</label>
                            <select
                                id="month"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                className="control-select"
                            >
                                {months.map(month => (
                                    <option key={month.value} value={month.value}>
                                        {month.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="control-item">
                            <label htmlFor="year">Year:</label>
                            <select
                                id="year"
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                className="control-select"
                            >
                                {years.map(year => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={generateReport}
                            className="btn-generate"
                            disabled={loading}
                        >
                            {loading ? 'Generating...' : 'Generate Report'}
                        </button>

                        {reportData && (
                            <button
                                onClick={handlePrint}
                                className="btn-download"
                            >
                                Download as PDF
                            </button>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {reportData && (
                    <div className="report-content" ref={printRef}>
                        <div className="report-title">
                            <h2>Monthly Report - {getMonthName(reportData.month)} {reportData.year}</h2>
                            <p className="report-date">Generated on: {new Date().toLocaleDateString()}</p>
                        </div>

                        <div className="report-section">
                            <h3>Overall Statistics</h3>
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <div className="stat-number">{reportData.totalAppointments}</div>
                                    <div className="stat-label">Total Appointments</div>
                                </div>
                                <div className="stat-card confirmed">
                                    <div className="stat-number">{reportData.confirmedAppointments}</div>
                                    <div className="stat-label">Confirmed</div>
                                </div>
                                <div className="stat-card completed">
                                    <div className="stat-number">{reportData.completedAppointments}</div>
                                    <div className="stat-label">Completed</div>
                                </div>
                                <div className="stat-card cancelled">
                                    <div className="stat-number">{reportData.cancelledAppointments}</div>
                                    <div className="stat-label">Cancelled</div>
                                </div>
                                <div className="stat-card pending">
                                    <div className="stat-number">{reportData.pendingAppointments}</div>
                                    <div className="stat-label">Pending</div>
                                </div>
                                <div className="stat-card rejected">
                                    <div className="stat-number">{reportData.rejectedAppointments}</div>
                                    <div className="stat-label">Rejected</div>
                                </div>
                            </div>
                        </div>

                        <div className="report-section">
                            <h3>Doctor Statistics</h3>
                            {reportData.doctorStatistics && reportData.doctorStatistics.length > 0 ? (
                                <div className="table-container">
                                    <table className="doctor-stats-table">
                                        <thead>
                                            <tr>
                                                <th>Doctor Name</th>
                                                <th>Specialty</th>
                                                <th>Total Appointments</th>
                                                <th>Unique Patients</th>
                                                <th>Confirmed</th>
                                                <th>Completed</th>
                                                <th>Cancelled</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reportData.doctorStatistics.map((doctor, index) => (
                                                <tr key={doctor.doctorId || index}>
                                                    <td>{doctor.doctorName}</td>
                                                    <td>{doctor.specialty}</td>
                                                    <td className="number-cell">{doctor.totalAppointments}</td>
                                                    <td className="number-cell">{doctor.uniquePatients}</td>
                                                    <td className="number-cell">{doctor.confirmedAppointments}</td>
                                                    <td className="number-cell">{doctor.completedAppointments}</td>
                                                    <td className="number-cell">{doctor.cancelledAppointments}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="no-data">No doctor statistics available for this period.</p>
                            )}
                        </div>
                    </div>
                )}

                {!reportData && !loading && (
                    <div className="no-report">
                        <p>Select a month and year, then click "Generate Report" to view the monthly statistics.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ReportsPage;
