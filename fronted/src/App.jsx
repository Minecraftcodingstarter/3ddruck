// App.jsx
import React, { useState, useEffect, useCallback } from 'react'; // useCallback hinzugefügt
import axios from 'axios';
import ThreePreview from './ThreePreview';
import Login from './Login';
import LibraryModal from './LibraryModal';
import PurchaseModal from './PurchaseModal';
import Header from './Headera';
import AIGenerator from './AIGenerator';

axios.defaults.withCredentials = true;

export default function App() {
  const [user, setUser] = useState(null);
  const [file, setFile] = useState(null);
  const [fileURL, setFileURL] = useState('');
  const [fileName, setFileName] = useState('');
  const [uploading, setLoading] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [pendingUpload, setPendingUpload] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [userUploads, setUserUploads] = useState([]);
  const [modelDimensions, setModelDimensions] = useState({ x: 0, y: 0, z: 0 });
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');

  // Effekt, um den Benutzerstatus beim Laden der Komponente zu überprüfen
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const response = await axios.get('http://localhost:3001/me');
        if (response.data.loggedIn) {
          setUser(response.data.username);
          fetchUserUploads(); // Uploads abrufen, wenn eingeloggt
        }
      } catch (error) {
        console.error('Fehler beim Überprüfen des Login-Status:', error);
      }
    };
    checkLoginStatus();
  }, []);

  // Callback für das Laden von Benutzer-Uploads
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
        // alert('Bitte logge dich ein, um deine Uploads zu sehen.'); // Vermeiden Sie Alerts in Production
        setUser(null);
        setShowLoginPrompt(true);
      } else {
        // alert('Fehler beim Laden deiner hochgeladenen Dateien.'); // Vermeiden Sie Alerts in Production
      }
    }
  };

  // Callback für die Generierung von 3D-Modellen durch KI
  const handleGenerate3DModel = (modelUrl, modelName = 'KI-generiertes Modell') => {
    setFileURL(modelUrl);
    setFileName(modelName);
    setCurrentPage('home');
  };

  // Callback für die Navigation zwischen Seiten
  const handleNavigate = (page) => {
    setCurrentPage(page);
    if (page === 'myModels' && !user) {
      // alert('Bitte logge dich ein, um deine Modelle zu sehen.'); // Vermeiden Sie Alerts in Production
      setShowLoginPrompt(true);
    } else if (page === 'myModels' && user) {
      fetchUserUploads();
    }
  };

  // Callback für den erfolgreichen Login
  const handleLoginSuccess = (username) => {
    setUser(username);
    setShowLoginPrompt(false);
    if (pendingUpload && file) {
      handleUpload(file);
    }
    setPendingUpload(false);
    fetchUserUploads();
  };

  // Callback für den Datei-Upload
  const handleUpload = async (fileToUpload) => {
    if (!fileToUpload) {
      // alert('Bitte Datei auswählen.'); // Vermeiden Sie Alerts in Production
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append('file', fileToUpload);
    try {
      const res = await axios.post('http://localhost:3001/upload', formData);
      setFileURL(res.data.url);
      setFileName(res.data.filename);
      // alert('✅ Datei erfolgreich hochgeladen!'); // Vermeiden Sie Alerts in Production
      fetchUserUploads();
    } catch (err) {
      // alert('Fehler beim Hochladen: ' + (err.response?.data?.error || err.message)); // Vermeiden Sie Alerts in Production
    } finally {
      setLoading(false);
    }
  };

  // Callback für den Logout
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
    setCurrentPage('home'); // Nach dem Logout zur Startseite umleiten
  };

  // NEU: Memoizierte Callback-Funktion für onModelLoaded
  const handleModelLoaded = useCallback((size) => {
    setModelDimensions(size);
  }, []); // Leeres Abhängigkeits-Array bedeutet, dass die Funktion stabil ist

  // Rendert den Inhalt basierend auf der aktuellen Seite
  const renderContent = () => {
    switch (currentPage) {
      case 'home':
        return (
          <>
            <div className="left-sidebar">
              <div className="description-box">
                <div>
                    <h2 className="description-title">Ihre Vision, Realität.</h2>
                    <p>Wir verwandeln Ihre virtuelle Träume in greifbare Realität!</p>
                    <p>Mit unserem hochmodernen 3D-Druckservice und erstklassigem Filament fertigen wir präzise und langlebige Objekte.</p>
                    <br/>
                    <p><b>Kein 3D-Modell zur Hand?</b></p>
                    <p>Kein Problem! Nutzen Sie unseren integrierten KI-Generator oder lassen Sie es von unserem Team individuell für Sie gestalten.</p>
                </div>
              </div>
              <div className="file-upload-section">
                <input
                  id="file-upload-input"
                  type="file"
                  accept=".glb,.gltf,.obj,.fbx"
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    const selectedFile = e.target.files[0];
                    if (!selectedFile) return;
                    setFile(selectedFile);
                    setFileName(selectedFile.name || '');
                    if (!user) {
                      setShowLoginPrompt(true);
                      setPendingUpload(true);
                      return;
                    }
                    await handleUpload(selectedFile);
                  }}
                />
                <button
                  type="button"
                  className="upload-btn"
                  disabled={uploading}
                  onClick={() => document.getElementById('file-upload-input').click()}
                >
                  {uploading ? 'Lädt hoch...' : 'Datei hochladen & Anzeigen'}
                </button>
                {fileName && <div className="file-name-display">📦 {fileName}</div>}
              </div>
            </div>

            <div className="main-content">
              {fileURL ? (
                <>
                  {/* Übergabe der memoizierten Callback-Funktion */}
                  <ThreePreview modelUrl={fileURL} onModelLoaded={handleModelLoaded} />
                  {modelDimensions.x > 0 && (
                    <button type="button" className="purchase-button" onClick={() => setShowPurchaseModal(true)}>
                      Druck anfragen & Kaufen
                    </button>
                  )}
                </>
              ) : (
                <div className="empty-content-placeholder">
                  <p>Laden Sie eine 3D-Datei hoch, wählen Sie eine aus Ihrer Bibliothek oder generieren Sie eine mit KI.</p>
                </div>
              )}
            </div>
          </>
        );
      case 'myModels':
        return (
          <div className="full-width-content">
            <h2 className="page-title">Deine hochgeladenen Modelle</h2>
            {userUploads.length === 0 ? (
              <p style={{ textAlign: 'center' }}>Du hast noch keine Modelle hochgeladen.</p>
            ) : (
              <div className="model-display-grid">
                {userUploads.map((file) => (
                  <div key={file.filename} className="model-card">
                    <ThreePreview modelUrl={file.url} />
                    <p className="model-title">{file.filename}</p>
                    <button
                      className="model-select-button"
                      onClick={() => {
                        setFileURL(file.url);
                        setFileName(file.filename);
                        setCurrentPage('home');
                      }}
                    >
                      Anzeigen
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
       case 'aiGenerator':
        return (
          <div className="full-width-content">
            <AIGenerator onModelGenerated={handleGenerate3DModel} />
          </div>
        );
      case 'support':
        return (
          <div className="full-width-content support-page">
            <h2 className="page-title">Support & Kontakt</h2>
            <p>Haben Sie Fragen oder benötigen Sie Hilfe? Kontaktieren Sie uns gerne!</p>
            <p>E-Mail: <a href="mailto:support@3ddruckservice.de">support@3ddruckservice.de</a></p>
            <p>Unser Support-Team ist Montag bis Freitag von 9:00 bis 17:00 Uhr für Sie da.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="app-container">
      <Header
        user={user}
        onLogout={handleLogout}
        onLoginClick={() => setShowLoginPrompt(true)}
        onNavigate={handleNavigate}
      />
      <main className="app-content">
        {renderContent()}
      </main>
      {showLoginPrompt && !user && (
        <Login onLogin={handleLoginSuccess} onClose={() => setShowLoginPrompt(false)} />
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
    </div>
  );
}
