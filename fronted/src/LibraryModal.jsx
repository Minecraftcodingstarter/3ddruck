import React, { useState, useRef, useEffect } from 'react';
import ThreePreview from './ThreePreview'; // Stelle sicher, dass dieser Pfad zu deiner ThreePreview-Komponente korrekt ist

export default function LibraryModal({ files, onSelectModel, onClose }) {
  const containerRef = useRef(null);
  // visibleIndexes wird derzeit verwendet, um alle Modelle sofort zu laden.
  // Für Lazy Loading (nur sichtbare Modelle laden) müsste dies angepasst werden,
  // z.B. mit einem Intersection Observer.
  const [visibleIndexes, setVisibleIndexes] = useState([]);

  // Dieser Effekt stellt sicher, dass alle Modelle sichtbar markiert und somit geladen werden.
  useEffect(() => {
    setVisibleIndexes(files.map((_, i) => i));
  }, [files]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Dunkler, halbtransparenter Hintergrund
        display: 'flex',
        justifyContent: 'center', // Zentriert das Modal horizontal
        alignItems: 'center',     // Zentriert das Modal vertikal
        zIndex: 1000,             // Stellt sicher, dass das Modal über allem anderen liegt
      }}
      onClick={onClose} // Schließt das Modal, wenn außerhalb geklickt wird
    >
      <div
        ref={containerRef}
        style={{
          background: '#fff',       // Weißer Hintergrund für das Modal
          padding: '2rem',          // Innenabstand
          borderRadius: '12px',     // Abgerundete Ecken
          maxHeight: '80vh',        // Maximale Höhe, um Scrollen zu ermöglichen
          overflowY: 'auto',        // Aktiviert vertikales Scrollen, wenn der Inhalt zu lang ist
          width: '90%',             // Nimmt 90% der verfügbaren Breite ein
          maxWidth: '900px',        // **MODIFIZIERT: Macht das Modal breiter** (vorher 600px)
                                    // Du könntest auch '1000px' oder '80vw' verwenden, je nach Bedarf.
          boxShadow: '0 8px 20px rgba(0,0,0,0.2)', // Dezenter Schatten für Tiefe
        }}
        onClick={(e) => e.stopPropagation()} // Verhindert, dass ein Klick innerhalb des Modals es schließt
      >
        <h2
          style={{
            textAlign: 'center',
            color: '#000000ff',
            marginBottom: '1.5rem',
          }}
        >
          Deine hochgeladenen Dateien
        </h2>

        {files.length === 0 ? (
          // Nachricht, wenn keine Dateien hochgeladen wurden
          <p style={{ textAlign: 'center', color: '#666' }}>
            Du hast noch keine Dateien hochgeladen.
          </p>
        ) : (
          // Container für die Liste der Datei-Karten
          <div
            style={{
              display: 'flex',
              flexDirection: 'column', // **Sorgt dafür, dass jedes Objekt unter dem vorherigen angezeigt wird**
              gap: '20px',             // Abstand zwischen den einzelnen Datei-Karten
            }}
          >
            {files.map((file, index) => (
              <div
                className="file-card" // Kann für spezifisches Styling in einer CSS-Datei verwendet werden
                data-index={index}
                key={file.filename} // Wichtig für die Performance von React-Listen
                style={{
                  border: '2px solid #eee',      // Leichter Rand um jede Karte
                  borderRadius: '12px',           // Abgerundete Ecken für die Karten
                  padding: '10px',                // Innenabstand der Karte
                  backgroundColor: '#f9f9f9',     // Hintergrundfarbe der Karte
                  display: 'flex',                // Flexbox für den Inhalt innerhalb der Karte
                  flexDirection: 'column',        // Inhalt (Vorschau, Name, Button) untereinander stapeln
                  alignItems: 'center',           // Zentriert den Inhalt horizontal in der Karte
                }}
              >
                {/* 3D-Vorschau-Komponente */}
                {visibleIndexes.includes(index) ? (
                  <ThreePreview modelUrl={file.url} />
                ) : (
                  // Platzhalter, falls Lazy Loading implementiert würde und die Vorschau noch nicht geladen ist
                  <div style={{ height: '200px', backgroundColor: '#ddd', width: '100%' }} />
                )}
                <p
                  style={{
                    textAlign: 'center',
                    marginTop: '10px',
                    fontSize: '0.9rem',
                    color: '#333',
                    wordBreak: 'break-all', // Bricht lange Dateinamen um
                  }}
                >
                  {file.filename}
                </p>
                <div style={{ textAlign: 'center', marginTop: '10px' }}>
                  <button
                    onClick={() => onSelectModel(file.url)}
                    style={{
                      backgroundColor: '#000000ff',  // Standard-Hintergrundfarbe des Buttons
                      color: '#fff',                  // Textfarbe des Buttons
                      border: 'none',                 // Kein Rand
                      padding: '8px 16px',            // Innenabstand
                      borderRadius: '8px',            // Abgerundete Ecken
                      cursor: 'pointer',              // Zeigt an, dass der Button klickbar ist
                      fontWeight: 'bold',             // Fettschrift
                      transition: 'background-color 0.2s ease', // Sanfter Übergang bei Hover
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#333333'} // Dunkler bei Hover
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#000000ff'} // Zurück zur Standardfarbe
                  >
                    Wählen
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}