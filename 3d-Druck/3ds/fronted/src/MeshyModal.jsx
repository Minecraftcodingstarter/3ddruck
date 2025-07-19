import { useState } from "react";
import "./MeshyModal.css";

export default function MeshyModal({ onClose, onModelGenerated }) {
  const [mode, setMode] = useState("text");
  const [prompt, setPrompt] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const API_KEY = "msy_dummy_api_key_for_test_mode_12345678"; // nur Testzwecke

  const handleSubmit = async () => {
    setLoading(true);
    setStatus("Erstelle Vorschau...");

    try {
      const headers = {
        Authorization: `Bearer ${API_KEY}`,
      };

      if (mode === "text") {
        // Text to 3D API Request (wie bisher)
        const body = {
          mode: "preview",
          prompt,
          negative_prompt: "low quality, low resolution, low poly, ugly",
          art_style: "realistic",
          should_remesh: true,
        };

        const res = await fetch("https://api.meshy.ai/openapi/v2/text-to-3d", {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const data = await res.json();
        const taskId = data.result;

        let taskStatus;
        do {
          await new Promise((r) => setTimeout(r, 5000));
          const poll = await fetch(
            `https://api.meshy.ai/openapi/v2/text-to-3d/${taskId}`,
            { headers }
          );
          taskStatus = await poll.json();
          setStatus(`Fortschritt: ${taskStatus.progress}%`);
        } while (taskStatus.status !== "SUCCEEDED");

        const modelUrl = taskStatus.model_urls.glb;
        if (onModelGenerated) onModelGenerated(modelUrl);
        setStatus("✅ Modell bereit!");
      }

      if (mode === "image") {
        if (!file) {
          setStatus("❌ Bitte wähle eine Bilddatei aus.");
          setLoading(false);
          return;
        }

        // Bild-Datei zu FormData hinzufügen
        const formData = new FormData();
        formData.append("mode", "preview");
        formData.append("art_style", "realistic");
        formData.append("should_remesh", "true");
        formData.append("file", file);

        // POST Request mit FormData (kein Content-Type Header setzen, fetch macht das automatisch)
        const res = await fetch("https://api.meshy.ai/openapi/v2/image-to-3d", {
          method: "POST",
          headers,
          body: formData,
        });

        const data = await res.json();
        const taskId = data.result;

        let taskStatus;
        do {
          await new Promise((r) => setTimeout(r, 5000));
          const poll = await fetch(
            `https://api.meshy.ai/openapi/v2/image-to-3d/${taskId}`,
            { headers }
          );
          taskStatus = await poll.json();
          setStatus(`Fortschritt: ${taskStatus.progress}%`);
        } while (taskStatus.status !== "SUCCEEDED");

        const modelUrl = taskStatus.model_urls.glb;
        if (onModelGenerated) onModelGenerated(modelUrl);
        setStatus("✅ Modell bereit!");
      }
    } catch (error) {
      console.error(error);
      setStatus("❌ Fehler bei der Erstellung.");
    }

    setLoading(false);
  };

  return (
    <div className="meshy-modal">
      <button className="modal-close" onClick={onClose}>
        ✕
      </button>
      <h2 className="modal-title">Meshy 3D Generator</h2>

      <div className="mode-switch">
        <button
          className={`mode-button ${mode === "text" ? "active" : ""}`}
          onClick={() => setMode("text")}
        >
          Text to 3D
        </button>
        <button
          className={`mode-button ${mode === "image" ? "active" : ""}`}
          onClick={() => setMode("image")}
        >
          Bild to 3D
        </button>
      </div>

      {mode === "text" && (
        <textarea
          className="input-textarea"
          placeholder="Beschreibe dein 3D-Modell..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
      )}

      {mode === "image" && (
        <div className="file-upload-wrapper">
          <label className="file-upload-button" htmlFor="file-upload-input">
            Datei auswählen
          </label>
          <input
            id="file-upload-input"
            type="file"
            accept="image/*"
            className="input-file"
            onChange={(e) => setFile(e.target.files[0])}
          />
          {file && <div className="file-name-display">{file.name}</div>}
        </div>
      )}

      <button
        className={`submit-button ${loading ? "disabled" : ""}`}
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? "⏳ Lade..." : "Generieren"}
      </button>

      {status && <p className="status-text">{status}</p>}
    </div>
  );
}
