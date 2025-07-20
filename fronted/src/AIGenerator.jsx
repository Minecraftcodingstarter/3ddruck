import { useState } from "react";
import "./AIGenerator.css"; // Renamed CSS file

/**
 * AIGenerator component for generating 3D models from text or images using Meshy API.
 * This component is designed to be embedded directly into a page, not as a modal.
 * @param {object} props - Component props.
 * @param {function} props.onModelGenerated - Callback function when a model is successfully generated,
 * receives the model URL and name.
 */
export default function AIGenerator({ onModelGenerated }) {
  const [mode, setMode] = useState("text"); // 'text' or 'image'
  const [prompt, setPrompt] = useState(""); // Text prompt for 3D generation
  const [file, setFile] = useState(null); // Image file for 3D generation
  const [loading, setLoading] = useState(false); // Loading state for API calls
  const [status, setStatus] = useState(""); // Status messages for the user

  // Dummy API Key for demonstration purposes. In a real application, this should be
  // securely managed (e.g., environment variables, backend proxy).
  const API_KEY = "msy_dummy_api_key_for_test_mode_12345678";

  /**
   * Handles the submission for 3D model generation.
   * Sends a request to the Meshy API based on the selected mode (text or image).
   */
  const handleSubmit = async () => {
    setLoading(true);
    setStatus("Erstelle Vorschau..."); // Initial status message

    try {
      const headers = {
        Authorization: `Bearer ${API_KEY}`,
      };

      let taskId;
      let modelName = "";

      if (mode === "text") {
        // Text to 3D API Request
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
        taskId = data.result;
        modelName = prompt.substring(0, 30) + (prompt.length > 30 ? '...' : ''); // Use prompt as model name
      } else if (mode === "image") {
        if (!file) {
          setStatus("❌ Bitte wähle eine Bilddatei aus.");
          setLoading(false);
          return;
        }

        // Image to 3D API Request
        const formData = new FormData();
        formData.append("mode", "preview");
        formData.append("art_style", "realistic");
        formData.append("should_remesh", "true");
        formData.append("file", file); // Append the image file

        const res = await fetch("https://api.meshy.ai/openapi/v2/image-to-3d", {
          method: "POST",
          headers, // fetch automatically sets Content-Type for FormData
          body: formData,
        });

        const data = await res.json();
        taskId = data.result;
        modelName = file.name; // Use image file name as model name
      }

      // Polling for task status
      let taskStatus;
      do {
        await new Promise((r) => setTimeout(r, 5000)); // Poll every 5 seconds
        const poll = await fetch(
          `https://api.meshy.ai/openapi/v2/${mode}-to-3d/${taskId}`,
          { headers }
        );
        taskStatus = await poll.json();
        setStatus(`Fortschritt: ${taskStatus.progress || 0}%`); // Update progress
      } while (taskStatus.status !== "SUCCEEDED" && taskStatus.status !== "FAILED");

      if (taskStatus.status === "SUCCEEDED") {
        const modelUrl = taskStatus.model_urls.glb; // Get the GLB model URL
        if (onModelGenerated) {
          onModelGenerated(modelUrl, modelName); // Pass URL and name to callback
        }
        setStatus("✅ Modell bereit!");
        setPrompt(""); // Clear prompt after successful generation
        setFile(null); // Clear file after successful generation
      } else {
        setStatus("❌ Fehler bei der Erstellung."); // Handle failed status
      }
    } catch (error) {
      console.error("Fehler bei der 3D-Modellgenerierung:", error);
      setStatus("❌ Fehler bei der Erstellung. Bitte versuchen Sie es erneut.");
    }

    setLoading(false);
  };

  return (
    <div className="ai-generator-container"> {/* Renamed class */}
      <h2 className="ai-generator-title">KI 3D-Modell Generator</h2> {/* Renamed class */}

      <div className="mode-switch">
        <button
          className={`mode-button ${mode === "text" ? "active" : ""}`}
          onClick={() => setMode("text")}
        >
          Text zu 3D
        </button>
        <button
          className={`mode-button ${mode === "image" ? "active" : ""}`}
          onClick={() => setMode("image")}
        >
          Bild zu 3D
        </button>
      </div>

      {mode === "text" && (
        <textarea
          className="input-textarea"
          placeholder="Beschreibe dein 3D-Modell (z.B. 'Ein roter Sportwagen mit großen Rädern')..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={5} // Set a default number of rows
        />
      )}

      {mode === "image" && (
        <div className="file-upload-wrapper">
          <label className="file-upload-button" htmlFor="file-upload-input-ai">
            Datei auswählen
          </label>
          <input
            id="file-upload-input-ai" // Unique ID to avoid conflict
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
        disabled={loading || (mode === "text" && !prompt) || (mode === "image" && !file)}
      >
        {loading ? "⏳ Generiere..." : "Generieren"}
      </button>

      {status && <p className="status-text">{status}</p>}
    </div>
  );
}
