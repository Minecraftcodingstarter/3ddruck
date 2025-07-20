import React from 'react';

// Styles for the Header component using relative units
const headerStyles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1% 3%', // Using percentages for padding
    backgroundColor: '#1a1a1a',
    borderBottom: '1px solid #4CAF50',
    color: '#e0e0e0',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
    position: 'fixed',
    width: '100%',
    top: 0,
    left: 0,
    zIndex: 1000,
  },
  logo: {
    fontSize: '2.2vw', // Viewport width for font size
    fontWeight: '700',
    color: '#4CAF50',
    textDecoration: 'none',
  },
  nav: {
    display: 'flex',
    gap: '3%', // Percentage-based gap
  },
  navLink: {
    color: '#e0e0e0',
    textDecoration: 'none',
    fontSize: '1.4vw', // Viewport width for font size
    fontWeight: '500',
    padding: '1% 0',
    transition: 'color 0.3s ease, border-bottom 0.3s ease',
    borderBottom: '2px solid transparent',
  },
  navLinkHover: {
    color: '#4CAF50',
    borderBottom: '2px solid #4CAF50',
  },
  authSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5%', // Percentage-based gap
  },
  authButton: {
    padding: '1% 2%', // Percentages for padding
    borderRadius: '1vw', // Viewport width for border radius
    border: 'none',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease, color 0.3s ease',
    fontSize: '1.2vw',
  },
  loginButton: {
    backgroundColor: '#4CAF50',
    color: 'white',
  },
  loginButtonHover: {
    backgroundColor: '#43a047',
  },
  logoutButton: {
    backgroundColor: '#e53935',
    color: 'white',
  },
  logoutButtonHover: {
    backgroundColor: '#b71c1c',
  },
  usernameText: {
    fontSize: '1.2vw', // Viewport width for font size
    color: '#e0e0e0',
  }
};

/**
 * Header component for site navigation and user authentication.
 * @param {object} props - Component props.
 * @param {string|null} props.user - Current logged-in username or null.
 * @param {function} props.onLogout - Callback for logout action.
 * @param {function} props.onLoginClick - Callback for login button click.
 * @param {function} props.onNavigate - Callback for navigation clicks.
 */
export default function Header({ user, onLogout, onLoginClick, onNavigate }) {
  return (
    <header className="site-header">
      <a href="#" className="site-logo" onClick={() => onNavigate('home')}>
        3D-Druck Service
      </a>

      <nav className="main-nav">
        <a href="#" onClick={() => onNavigate('home')}>Startseite</a>
        <a href="#" onClick={() => onNavigate('myModels')}>Meine Modelle</a>
        <a href="#" onClick={() => onNavigate('aiGenerator')}>KI-Generator</a>
        <a href="#" onClick={() => onNavigate('support')}>Support</a>
      </nav>

      <div className="auth-section">
        {user ? (
          <>
            <span className="username-text">Willkommen, {user}!</span>
            <button onClick={onLogout} className="auth-button logout-button">
              Logout
            </button>
          </>
        ) : (
          <button onClick={onLoginClick} className="auth-button login-button">
              Login
          </button>
        )}
      </div>
    </header>
  );
}
