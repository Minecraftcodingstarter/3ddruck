import React, { useState } from 'react';
import axios from 'axios';

const styles = {
  container: {
    width: '100%',
    maxWidth: 360,
    margin: '0 auto',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    color: '#333',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  heading: {
    marginBottom: '1rem',
    textAlign: 'center',
    color: '#1976d2',
    fontWeight: '700',
  },
  input: {
    padding: '0.6rem 1rem',
    fontSize: '1rem',
    borderRadius: 8,
    border: '1.5px solid #ccc',
    transition: 'border-color 0.3s',
    outline: 'none',
  },
  inputFocus: {
    borderColor: '#2196F3',
  },
  primaryBtn: {
    padding: '0.65rem',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    fontWeight: '600',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
  primaryBtnGreen: {
    backgroundColor: '#4CAF50',
  },
  primaryBtnHover: {
    backgroundColor: '#1976d2',
  },
  primaryBtnGreenHover: {
    backgroundColor: '#388E3C',
  },
  linkBtn: {
    marginTop: '0.5rem',
    background: 'transparent',
    border: 'none',
    color: '#2196F3',
    cursor: 'pointer',
    textDecoration: 'underline',
    fontSize: '0.9rem',
    alignSelf: 'center',
  },
  alert: {
    padding: '0.6rem',
    backgroundColor: '#ffcccc',
    borderRadius: 8,
    color: '#a94442',
    textAlign: 'center',
    marginBottom: '1rem',
  },
};

export default function Login({ onLogin }) {
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
    <div style={styles.container}>
      {!isRegistering ? (
        <form onSubmit={handleLogin} style={styles.form}>
          <h2 style={styles.heading}>🔐 Login erforderlich</h2>
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
  );
}
