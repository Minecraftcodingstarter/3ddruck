import React, { useState, useRef, useEffect } from 'react';
import ThreePreview from './ThreePreview';

export default function LibraryModal({ files, onSelectModel, onClose }) {
  const containerRef = useRef(null);
  const [visibleIndexes, setVisibleIndexes] = useState([]);

  useEffect(() => {
    // Direkt alle Indizes sichtbar machen, damit Vorschau sofort lädt
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
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        ref={containerRef}
        style={{
          background: '#fff',
          padding: '2rem',
          borderRadius: '12px',
          maxHeight: '80vh',
          overflowY: 'auto',
          width: '90%',
          maxWidth: '600px',
          boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
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
          <p style={{ textAlign: 'center', color: '#666' }}>
            Du hast noch keine Dateien hochgeladen.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {files.map((file, index) => (
              <div
                className="file-card"
                data-index={index}
                key={file.filename}
                style={{
                  border: '2px solid #eee',
                  borderRadius: '12px',
                  padding: '10px',
                  backgroundColor: '#f9f9f9',
                }}
              >
                {visibleIndexes.includes(index) ? (
                  <ThreePreview modelUrl={file.url} />
                ) : (
                  <div style={{ height: '200px', backgroundColor: '#ddd' }} />
                )}
                <p
                  style={{
                    textAlign: 'center',
                    marginTop: '10px',
                    fontSize: '0.9rem',
                    color: '#333',
                    wordBreak: 'break-all',
                  }}
                >
                  {file.filename}
                </p>
                <div style={{ textAlign: 'center', marginTop: '10px' }}>
                  <button
                    onClick={() => onSelectModel(file.url)}
                    style={{
                      backgroundColor: '#000000ff',
                      color: '#fff',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                    }}
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
