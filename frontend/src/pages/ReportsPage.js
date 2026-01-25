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
            const response = await axios.get('http://localhost:7000/api/reports/generate', {
                params: {
                    year: selectedYear,
                    month: reportType === 'monthly' ? selectedMonth : 1,
                    isAnnual: reportType === 'annual'
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
        documentTitle: `${reportType === 'monthly' ? 'Monthly' : 'Annual'}_Report_${selectedYear}`,
    });

    const getMonthName = (monthNumber) => {
        return months.find(m => m.value === monthNumber)?.label || '';
    };

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="custom-tooltip" style={{
                    background: '#fff',
                    padding: '10px',
                    border: '1px solid #764ba2',
                    borderRadius: '5px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                }}>
                    <p style={{ fontWeight: 'bold', margin: '0 0 5px 0', color: '#333' }}>{data.doctorName}</p>
                    <p style={{ margin: 0, fontSize: '13px' }}>Patients: {data.uniquePatients}</p>
                    <p style={{ margin: 0, fontSize: '13px' }}>Appointments: {data.totalAppointments}</p>
                </div>
            );
        }
        return null;
    };

    const renderVisualizations = () => {
        if (!reportData) return null;

        // --- DATA PREPARATION ---

        // 1. Status Data (for Summary View)
        const statusData = [
            { name: 'Completed', value: reportData.completedAppointments, color: '#4caf50' },
            { name: 'Confirmed', value: reportData.confirmedAppointments, color: '#2196f3' },
            { name: 'Cancelled', value: reportData.cancelledAppointments, color: '#ff9800' },
            { name: 'Rejected', value: reportData.rejectedAppointments, color: '#f44336' },
            { name: 'Pending', value: reportData.pendingAppointments, color: '#9e9e9e' },
        ].filter(d => d.value > 0);

        // 2. Specialty Data (Aggregating doctor stats by specialty for Treemap)
        const specialtyMap = reportData.doctorStatistics.reduce((acc, doc) => {
            acc[doc.specialty] = (acc[doc.specialty] || 0) + doc.totalAppointments;
            return acc;
        }, {});
        const specialtyData = Object.keys(specialtyMap).map(key => ({
            name: key,
            value: specialtyMap[key]
        }));

        // 3. Performance Radar Data (For the top performing doctor)
        const topDoc = reportData.doctorStatistics[0];
        const radarData = topDoc ? [
            { subject: 'Total', A: topDoc.totalAppointments, fullMark: reportData.totalAppointments },
            { subject: 'Patients', A: topDoc.uniquePatients, fullMark: reportData.totalAppointments },
            { subject: 'Success', A: topDoc.doctorCompleted, fullMark: reportData.totalAppointments },
            { subject: 'Confirmed', A: topDoc.confirmedAppointments, fullMark: reportData.totalAppointments },
        ] : [];

        return (
            <div className="visualizations-wrapper">
                {/* ADMIN VIEW SELECTOR */}
                <div className="view-mode-selector">
                    <button className={`btn-view ${displayMode === 'summary' ? 'active' : ''}`} onClick={() => setDisplayMode('summary')}>📊 Status</button>
                    <button className={`btn-view ${displayMode === 'trends' ? 'active' : ''}`} onClick={() => setDisplayMode('trends')}>📈 Trends</button>
                    <button className={`btn-view ${displayMode === 'comparative' ? 'active' : ''}`} onClick={() => setDisplayMode('comparative')}>👨‍⚕️ Doctors</button>
                    <button className={`btn-view ${displayMode === 'efficiency' ? 'active' : ''}`} onClick={() => setDisplayMode('efficiency')}>🎯 Efficiency</button>
                    <button className={`btn-view ${displayMode === 'specialties' ? 'active' : ''}`} onClick={() => setDisplayMode('specialties')}>🏥 Specialties</button>
                </div>

                <div className="chart-display-area">

                    {/* 1. SUMMARY MODE: Distribution & Raw Volumes */}
                    {displayMode === 'summary' && (
                        <div className="charts-grid">
                            <div className="chart-card">
                                <h4>Appointment Distribution</h4>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={90} label>
                                            {statusData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="chart-card">
                                <h4>Status Volume Breakdown</h4>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={statusData} layout="vertical">
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={100} />
                                        <Tooltip cursor={{ fill: 'transparent' }} />
                                        <Bar dataKey="value" radius={[0, 5, 5, 0]}>
                                            {statusData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* 2. TRENDS MODE: Density and Growth */}
                    {displayMode === 'trends' && (
                        <div>
                            <h4>Clinical Activity Density</h4>
                            <ResponsiveContainer width="100%" height={350}>
                                <AreaChart data={reportData.doctorStatistics}>
                                    <defs>
                                        <linearGradient id="colorGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#667eea" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#764ba2" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="doctorName" />
                                    <YAxis />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="totalAppointments" stroke="#764ba2" fillOpacity={1} fill="url(#colorGrad)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* 3. COMPARATIVE MODE: Performance Ratios */}
                    {displayMode === 'comparative' && (
                        <div>
                            <h4>Doctor Success vs. Cancelation Rates</h4>
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={reportData.doctorStatistics}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="doctorName" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="doctorCompleted" name="Completed" fill="#4caf50" stackId="a" />
                                    <Bar dataKey="cancelledAppointments" name="Cancelled" fill="#ff9800" stackId="a" />
                                    <Bar dataKey="confirmedAppointments" name="Future/Confirmed" fill="#2196f3" stackId="a" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                    {displayMode === 'efficiency' && (
                        <div className="charts-grid">
                            <div className="chart-card">
                                <h4>Top Performer Matrix: {topDoc?.doctorName}</h4>
                                <ResponsiveContainer width="100%" height={300}>
                                    <RadarChart data={radarData}>
                                        <PolarGrid />
                                        <PolarAngleAxis dataKey="subject" />
                                        <PolarRadiusAxis angle={30} domain={[0, 'auto']} />
                                        <Radar name="Performance" dataKey="A" stroke="#764ba2" fill="#667eea" fillOpacity={0.6} />
                                        <Tooltip />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="chart-card">
                                <h4>Patient Loyalty Scatter</h4>
                                <ResponsiveContainer width="100%" height={300}>
                                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />

                                        <XAxis
                                            type="number"
                                            dataKey="uniquePatients"
                                            name="Patients"
                                            domain={[0, 'dataMax + 1']}
                                            nice
                                        />
                                        <YAxis
                                            type="number"
                                            dataKey="totalAppointments"
                                            name="Appts"
                                            domain={[0, 'dataMax + 1']}
                                            nice
                                        />


                                        <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />

                                        <Scatter
                                            name="Doctors"
                                            data={reportData.doctorStatistics}
                                            fill="#764ba2"
                                        />
                                    </ScatterChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                    {displayMode === 'specialties' && (
                        <div>
                            <h4>Departmental Load Distribution</h4>
                            <ResponsiveContainer width="100%" height={400}>
                                <Treemap
                                    data={specialtyData}
                                    dataKey="value"
                                    ratio={4 / 3}
                                    stroke="#fff"
                                    fill="#667eea"
                                >
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
            <div className="reports-header">
                <h1>Medical Reports Dashboard</h1>
                <p>Analyze appointment trends and clinical statistics</p>
            </div>

            <div className="reports-container">
                <div className="report-controls">
                    <h2>Report Settings</h2>
                    <div className="report-type-selector" style={{ marginBottom: '15px' }}>
                        <button
                            className={`btn-toggle ${reportType === 'monthly' ? 'active' : ''}`}
                            onClick={() => setReportType('monthly')}
                        >Monthly Report</button>
                        <button
                            className={`btn-toggle ${reportType === 'annual' ? 'active' : ''}`}
                            onClick={() => setReportType('annual')}
                        >Annual Report</button>
                    </div>

                    <div className="controls-group">
                        {reportType === 'monthly' && (
                            <div className="control-item">
                                <label htmlFor="month">Month:</label>
                                <select
                                    id="month"
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                    className="control-select"
                                >
                                    {months.map(month => (
                                        <option key={month.value} value={month.value}>{month.label}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="control-item">
                            <label htmlFor="year">Year:</label>
                            <select
                                id="year"
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                className="control-select"
                            >
                                {years.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>

                        <button onClick={generateReport} className="btn-generate" disabled={loading}>
                            {loading ? 'Processing...' : 'Generate Report'}
                        </button>

                        {reportData && (
                            <button onClick={handlePrint} className="btn-download">Download PDF</button>
                        )}
                    </div>
                </div>

                {error && <div className="error-message">{error}</div>}
                {reportData && (
                    <div className="report-printable-area" ref={printRef}>
                        <div className="report-title">
                            <h2>
                                {reportType === 'monthly'
                                    ? `Monthly Report - ${getMonthName(reportData.month)} ${reportData.year}`
                                    : `Annual Report - ${reportData.year}`}
                            </h2>
                            <p className="report-date">Generated on: {new Date().toLocaleDateString()}</p>
                        </div>
                        {/* Render charts */}
                        {renderVisualizations()}

                        <div className="report-section">
                            <h3>Overall Statistics</h3>
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <div className="stat-number">{reportData.totalAppointments}</div>
                                    <div className="stat-label">Total</div>
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
                                                <th>Total Appts</th>
                                                <th>Unique Patients</th>
                                                <th>Completed</th>
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
                                <p className="no-data">No doctor data available for this selection.</p>
                            )}
                        </div>
                    </div>
                )}

                {!reportData && !loading && (
                    <div className="no-report">
                        <p>Configure the parameters above and click <strong>Generate Report</strong>.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ReportsPage;