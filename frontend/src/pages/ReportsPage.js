import { useState, useRef } from 'react';
import axios from 'axios';
import { useReactToPrint } from 'react-to-print';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend,
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Treemap,
    ScatterChart, Scatter
} from 'recharts';
import './ReportsPage.css';

function ReportsPage() {
    const printRef = useRef(null);
    const currentDate = new Date();

    const [reportType, setReportType] = useState('monthly');
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [displayMode, setDisplayMode] = useState('summary');

    const months = [
        { value: 1, label: 'January' }, { value: 2, label: 'February' },
        { value: 3, label: 'March' }, { value: 4, label: 'April' },
        { value: 5, label: 'May' }, { value: 6, label: 'June' },
        { value: 7, label: 'July' }, { value: 8, label: 'August' },
        { value: 9, label: 'September' }, { value: 10, label: 'October' },
        { value: 11, label: 'November' }, { value: 12, label: 'December' }
    ];

    const years = [];
    for (let year = currentDate.getFullYear(); year >= 2020; year--) {
        years.push(year);
    }

    const generateReport = async () => {
        setLoading(true);
        setError(null);
        try {
            let params = {
                year: selectedYear,
                month: reportType === 'monthly' ? selectedMonth : 1,
                isAnnual: reportType === 'annual'
            };

            if (reportType === 'quarterly') params.months = 3;
            else if (reportType === 'semiannual') params.months = 6;

            const response = await axios.get('http://localhost:7000/api/reports/generate', { params });
            setReportData(response.data);
        } catch (err) {
            setError('Failed to generate report parameters. Please ensure your backend engine service is online.');
            console.error('Error generating report:', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `${reportType.toUpperCase()}_Report_${selectedYear}`,
    });

    const getMonthName = (monthNumber) => months.find(m => m.value === monthNumber)?.label || '';

    const renderVisualizations = () => {
        if (!reportData) return null;

        const statusData = [
            { name: 'Completed', value: reportData.completedAppointments, color: '#4caf50' },
            { name: 'Confirmed', value: reportData.confirmedAppointments, color: '#2196f3' },
            { name: 'Cancelled', value: reportData.cancelledAppointments, color: '#ff9800' },
            { name: 'Rejected', value: reportData.rejectedAppointments, color: '#f44336' },
            { name: 'Pending', value: reportData.pendingAppointments, color: '#9e9e9e' },
        ].filter(d => d.value > 0);

        const specialtyMap = reportData.doctorStatistics.reduce((acc, doc) => {
            acc[doc.specialty] = (acc[doc.specialty] || 0) + doc.totalAppointments;
            return acc;
        }, {});

        const specialtyData = Object.keys(specialtyMap).map(key => ({
            name: key,
            value: specialtyMap[key]
        }));

        const topDoc = reportData.doctorStatistics[0];
        const radarData = topDoc ? [
            { subject: 'Total', A: topDoc.totalAppointments, fullMark: reportData.totalAppointments },
            { subject: 'Patients', A: topDoc.uniquePatients, fullMark: reportData.totalAppointments },
            { subject: 'Success', A: topDoc.doctorCompleted, fullMark: reportData.totalAppointments },
            { subject: 'Confirmed', A: topDoc.confirmedAppointments, fullMark: reportData.totalAppointments },
        ] : [];

        return (
            <div className="visualizations-wrapper">
                <div className="view-mode-selector">
                    {['summary', 'trends', 'comparative', 'efficiency', 'specialties'].map((mode) => (
                        <button
                            key={mode}
                            className={`btn-view ${displayMode === mode ? 'active' : ''}`}
                            onClick={() => setDisplayMode(mode)}
                        >
                            {mode.charAt(0).toUpperCase() + mode.slice(1)}
                        </button>
                    ))}
                </div>

                <div className="chart-display-area">
                    {displayMode === 'summary' && (
                        <div className="charts-grid">
                            <div className="chart-card">
                                <h4>Appointment Distribution</h4>
                                <ResponsiveContainer width="100%" height={260}>
                                    <PieChart>
                                        <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} label>
                                            {statusData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                                        </Pie>
                                        <Tooltip />
                                        <Legend iconSize={10} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="chart-card">
                                <h4>Status Volume Breakdown</h4>
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart data={statusData} layout="vertical">
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                                        <Tooltip cursor={{ fill: 'transparent' }} />
                                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={14}>
                                            {statusData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {displayMode === 'trends' && (
                        <div className="chart-card">
                            <h4>Clinical Activity Density</h4>
                            <ResponsiveContainer width="100%" height={320}>
                                <AreaChart data={reportData.doctorStatistics}>
                                    <defs>
                                        <linearGradient id="colorGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#7c6bc9" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#5d4ebd" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="doctorName" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="totalAppointments" stroke="#5d4ebd" strokeWidth={2} fill="url(#colorGrad)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {displayMode === 'comparative' && (
                        <div className="chart-card">
                            <h4>Doctor Success vs. Cancellation Rates</h4>
                            <ResponsiveContainer width="100%" height={320}>
                                <BarChart data={reportData.doctorStatistics}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="doctorName" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip />
                                    <Legend iconSize={10} />
                                    <Bar dataKey="doctorCompleted" name="Completed" fill="#4caf50" stackId="a" barSize={25} />
                                    <Bar dataKey="confirmedAppointments" name="Confirmed" fill="#2196f3" stackId="a" />
                                    <Bar dataKey="cancelledAppointments" name="Cancelled" fill="#ff9800" stackId="a" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {displayMode === 'efficiency' && (
                        <div className="charts-grid">
                            <div className="chart-card">
                                <h4>Top Performer Matrix: {topDoc?.doctorName}</h4>
                                <ResponsiveContainer width="100%" height={260}>
                                    <RadarChart data={radarData}>
                                        <PolarGrid stroke="#e2e8f0" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fontSize: 10 }} />
                                        <Radar name="Performance" dataKey="A" stroke="#5d4ebd" fill="#7c6bc9" fillOpacity={0.3} />
                                        <Tooltip />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="chart-card">
                                <h4>Patient Loyalty Scatter</h4>
                                <ResponsiveContainer width="100%" height={260}>
                                    <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis type="number" dataKey="uniquePatients" name="Patients" tick={{ fontSize: 11 }} />
                                        <YAxis type="number" dataKey="totalAppointments" name="Appts" tick={{ fontSize: 11 }} />
                                        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                                        <Scatter name="Doctors" data={reportData.doctorStatistics} fill="#7c6bc9" />
                                    </ScatterChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {displayMode === 'specialties' && (
                        <div className="chart-card">
                            <h4>Departmental Load Distribution</h4>
                            <ResponsiveContainer width="100%" height={350}>
                                <Treemap data={specialtyData} dataKey="value" ratio={4 / 3} stroke="#fff" fill="#7c6bc9">
                                    <Tooltip />
                                </Treemap>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="reports-page">
            <div className="reports-container">
            <div className="reports-header">
                <h1>Medical Reports Dashboard</h1>
                <p>Analyze appointment trends and clinical statistics</p>
            </div>
                {/* Connected Configuration Ribbon Card */}
                <div className="report-controls">
                    <h2>Report Configuration</h2>

                    <div className="report-type-selector">
                        {['monthly', 'quarterly', 'semiannual', 'annual'].map((type) => (
                            <button
                                key={type}
                                className={`btn-toggle ${reportType === type ? 'active' : ''}`}
                                onClick={() => setReportType(type)}
                            >
                                {type === 'monthly' ? 'Monthly' : type === 'quarterly' ? '3 Months' : type === 'semiannual' ? '6 Months' : 'Annual'}
                            </button>
                        ))}
                    </div>

                    <div className="controls-group">
                        {reportType === 'monthly' && (
                            <div className="control-item">
                                <label htmlFor="month">Month:</label>
                                <select id="month" value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="control-select">
                                    {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                </select>
                            </div>
                        )}

                        <div className="control-item">
                            <label htmlFor="year">Year:</label>
                            <select id="year" value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="control-select">
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>

                        <button onClick={generateReport} className="btn-generate" disabled={loading}>
                            {loading ? 'Processing...' : 'Generate Report'}
                        </button>

                        {reportData && (
                            <button onClick={handlePrint} className="btn-download">Download PDF</button>
                        )}
                    </div>

                    {/* Integrated perfectly right inside the config section */}
                    {!reportData && !loading && (
                        <div className="no-report">
                            <p>Configure parameters above and click <strong>Generate Report</strong>.</p>
                        </div>
                    )}
                </div>

                {error && <div className="error-message">{error}</div>}

                {/* Only renders once data is fetched and active */}
                {reportData && (
                    <div className="report-printable-area" ref={printRef}>
                        <div className="report-title">
                            <h2>
                                {reportType === 'monthly' ? `Monthly Report - ${getMonthName(reportData.month)} ${reportData.year}` :
                                 reportType === 'annual' ? `Annual Report - ${reportData.year}` :
                                 `Timeline Summary Report - ${reportData.year}`}
                            </h2>
                            <p className="report-date">Generated on: {new Date().toLocaleDateString()}</p>
                        </div>

                        {renderVisualizations()}

                        <div className="report-section">
                            <h3>Overall Statistics</h3>
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <div className="stat-number">{reportData.totalAppointments}</div>
                                    <div className="stat-label">Total</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-number">{reportData.confirmedAppointments}</div>
                                    <div className="stat-label">Confirmed</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-number">{reportData.completedAppointments}</div>
                                    <div className="stat-label">Completed</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-number">{reportData.cancelledAppointments}</div>
                                    <div className="stat-label">Cancelled</div>
                                </div>
                            </div>
                        </div>

                        <div className="report-section">
                            <h3>Doctor Performance</h3>
                            {reportData.doctorStatistics?.length > 0 ? (
                                <div className="table-container">
                                    <table className="doctor-stats-table">
                                        <thead>
                                            <tr>
                                                <th>Doctor Name</th>
                                                <th>Specialty</th>
                                                <th className="number-cell">Total Appts</th>
                                                <th className="number-cell">Unique Patients</th>
                                                <th className="number-cell">Completed</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reportData.doctorStatistics.map((doctor, index) => (
                                                <tr key={doctor.doctorId || index}>
                                                    <td>{doctor.doctorName}</td>
                                                    <td>{doctor.specialty}</td>
                                                    <td className="number-cell">{doctor.totalAppointments}</td>
                                                    <td className="number-cell">{doctor.uniquePatients}</td>
                                                    <td className="number-cell">{doctor.doctorCompleted}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p style={{ color: 'var(--text-muted)' }}>No doctor data available for this selection.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ReportsPage;