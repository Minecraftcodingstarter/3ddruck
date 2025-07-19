import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ThreePreview from './ThreePreview';
import Login from './Login';
import LibraryModal from './LibraryModal'; // Assuming you have this component
import PurchaseModal from './PurchaseModal'; // Assuming you have this component
import MeshyModal from './MeshyModal'; // Import the MeshyModal

axios.defaults.withCredentials = true;

const styles = {
  container: {
    margin: '5vh auto',
    maxWidth: 480,
    padding: '2rem',
    borderRadius: 16,
    background: '#fff',
    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.08)',
    position: 'relative',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    color: '#333',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '1.5rem',
    position: 'relative',
  },
  titleContainer: {
    flexGrow: 1,
    display: 'flex',
    justifyContent: 'center',
  },
  title: {
    margin: 0,
    fontWeight: '700',
    fontSize: '1.8rem',
  },
  userInfoContainer: {
    position: 'absolute',
    right: 0,
  },
  userInfo: {
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  loginBtn: {
    padding: '0.4rem 1rem',
    background: '#1976d2',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: '600',
  },
  logoutBtn: {
    padding: '0.3rem 0.8rem',
    borderRadius: 8,
    border: 'none',
    background: '#e53935',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'background-color 0.3s',
  },
  description: {
    textAlign: 'center',
    fontSize: '1rem',
    color: '#666',
    marginBottom: '1.8rem',
  },
  fileLabel: {
    display: 'block',
    width: '95%',
    padding: '0.75rem',
    background: '#2196F3',
    color: 'white',
    textAlign: 'center',
    borderRadius: 12,
    cursor: 'pointer',
    fontWeight: 500,
    marginBottom: '0.5rem',
    userSelect: 'none',
    transition: 'background-color 0.3s',
  },
  uploadBtn: {
    padding: '0.75rem',
    width: '100%',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: 12,
    fontSize: '1rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    background: '#fff',
    padding: '2rem',
    borderRadius: 12,
    minWidth: 320,
    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
    position: 'relative',
  },
  promptInput: {
    width: 'calc(100% - 1.5rem)',
    padding: '0.75rem',
    marginBottom: '0.5rem',
    border: '1px solid #ccc',
    borderRadius: 12,
    fontSize: '1rem',
  },
  generateButton: {
    padding: '0.75rem',
    width: '100%',
    backgroundColor: '#9C27B0', /* Purple color for generation */
    color: 'white',
    border: 'none',
    borderRadius: 12,
    fontSize: '1rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    marginBottom: '0.5rem',
  },
};

export default function App() {
  const [user, setUser] = useState(null);
  const [file, setFile] = useState(null);
  const [fileURL, setFileURL] = useState('');
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [pendingUpload, setPendingUpload] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [selectedModelUrl, setSelectedModelUrl] = useState('');
  const [userUploads, setUserUploads] = useState([]);
  const [modelDimensions, setModelDimensions] = useState({ x: 0, y: 0, z: 0 });
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [textPrompt, setTextPrompt] = useState(''); // Kept for future use if direct text prompt generation without MeshyModal is desired
  const [generating, setGenerating] = useState(false); // New state for generation loading
  const [showMeshyModal, setShowMeshyModal] = useState(false); // State to control MeshyModal visibility

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const res = await axios.get('http://localhost:3001/me');
        if (res.data.loggedIn) {
          setUser(res.data.username);
          fetchUserUploads();
        }
      } catch (err) {
        console.error('Fehler beim Prüfen des Login-Status:', err);
      }
    };

    checkLogin();
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:3001/logout');
    } catch (error) {
      console.error("Logout error:", error);
    }
    setUser(null);
    setFile(null);
    setFileURL('');
    setFileName('');
    setUserUploads([]);
  };

  const handleUpload = async (fileToUpload) => {
    if (!fileToUpload) return alert('Bitte Datei auswählen.');

    setUploading(true);
    const formData = new FormData();
    formData.append('file', fileToUpload);

    try {
      const res = await axios.post('http://localhost:3001/upload', formData);
      setFileURL(res.data.url);
      setFileName(res.data.filename); // Set filename from response
      alert('✅ Datei erfolgreich hochgeladen!');
      fetchUserUploads();
    } catch (err) {
      alert('Fehler beim Hochladen: ' + (err.response?.data?.error || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) return alert('Bitte Datei auswählen.');

    if (!user) {
      setShowLoginPrompt(true);
      setPendingUpload(true);
      return;
    }

    await handleUpload(file);
  };

  const handleLoginSuccess = (username) => {
    setUser(username);
    setShowLoginPrompt(false);

    if (pendingUpload && file) {
      handleUpload(file);
    }

    setPendingUpload(false);
    fetchUserUploads();
  };

  const fetchUserUploads = async () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    try {
      const response = await axios.get('http://localhost:3001/my-uploads');
      setUserUploads(response.data.files);
    } catch (error) {
      console.error('Fehler beim Abrufen der Benutzer-Uploads:', error);
      if (error.response && error.response.status === 401) {
        alert('Bitte logge dich ein, um deine Uploads zu sehen.');
        setUser(null);
        setShowLoginPrompt(true);
      } else {
        alert('Fehler beim Laden deiner hochgeladenen Dateien.');
      }
    }
  };

  // Callback function to handle model URL from MeshyModal
  const handleGenerate3DModelFromMeshy = (modelUrl) => {
    setFileURL(modelUrl);
    setFileName('KI-generiertes Modell');
    setShowMeshyModal(false); // Close the MeshyModal after generation
    setTextPrompt(''); // Clear the prompt if it was previously set for local text prompt generation
  };


  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.titleContainer}>
          <h1 style={styles.title}>3D-Druck Service</h1>
        </div>

        <div style={styles.userInfoContainer}>
          {user ? (
            <div style={styles.userInfo}>
              <button
                onClick={handleLogout}
                style={styles.logoutBtn}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#b71c1c')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#e53935')}
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowLoginPrompt(true)}
              style={styles.loginBtn}
            >
              Login
            </button>
          )}
        </div>
      </header>

      <p style={styles.description}>
        Lade deine 3D-Datei hoch, wähle ein Modell aus der Galerie oder lass eines per KI erstellen.
      </p>

      {/* Button to open MeshyModal */}
      <button
        type="button"
        onClick={() => {
          if (!user) {
            alert('Bitte logge dich ein, um ein 3D-Modell zu generieren.');
            setShowLoginPrompt(true);
          } else {
            setShowMeshyModal(true);
          }
        }}
        disabled={generating} // Disable if a model is currently being generated
        style={styles.generateButton}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#7B1FA2')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#9C27B0')}
      >
        {generating ? '⏳ Generiere Modell...' : '✨ Generiere 3D-Modell mit KI'}
      </button>


      <form onSubmit={handleSubmit}>
        <input
          id="file"
          type="file"
          accept=".glb,.gltf,.obj,.fbx"
          onChange={(e) => {
            setFile(e.target.files[0]);
            setFileName(e.target.files[0]?.name || '');
            setSelectedModelUrl('');
            setFileURL(''); // Clear fileURL when new file is selected
            setTextPrompt(''); // Clear prompt when selecting local file
          }}
          style={{ display: 'none' }}
        />
        <label
          htmlFor="file"
          style={styles.fileLabel}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1976d2')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2196F3')}
        >
          📁 Datei auswählen
        </label>

        {fileName && !generating && (
          <div style={{ ...styles.description, marginTop: '0.5rem', marginBottom: '1rem', color: '#555' }}>
            📦 {fileName}
          </div>
        )}

        <button
          type="submit"
          disabled={uploading}
          style={styles.uploadBtn}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#43a047')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#4CAF50')}
        >
          {uploading ? '⏳ Hochladen...' : '🚀 Hochladen'}
        </button>

        <button
          type="button"
          onClick={() => {
            if (!user) {
              setShowLoginPrompt(true);
            } else {
              fetchUserUploads();
              setShowLibrary(true);
            }
          }}
          style={{
            marginTop: '0.5rem',
            padding: '0.75rem',
            width: '100%',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: 12,
            fontSize: '1rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background-color 0.3s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1976d2')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2196F3')}
        >
          📚 Deine Objekte
        </button>
      </form>

      {fileURL && (
        <div style={{ marginTop: 24 }}>
          <ThreePreview
            modelUrl={fileURL}
            onModelLoaded={(size) => setModelDimensions(size)}
          />
        </div>
      )}

      {fileURL && modelDimensions.x > 0 && (
        <button
          type="button"
          onClick={() => setShowPurchaseModal(true)}
          style={{
            marginTop: '1rem',
            padding: '0.75rem',
            width: '100%',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: 12,
            fontSize: '1rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background-color 0.3s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#43a047')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#4CAF50')}
        >
          Kaufen
        </button>
      )}

      {showLoginPrompt && !user && (
        <div
          style={styles.modalOverlay}
          onClick={() => setShowLoginPrompt(false)}
        >
          <div
            style={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <Login onLogin={handleLoginSuccess} />
          </div>
        </div>
      )}

      {showLibrary && (
        <div
          style={styles.modalOverlay}
          onClick={() => setShowLibrary(false)}
        >
          <div
            style={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <LibraryModal
              files={userUploads}
              onSelectModel={(url) => {
                setSelectedModelUrl(url);
                setShowLibrary(false);
                setFileURL(url);
                setFileName('Aus Bibliothek geladen');
                setTextPrompt(''); // Clear prompt when selecting from library
              }}
              onClose={() => setShowLibrary(false)}
            />
          </div>
        </div>
      )}

      {showPurchaseModal && modelDimensions.x > 0 && (
        <PurchaseModal
          originalDimensions={modelDimensions}
          modelFile={fileURL}
          onClose={() => setShowPurchaseModal(false)}
          onPurchase={(data) => {
            console.log('Kaufdaten:', data);
            setShowPurchaseModal(false);
          }}
        />
      )}

      {showMeshyModal && (
        <div style={styles.modalOverlay} onClick={() => setShowMeshyModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <MeshyModal
              onClose={() => setShowMeshyModal(false)}
              onModelGenerated={handleGenerate3DModelFromMeshy}
            />
          </div>
        </div>
      )}
    </div>
  );
}