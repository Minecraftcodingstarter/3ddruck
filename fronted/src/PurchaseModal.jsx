// PurchaseModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Ruler, MapPin, CreditCard,
  ArrowLeft, ArrowRight, CheckCircle, X
} from 'lucide-react';

import './purchaseModal.css';

export default function PurchaseModal({ originalDimensions, modelFile, onClose, onPurchase }) {
  const [scale, setScale] = useState(1.0);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1);
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [paymentCode, setPaymentCode] = useState('');
  const [editableDimensions, setEditableDimensions] = useState({ x: 0, y: 0, z: 0 });

  const [isEditingDimension, setIsEditingDimension] = useState(null); // 'x', 'y', 'z', or null

  const MAX_DIMENSION_CM = 20;

  const scaleInputRef = useRef(null);
  const addressInputRef = useRef(null);
  const postalCodeInputRef = useRef(null);
  const cityInputRef = useRef(null);
  const paymentCodeInputRef = useRef(null);

  const calculateMaxScale = () => {
    if (originalDimensions.x === 0 || originalDimensions.y === 0 || originalDimensions.z === 0) return 0;

    const max = Math.min(
      MAX_DIMENSION_CM / originalDimensions.x,
      MAX_DIMENSION_CM / originalDimensions.y,
      MAX_DIMENSION_CM / originalDimensions.z
    );

    return Math.floor(max * 100) / 100;
  };

  useEffect(() => {
    if (originalDimensions.x > 0 && originalDimensions.y > 0 && originalDimensions.z > 0) {
      const calculatedMaxScale = calculateMaxScale();
      const initialScale = parseFloat(calculatedMaxScale.toFixed(2));
      setScale(initialScale);
      updateEditableDimensions(initialScale);
    }
  }, [originalDimensions]);

  useEffect(() => {
    if (step === 1) {
      scaleInputRef.current?.focus();
    } else if (step === 2) {
      addressInputRef.current?.focus();
    } else if (step === 3) {
      paymentCodeInputRef.current?.focus();
    }
  }, [step]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const updateEditableDimensions = (scaleValue) => {
    setEditableDimensions({
      x: parseFloat((originalDimensions.x * scaleValue).toFixed(2)),
      y: parseFloat((originalDimensions.y * scaleValue).toFixed(2)),
      z: parseFloat((originalDimensions.z * scaleValue).toFixed(2)),
    });
  };

  const handleScaleChange = (e) => {
    const value = e.target.value;
    setScale(value);

    if (!isNaN(parseFloat(value)) && parseFloat(value) > 0) {
      const newScale = parseFloat(value);
      const calculatedMaxScale = calculateMaxScale();
      const clampedScale = Math.min(newScale, calculatedMaxScale);

      // Only update dimensions if the input is a valid number, but don't round yet
      // This allows the user to type "0.01" fully
      // The actual rounding and full validation happens onBlur
      updateEditableDimensions(clampedScale);
      // The error message for exceeding max scale can be shown immediately
      setError(clampedScale < newScale ? `Maximaler Faktor ist ${calculatedMaxScale.toFixed(2)}.` : null);
    } else if (value !== '') { // Only set error if input is not just empty
        setError('Bitte eine gültige positive Zahl eingeben.');
    } else {
        setError(null); // Clear error if input becomes empty
    }
  };

  const handleScaleBlur = () => {
    const newScale = parseFloat(scale);
    const calculatedMaxScale = calculateMaxScale();
    const clampedScale = isNaN(newScale) ? calculatedMaxScale : Math.min(newScale, calculatedMaxScale);
    const roundedScale = parseFloat(clampedScale.toFixed(2));
    setScale(roundedScale);
    updateEditableDimensions(roundedScale);
    // FIX: Corrected typo from claledScale to clampedScale
    setError(clampedScale < newScale ? `Maximaler Faktor ist ${calculatedMaxScale.toFixed(2)}.` : null);
  };

  const handleDimensionChangeWithRatio = (changedAxis, value) => {
    // Allow partial input without immediate rounding for a smooth typing experience
    setEditableDimensions(prev => ({ ...prev, [changedAxis]: value }));

    if (!isNaN(parseFloat(value)) && parseFloat(value) > 0) {
      const newValue = parseFloat(value);
      const ratio = newValue / originalDimensions[changedAxis];
      const newX = originalDimensions.x * ratio;
      const newY = originalDimensions.y * ratio;
      const newZ = originalDimensions.z * ratio;

      if (newX > MAX_DIMENSION_CM || newY > MAX_DIMENSION_CM || newZ > MAX_DIMENSION_CM) {
        setError(`Maximale Dimension überschritten (${MAX_DIMENSION_CM} cm).`);
        // Do NOT return here immediately, let the user see their input that caused the error
        return;
      }

      setEditableDimensions({
        x: parseFloat(newX.toFixed(2)),
        y: parseFloat(newY.toFixed(2)),
        z: parseFloat(newZ.toFixed(2)),
      });
      setScale(parseFloat(ratio.toFixed(2)));
      setError(null);
    } else if (value !== '') {
        setError('Ungültiger Wert. Muss positiv sein.');
    } else {
        setError(null);
    }
  };

  const handleDimensionBlur = (axis) => {
    setIsEditingDimension(null);
    const value = editableDimensions[axis]; // Get the current value from state

    if (!isNaN(parseFloat(value)) && parseFloat(value) > 0) {
      const newValue = parseFloat(value);
      const ratio = newValue / originalDimensions[axis];
      const newX = originalDimensions.x * ratio;
      const newY = originalDimensions.y * ratio;
      const newZ = originalDimensions.z * ratio;

      if (newX > MAX_DIMENSION_CM || newY > MAX_DIMENSION_CM || newZ > MAX_DIMENSION_CM) {
        // If still invalid on blur, keep the error and the current invalid value
        setError(`Maximale Dimension überschritten (${MAX_DIMENSION_CM} cm).`);
        return;
      }

      setEditableDimensions({
        x: parseFloat(newX.toFixed(2)),
        y: parseFloat(newY.toFixed(2)),
        z: parseFloat(newZ.toFixed(2)),
      });
      setScale(parseFloat(ratio.toFixed(2)));
      setError(null);
    } else {
      // If the value is invalid or empty on blur, revert to the last valid scaled dimensions
      // This prevents leaving an invalid number in the input field
      updateEditableDimensions(scale); // Revert to dimensions based on current scale
      setError('Ungültiger Wert. Muss positiv sein.');
    }
  };

  const handleNextStep = () => {
    // Perform final validation before proceeding
    if (step === 1) {
      // Re-run blur logic for scale input to ensure it's finalized
      handleScaleBlur();

      // Check all dimension inputs for validity before proceeding
      const allDimensionsValid = Object.entries(editableDimensions).every(([axis, val]) => {
        const numVal = parseFloat(val);
        const originalVal = originalDimensions[axis];

        if (isNaN(numVal) || numVal <= 0) {
            setError(`Dimension ${axis.toUpperCase()} muss eine positive Zahl sein.`);
            return false;
        }

        // Calculate potential new dimensions based on this specific axis change
        const ratio = numVal / originalVal;
        const potentialX = originalDimensions.x * ratio;
        const potentialY = originalDimensions.y * ratio;
        const potentialZ = originalDimensions.z * ratio;

        if (potentialX > MAX_DIMENSION_CM || potentialY > MAX_DIMENSION_CM || potentialZ > MAX_DIMENSION_CM) {
            setError(`Keine Dimension darf ${MAX_DIMENSION_CM} cm überschreiten.`);
            return false;
        }
        return true;
      });

      if (!allDimensionsValid) {
        return;
      }

      setStep(2);
      setError(null); // Clear error after successful validation for step 1
    } else if (step === 2) {
      if (!address || !postalCode || !city) {
        setError('Alle Felder ausfüllen.');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!paymentCode) {
        setError('Zahlungscode erforderlich.');
        return;
      }

      const purchaseData = {
        scaledDimensions: editableDimensions,
        address, postalCode, city,
        modelUrl: modelFile,
      };

      if (!modelFile) {
        setError('Modelldatei fehlt.');
        return;
      }

      fetch('http://localhost:3001/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(purchaseData),
      })
        .then(res => {
          if (res.ok) {
            onPurchase({ ...editableDimensions, address, postalCode, city });
            onClose();
          } else {
            return res.json().then(data => { throw new Error(data.error || 'Fehler beim Kauf'); });
          }
        })
        .catch(err => setError('Fehler: ' + err.message));
    }
  };

  const handleBackStep = () => {
    setStep(prevStep => Math.max(1, prevStep - 1));
    setPaymentCode('');
    setError(null);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNextStep();
    }
  };

  return (
    <div className="purchase-modal-overlay" onClick={onClose}>
      <div className="purchase-modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Modal schließen"><X size={20} /></button>

        <h2 className="modal-title">
          {step === 1 ? '✅ Kauf bestätigen' : step === 2 ? '📬 Adresse' : '💳 Zahlung'}
        </h2>

        {step === 1 && (
          <div className="modal-step">
            <div className="modal-box">
              <label><Ruler size={20} /> Originalgröße (cm):</label>
              <p>Breite: {originalDimensions.x.toFixed(2)} cm</p>
              <p>Höhe: {originalDimensions.y.toFixed(2)} cm</p>
              <p>Tiefe: {originalDimensions.z.toFixed(2)} cm</p>
            </div>

            <div className="modal-box">
              <label htmlFor="scale-input"><Ruler size={20} /> Skalierungsfaktor (max {calculateMaxScale().toFixed(2)}):</label>
              <input
                id="scale-input"
                type="number"
                min="0.01"
                step="0.01"
                // Show raw input value while typing, formatted value on blur
                value={isEditingDimension === 'scale' ? scale : (typeof scale === 'number' ? scale.toFixed(2) : '')}
                onChange={handleScaleChange}
                onKeyDown={handleInputKeyDown}
                onFocus={() => setIsEditingDimension('scale')} // Set editing mode for scale input
                onBlur={handleScaleBlur}
                ref={scaleInputRef}
              />
            </div>

            <div className="modal-box">
              <label><Ruler size={20} /> Gewünschte Größe (cm):</label>
              {['x', 'y', 'z'].map((axis) => (
                <div key={axis} className="dimension-row">
                  <span>{axis.toUpperCase()}:</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    // Show raw input value while typing, formatted value on blur
                    value={isEditingDimension === axis
                      ? editableDimensions[axis]
                      : (typeof editableDimensions[axis] === 'number' ? editableDimensions[axis].toFixed(2) : '')}
                    onChange={(e) => handleDimensionChangeWithRatio(axis, e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    onFocus={() => setIsEditingDimension(axis)}
                    onBlur={() => handleDimensionBlur(axis)}
                  />
                  <span>cm</span>
                </div>
              ))}
              <p className="dim-note">(Max: {MAX_DIMENSION_CM} cm)</p>
            </div>

            {error && <p className="error-msg">{error}</p>}
            <button className="btn-next" onClick={handleNextStep}>Weiter <ArrowRight size={18} /></button>
          </div>
        )}

        {step === 2 && (
          <div className="modal-step">
            <p>Lieferadresse eingeben:</p>
            <div className="input-with-icon">
              <MapPin size={18} />
              <input
                placeholder="Adresse"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onKeyDown={handleInputKeyDown}
                ref={addressInputRef}
              />
            </div>
            <div className="input-with-icon">
              <MapPin size={18} />
              <input
                placeholder="PLZ"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                onKeyDown={handleInputKeyDown}
                ref={postalCodeInputRef}
              />
            </div>
            <div className="input-with-icon">
              <MapPin size={18} />
              <input
                placeholder="Ort"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onKeyDown={handleInputKeyDown}
                ref={cityInputRef}
              />
            </div>
            {error && <p className="error-msg">{error}</p>}
            <div className="step-buttons">
              <button onClick={handleBackStep}><ArrowLeft size={18} /> Zurück</button>
              <button onClick={handleNextStep}>Weiter <ArrowRight size={18} /></button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="modal-step">
            <p>Zahlungscode eingeben (z. B. "123456")</p>
            <div className="input-with-icon">
              <CreditCard size={18} />
              <input
                placeholder="Zahlungscode"
                value={paymentCode}
                onChange={(e) => setPaymentCode(e.target.value)}
                onKeyDown={handleInputKeyDown}
                ref={paymentCodeInputRef}
              />
            </div>
            {error && <p className="error-msg">{error}</p>}
            <div className="step-buttons">
              <button onClick={handleBackStep}><ArrowLeft size={18} /> Zurück</button>
              <button onClick={handleNextStep}>Kauf abschließen <CheckCircle size={18} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}