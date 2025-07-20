import React, { useState } from 'react';
import axios from 'axios';

const styles = {
  overlay: { // New style for the overlay
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    width: '100%',
    maxWidth: 360,
    padding: '2rem',
    borderRadius: 12,
    backgroundColor: '#282828', // Darker background for the modal
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    color: '#e0e0e0', // Lighter text for dark background
    position: 'relative', // Needed for absolute positioning of close button
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  heading: {
    marginBottom: '1rem',
    textAlign: 'center',
    color: '#2196F3', // Primary color
    fontWeight: '700',
  },
  input: {
    padding: '0.6rem 1rem',
    fontSize: '1rem',
    borderRadius: 8,
    border: '1.5px solid #555', // Softer border color
    backgroundColor: '#3a3a3a', // Darker input background
    color: '#e0e0e0', // Lighter input text
    transition: 'border-color 0.3s',
    outline: 'none',
  },
  inputFocus: {
    borderColor: '#1976D2', // Primary color on focus
  },
  primaryBtn: {
    padding: '0.65rem',
    backgroundColor: '#2196F3', // Primary color
    color: 'white',
    border: 'none',
    borderRadius: 8,
    fontWeight: '600',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
  primaryBtnGreen: {
    backgroundColor: '#2196F3',
  },
  primaryBtnHover: {
    backgroundColor: '#1976D2', // Darker primary for hover
  },
  primaryBtnGreenHover: {
    backgroundColor: '#1976D2',
  },
  linkBtn: {
    marginTop: '0.5rem',
    background: 'transparent',
    border: 'none',
    color: '#2196F3', // Primary color for link
    cursor: 'pointer',
    textDecoration: 'underline',
    fontSize: '0.9rem',
    alignSelf: 'center',
  },
  alert: {
    padding: '0.6rem',
    backgroundColor: '#b71c1c', // Darker red for error
    borderRadius: 8,
    color: 'white',
    textAlign: 'center',
    marginBottom: '1rem',
  },
  closeButton: { // New style for the close button
    position: 'absolute',
    top: '10px',
    right: '10px',
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    color: '#aaa',
    cursor: 'pointer',
    padding: '5px',
    lineHeight: 1,
  },
};

export default function Login({ onLogin, onClose }) { // Added onClose prop
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerPasswordConfirm, setRegisterPasswordConfirm] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await axios.post(
        'http://localhost:3001/login',
        { username, password },
        { withCredentials: true }
      );
      onLogin(username);
    } catch (err) {
      setErrorMsg('Login fehlgeschlagen. Bitte überprüfe deine Daten.');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (registerPassword !== registerPasswordConfirm) {
      setErrorMsg('Passwörter stimmen nicht überein');
      return;
    }

    try {
      await axios.post(
        'http://localhost:3001/register',
        { username: registerUsername, password: registerPassword },
        { withCredentials: true }
      );
      alert('Registrierung erfolgreich! Bitte jetzt einloggen.');
      setIsRegistering(false);
      setUsername(registerUsername);
      setPassword('');
      setRegisterUsername('');
      setRegisterPassword('');
      setRegisterPasswordConfirm('');
    } catch (err) {
      setErrorMsg('Registrierung fehlgeschlagen: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div style={styles.overlay} onClick={(e) => { // Click on overlay to close
      if (e.target === e.currentTarget) {
        onClose();
      }
    }}>
      <div style={styles.container} onClick={(e) => e.stopPropagation()}> {/* Prevent clicks inside from closing */}
        <button style={styles.closeButton} onClick={onClose}>
          &times;
        </button>
        {!isRegistering ? (
          <form onSubmit={handleLogin} style={styles.form}>
            <h2 style={styles.heading}>Login erforderlich</h2>
            {errorMsg && <div style={styles.alert}>{errorMsg}</div>}
            <input
              type="text"
              placeholder="Benutzername"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={styles.input}
            />
            <input
              type="password"
              placeholder="Passwort"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
            />
            <button
              type="submit"
              style={styles.primaryBtn}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.primaryBtnHover.backgroundColor)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = styles.primaryBtn.backgroundColor)}
            >
              Einloggen
            </button>
            <button
              type="button"
              onClick={() => {
                setErrorMsg('');
                setIsRegistering(true);
              }}
              style={styles.linkBtn}
            >
              Neu hier? Registrieren
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} style={styles.form}>
            <h2 style={styles.heading}>📝 Registrierung</h2>
            {errorMsg && <div style={styles.alert}>{errorMsg}</div>}
            <input
              type="text"
              placeholder="Benutzername"
              value={registerUsername}
              onChange={(e) => setRegisterUsername(e.target.value)}
              required
              style={styles.input}
            />
            <input
              type="password"
              placeholder="Passwort"
              value={registerPassword}
              onChange={(e) => setRegisterPassword(e.target.value)}
              required
              style={styles.input}
            />
            <input
              type="password"
              placeholder="Passwort bestätigen"
              value={registerPasswordConfirm}
              onChange={(e) => setRegisterPasswordConfirm(e.target.value)}
              required
              style={styles.input}
            />
            <button
              type="submit"
              style={{ ...styles.primaryBtn, ...styles.primaryBtnGreen }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.primaryBtnGreenHover.backgroundColor)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = styles.primaryBtnGreen.backgroundColor)}
            >
              Registrieren
            </button>
            <button
              type="button"
              onClick={() => {
                setErrorMsg('');
                setIsRegistering(false);
              }}
              style={styles.linkBtn}
            >
              Zurück zum Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
