export function getCookiePreferences() {
  try {
    const saved = localStorage.getItem('cookiePreferences');
    if (saved) return JSON.parse(saved);
  } catch {
    // ignore
  }
  return { essential: true, functional: true };
}

export function isFunctionalAllowed() {
  return getCookiePreferences().functional === true;
}
