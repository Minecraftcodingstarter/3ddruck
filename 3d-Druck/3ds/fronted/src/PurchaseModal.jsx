// Purchasemodal.jsx
import React, { useState, useEffect } from 'react';

export default function PurchaseModal({ originalDimensions, modelFile, onClose, onPurchase }) {
  // State variables
  const [scale, setScale] = useState(1.0);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1);
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [paymentCode, setPaymentCode] = useState('');

  // Calculate max scale factor
  const maxScale = Math.min(
    40 / originalDimensions.x,
    40 / originalDimensions.y,
    40 / originalDimensions.z
  );

  // Initial scale setup
  useEffect(() => {
    if (originalDimensions.x > 0 && originalDimensions.y > 0 && originalDimensions.z > 0) {
      const calculatedMaxScale = Math.min(
        40 / originalDimensions.x,
        40 / originalDimensions.y,
        40 / originalDimensions.z
      );
      const roundedScale = Math.floor(calculatedMaxScale * 100) / 100;
      setScale(roundedScale);
    }
  }, [originalDimensions]);

  // Handle scale change
  const handleScaleChange = (e) => {
    const newScale = parseFloat(e.target.value);
    const clampedScale = isNaN(newScale) ? maxScale : Math.min(newScale, maxScale);
    const roundedScale = Math.floor(clampedScale * 100) / 100;

    setScale(roundedScale);

    if (clampedScale < newScale) {
      setError('Die Skalierung wurde auf den maximal erlaubten Faktor reduziert.');
    } else {
      setError(null);
    }
  };

  // Calculate scaled dimensions
  const scaledDimensions = {
    x: Math.floor(originalDimensions.x * scale * 100) / 100,
    y: Math.floor(originalDimensions.y * scale * 100) / 100,
    z: Math.floor(originalDimensions.z * scale * 100) / 100,
  };

  // Handle next step
  const handleNextStep = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (!address || !postalCode || !city) {
        setError('Bitte fülle alle Felder aus.');
        return;
      }
      setError(null);
      setStep(3);
    } else if (step === 3) {
      if (!paymentCode) {
        setError('Bitte gib einen Test-Zahlungscode ein.');
        return;
      }
      setError(null);

      // Assemble purchase data
      const purchaseData = {
        scaledDimensions,
        address,
        postalCode,
        city,
        modelUrl: modelFile, // <--- CHANGED THIS LINE: Renamed modelFile to modelUrl
      };

      if (!modelFile) {
        setError('Fehlende Daten: Modelldatei ist erforderlich.');
        return;
      }

      console.log('Sende Kaufdaten:', purchaseData);

      // POST request to purchase endpoint
      fetch('http://localhost:3001/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(purchaseData),
      })
        .then((res) => {
          if (res.ok) {
            alert('✅ Kauf erfolgreich! Deine Datei wurde gespeichert.');
            onPurchase({ ...scaledDimensions, address, postalCode, city });
            onClose();
          } else {
            return res.json().then((data) => {
              throw new Error(data.error || 'Kauf fehlgeschlagen');
            });
          }
        })
        .catch((err) => {
          console.error('❌ Fehler beim Kauf:', err);
          if (err.message.includes('Unexpected token')) {
            setError('Kauf fehlgeschlagen: Ungültige Antwort vom Server.');
          } else {
            setError('Kauf fehlgeschlagen: ' + err.message);
          }
        });
    }
  };

  // Handle back step
  const handleBackStep = () => {
    setStep(1);
    setPaymentCode('');
    setError(null);
  };

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
        style={{
          background: '#fff',
          padding: '2rem',
          borderRadius: '12px',
          minWidth: '320px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ textAlign: 'center', color: '#000000ff', marginBottom: '1.5rem' }}>
          {step === 1 ? '✅ Kauf bestätigen' : step === 2 ? '📬 Lieferadresse' : '💳 Zahlung'}
        </h2>

        {step === 1 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontWeight: 'bold' }}>Originalgröße (cm):</label>
              <p>Breite: {originalDimensions.x.toFixed(2)} cm</p>
              <p>Höhe: {originalDimensions.y.toFixed(2)} cm</p>
              <p>Tiefe: {originalDimensions.z.toFixed(2)} cm</p>
            </div>
            <div>
              <label style={{ fontWeight: 'bold' }}>
                Maximal erlaubter Skalierungsfaktor: {maxScale.toFixed(2)}
              </label>
              <input
                type="number"
                min="0.1"
                step="0.01"
                value={scale.toFixed(2)}
                onChange={handleScaleChange}
                style={{ padding: '0.5rem', width: '100%', borderRadius: '8px' }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 'bold' }}>Gewünschte Größe (cm):</label>
              <p>Breite: {scaledDimensions.x.toFixed(2)} cm</p>
              <p>Höhe: {scaledDimensions.y.toFixed(2)} cm</p>
              <p>Tiefe: {scaledDimensions.z.toFixed(2)} cm</p>
            </div>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <button
              onClick={handleNextStep}
              style={{
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                padding: '0.75rem',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              Weiter
            </button>
          </div>
        ) : step === 2 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ textAlign: 'center', color: '#666' }}>
              Bitte gib deine Lieferadresse, Postleitzahl und Ort an.
            </p>
            <input
              type="text"
              placeholder="Adresse"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              style={{ padding: '0.5rem', width: '100%', borderRadius: '8px' }}
            />
            <input
              type="text"
              placeholder="Postleitzahl"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              style={{ padding: '0.5rem', width: '100%', borderRadius: '8px' }}
            />
            <input
              type="text"
              placeholder="Ort"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              style={{ padding: '0.5rem', width: '100%', borderRadius: '8px' }}
            />
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Zurück
              </button>
              <button
                onClick={handleNextStep}
                style={{
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Weiter
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ textAlign: 'center', color: '#666' }}>
              Bitte gib einen Test-Zahlungscode ein (z.B. "123456").
            </p>
            <input
              type="text"
              placeholder="Zahlungscode"
              value={paymentCode}
              onChange={(e) => setPaymentCode(e.target.value)}
              style={{ padding: '0.5rem', width: '100%', borderRadius: '8px' }}
            />
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                onClick={handleBackStep}
                style={{
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Zurück
              </button>
              <button
                onClick={handleNextStep}
                style={{
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Kauf abschließen
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}