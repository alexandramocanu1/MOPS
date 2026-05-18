import { useState, useEffect } from 'react';
import './CookieConsent.css';

const CATEGORIES = [
  {
    id: 'essential',
    label: 'Strictly Necessary',
    required: true,
    description:
      'These cookies are required for the platform to function and cannot be disabled. They are used to keep you logged in and remember your cookie preferences.',
    cookies: [
      { name: 'user', purpose: 'Stores your login session so you stay signed in.' },
      { name: 'cookiesAccepted', purpose: 'Remembers that you accepted this cookie notice.' },
    ],
  },
  {
    id: 'functional',
    label: 'Functional',
    required: false,
    description:
      'These cookies enable additional functionality that improves your experience. Disabling them may affect certain features.',
    cookies: [
      { name: 'pendingAppointmentId', purpose: 'Temporarily tracks your appointment during the payment process to confirm it once payment is complete.' },
    ],
  },
];

function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [consents, setConsents] = useState({ essential: true, functional: true });

  useEffect(() => {
    if (!localStorage.getItem('cookiesAccepted')) {
      setVisible(true);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('cookiesAccepted', 'true');
    localStorage.setItem('cookiePreferences', JSON.stringify({ essential: true, functional: true }));
    setVisible(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem('cookiesAccepted', 'true');
    localStorage.setItem('cookiePreferences', JSON.stringify(consents));
    setVisible(false);
  };

  const toggleCategory = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleConsent = (id) => {
    setConsents((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (!visible) return null;

  return (
    <div className="cookie-overlay">
      <div className="cookie-modal">
        <div className="cookie-modal-header">
          <h2>Cookie Preferences</h2>
          <p>
            We use cookies to ensure the platform works correctly and to provide you with the best possible experience.
            You can choose which categories to allow below.
          </p>
        </div>

        {!showDetails ? (
          <div className="cookie-modal-body">
            <p className="cookie-intro">
              By clicking <strong>Accept All</strong> you agree to our use of all cookies.
              You can also customise your preferences by clicking <strong>Manage Preferences</strong>.
            </p>
            <div className="cookie-actions">
              <button className="cookie-btn cookie-btn--secondary" onClick={() => setShowDetails(true)}>
                Manage Preferences
              </button>
              <button className="cookie-btn cookie-btn--primary" onClick={handleAcceptAll}>
                Accept All
              </button>
            </div>
          </div>
        ) : (
          <div className="cookie-modal-body">
            {CATEGORIES.map((cat) => (
              <div className="cookie-category" key={cat.id}>
                <div className="cookie-category-header" onClick={() => toggleCategory(cat.id)}>
                  <div className="cookie-category-left">
                    <span className="cookie-expand-icon">{expanded[cat.id] ? '▾' : '▸'}</span>
                    <span className="cookie-category-label">{cat.label}</span>
                    {cat.required && <span className="cookie-required-badge">Always active</span>}
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <label className="cookie-toggle">
                      <input
                        type="checkbox"
                        checked={cat.required ? true : consents[cat.id]}
                        disabled={cat.required}
                        onChange={() => !cat.required && toggleConsent(cat.id)}
                      />
                      <span className="cookie-toggle-slider"></span>
                    </label>
                  </div>
                </div>

                {expanded[cat.id] && (
                  <div className="cookie-category-body">
                    <p className="cookie-category-description">{cat.description}</p>
                    <table className="cookie-table">
                      <thead>
                        <tr>
                          <th>Cookie</th>
                          <th>Purpose</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cat.cookies.map((c) => (
                          <tr key={c.name}>
                            <td><code>{c.name}</code></td>
                            <td>{c.purpose}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}

            <div className="cookie-actions">
              <button className="cookie-btn cookie-btn--secondary" onClick={() => setShowDetails(false)}>
                Back
              </button>
              <button className="cookie-btn cookie-btn--outline" onClick={handleSavePreferences}>
                Save Preferences
              </button>
              <button className="cookie-btn cookie-btn--primary" onClick={handleAcceptAll}>
                Accept All
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CookieConsent;
