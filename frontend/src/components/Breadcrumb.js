import { Link, useLocation } from 'react-router-dom';
import './Breadcrumb.css';

const HOME = { label: 'Home', to: '/' };

function getCrumbs(pathname, search, state) {
    const view = new URLSearchParams(search).get('view');

    switch (pathname) {
        case '/login':
            return [HOME, { label: 'Login' }];
        case '/register':
            return [HOME, { label: 'Register' }];
        case '/patient/dashboard':
            return [HOME, { label: 'Dashboard' }];
        case '/doctor/dashboard':
            return [HOME, { label: 'Dashboard' }];
        case '/admin/dashboard':
            return [HOME, { label: 'Dashboard' }];
        case '/admin/reports':
            return [HOME, { label: 'Dashboard', to: '/admin/dashboard' }, { label: 'Reports' }];
        case '/appointments':
            if (view === 'myappointments') {
                if (state?.fromBooking) {
                    return [HOME, { label: 'Book Appointment', to: '/appointments?view=book' }, { label: 'My Appointments' }];
                }
                return [HOME, { label: 'My Appointments' }];
            }
            return [HOME, { label: 'Book Appointment' }];
        case '/payment':
            return [HOME, { label: 'Payment' }];
        default:
            return [HOME];
    }
}

function Breadcrumb() {
    const { pathname, search, state } = useLocation();

    if (pathname === '/') return null;

    const crumbs = getCrumbs(pathname, search, state);

    return (
        <nav className="breadcrumb-nav" aria-label="breadcrumb">
            <ol className="breadcrumb-list">
                {crumbs.map((crumb, i) => {
                    const isLast = i === crumbs.length - 1;
                    return (
                        <li key={i} className="breadcrumb-item">
                            {isLast ? (
                                <span className="breadcrumb-current">{crumb.label}</span>
                            ) : crumb.to ? (
                                <Link to={crumb.to} className="breadcrumb-link">{crumb.label}</Link>
                            ) : (
                                <span className="breadcrumb-link">{crumb.label}</span>
                            )}
                            {!isLast && <span className="breadcrumb-sep">›</span>}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}

export default Breadcrumb;
