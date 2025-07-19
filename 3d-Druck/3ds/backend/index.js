const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process'); // This is crucial for running Python scripts

const app = express();
const PORT = 3001;

// --- Verzeichnis-Setup ---
// Upload-Verzeichnis für alle hochgeladenen und generierten Modelle
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Ordner für abgeschlossene Käufe
const purchasesDir = path.join(__dirname, 'purchases');
if (!fs.existsSync(purchasesDir)) {
  fs.mkdirSync(purchasesDir, { recursive: true });
}

// --- Datenbankverbindung ---
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'SVHammer', // **WICHTIG:** In einer Produktionsumgebung niemals Passwörter hartcodieren!
  database: 'test',
});

// --- CORS-Konfiguration ---
const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174']; // Fügen Sie hier Ihre Frontend-URLs hinzu

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Nicht erlaubter Origin'), false);
    }
  },
  credentials: true, // Wichtig, um Cookies (Sessions) über Domains hinweg zu senden
}));

app.options('*', cors()); // Preflight-Anfragen für alle Routen erlauben

// --- Middleware ---
app.use(express.json()); // Ermöglicht das Parsen von JSON-Anfragen
app.use(express.urlencoded({ extended: true })); // Ermöglicht das Parsen von URL-codierten Anfragen

// Session Middleware
app.use(session({
  secret: '3d-druck-secret', // Ein starker, geheimer String für die Session-Verschlüsselung
  resave: false, // Session wird nur gespeichert, wenn sie geändert wurde
  saveUninitialized: false, // Speichert keine uninitialisierten Sessions
  cookie: {
    secure: false, // Setzen Sie dies in Produktion auf 'true' und verwenden Sie HTTPS!
    maxAge: 1000 * 60 * 60 * 24 * 7, // Session-Lebensdauer: 7 Tage
  },
}));

// --- Statischer Dateizugriff ---
// Ermöglicht den Zugriff auf hochgeladene/generierte Dateien über `/uploads/...`
app.use('/uploads', express.static(uploadDir));
// Ermöglicht den Zugriff auf gekaufte Dateien über `/purchases/...`
app.use('/purchases', express.static(path.join(__dirname, 'purchases')));

// --- Multer Setup für Datei-Uploads ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname), // Eindeutiger Dateiname
});
const upload = multer({ storage });

// --- Routen ---

// Registrierung eines neuen Benutzers
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Benutzername und Passwort erforderlich' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM accounts WHERE USERNAME = ?', [username]);
    if (rows.length > 0) {
      return res.status(400).json({ error: 'Benutzer existiert bereits' });
    }

    const hash = await bcrypt.hash(password, 10); // Passwort hashen
    await db.query('INSERT INTO accounts (USERNAME, PASSWORD) VALUES (?, ?)', [username, hash]);

    req.session.user = { username }; // Benutzer in Session speichern
    res.json({ success: true, username });
  } catch (err) {
    console.error('Fehler bei der Registrierung:', err);
    res.status(500).json({ error: 'Serverfehler bei Registrierung' });
  }
});

// Benutzer-Login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Benutzername und Passwort erforderlich' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM accounts WHERE USERNAME = ?', [username]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Benutzer nicht gefunden' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.PASSWORD); // Passwort vergleichen
    if (!valid) {
      return res.status(401).json({ error: 'Falsches Passwort' });
    }

    req.session.user = { username: user.USERNAME }; // Benutzer in Session speichern
    res.json({ success: true, username: user.USERNAME });
  } catch (err) {
    console.error('Fehler beim Login:', err);
    res.status(500).json({ error: 'Serverfehler bei Login' });
  }
});

// Benutzer-Logout
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout fehlgeschlagen:', err);
      return res.status(500).json({ error: 'Logout fehlgeschlagen' });
    }
    res.clearCookie('connect.sid'); // Session-Cookie löschen
    res.json({ success: true });
  });
});

// Datei-Upload von Frontend
app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Nicht eingeloggt' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'Keine Datei hochgeladen' });
  }

  const username = req.session.user.username;
  const filename = req.file.filename;

  try {
    // Dateiname und Benutzer in Datenbank speichern
    await db.execute('INSERT INTO uploads (USERNAME, FILENAME) VALUES (?, ?)', [username, filename]);

    const fileUrl = `http://localhost:${PORT}/uploads/${filename}`;
    res.json({ success: true, url: fileUrl });
  } catch (err) {
    console.error('Fehler beim Speichern des Uploads in die DB:', err);
    // Wenn Datenbankfehler auftritt, versuchen, die hochgeladene Datei zu löschen
    fs.unlink(req.file.path, (unlinkErr) => {
      if (unlinkErr) console.error(`Fehler beim Löschen der hochgeladenen Datei: ${unlinkErr}`);
    });
    res.status(500).json({ error: 'Upload gespeichert, aber Datenbankfehler' });
  }
});

// Dateien des eingeloggten Nutzers abrufen (für die Bibliothek)
app.get('/my-uploads', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Nicht eingeloggt' });
  }

  const username = req.session.user.username;

  try {
    const [rows] = await db.query(
      'SELECT FILENAME, CREATED_AT FROM uploads WHERE USERNAME = ? ORDER BY CREATED_AT DESC',
      [username]
    );

    const files = rows.map(row => ({
      filename: row.FILENAME,
      url: `http://localhost:${PORT}/uploads/${row.FILENAME}`,
      uploadedAt: row.CREATED_AT,
    }));

    res.json({ success: true, files });
  } catch (err) {
    console.error('Fehler beim Abrufen der Uploads:', err);
    res.status(500).json({ error: 'Serverfehler beim Abrufen der Dateien' });
  }
});

// Prüfen, ob Nutzer noch eingeloggt ist
app.get('/me', (req, res) => {
  if (req.session.user) {
    res.json({ loggedIn: true, username: req.session.user.username });
  } else {
    res.json({ loggedIn: false });
  }
});

// Kauf abschließen
app.post('/purchase', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Nicht eingeloggt' });
  }

  try {
    const { scaledDimensions, address, postalCode, city, modelUrl, quantity = 1 } = req.body;

    // Erweiterte Validierung
    const missingFields = [];
    if (!scaledDimensions) missingFields.push('scaledDimensions');
    if (!address) missingFields.push('address');
    if (!postalCode) missingFields.push('postalCode');
    if (!city) missingFields.push('city');
    if (!modelUrl) missingFields.push('modelUrl');

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Fehlende Daten',
        missingFields
      });
    }

    const username = req.session.user.username;

    // Dateiname aus der URL extrahieren (z.B. "http://localhost:3001/uploads/12345-model.obj" -> "12345-model.obj")
    const filename = path.basename(modelUrl);
    const sourceFilePath = path.join(uploadDir, filename);

    // Überprüfen, ob die Quelldatei existiert
    if (!fs.existsSync(sourceFilePath)) {
      return res.status(404).json({ error: 'Modell-Datei nicht im Uploads-Ordner gefunden.' });
    }

    // Erstelle benutzerspezifischen Kauf-Ordner
    const userPurchaseDir = path.join(purchasesDir, username);
    if (!fs.existsSync(userPurchaseDir)) {
      fs.mkdirSync(userPurchaseDir, { recursive: true });
    }

    // Erstelle einen eindeutigen Ordner für jede Bestellung (empfohlen für Übersichtlichkeit)
    const orderTimestamp = Date.now();
    const orderDir = path.join(userPurchaseDir, `order_${orderTimestamp}`);
    fs.mkdirSync(orderDir);

    const destinationFilePath = path.join(orderDir, filename);

    // Kopiere die Modelldatei in den Kauf-Ordner des Benutzers
    fs.copyFileSync(sourceFilePath, destinationFilePath);

    // Erstelle den Inhalt für die Textdatei mit Bestelldetails
    const purchaseDetails = `
Bestelldatum: ${new Date().toLocaleString()}
Username: ${username}
Modelldatei: ${filename}
Skalierte Dimensionen (cm):
  Breite: ${scaledDimensions.x.toFixed(2)}
  Höhe: ${scaledDimensions.y.toFixed(2)}
  Tiefe: ${scaledDimensions.z.toFixed(2)}
Lieferadresse:
  Adresse: ${address}
  Postleitzahl: ${postalCode}
  Ort: ${city}
`;

    // Schreibe die Details in eine Textdatei im Kauf-Ordner
    const detailsFileName = `order_${orderTimestamp}_details.txt`;
    const detailsFilePath = path.join(orderDir, detailsFileName);
    fs.writeFileSync(detailsFilePath, purchaseDetails);

    // Kauf in Datenbank speichern
    await db.execute(
      `INSERT INTO purchases
       (USERNAME, FILENAME, QUANTITY, ADDRESS, POSTAL_CODE, CITY, SCALED_DIMENSIONS)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [username, filename, quantity, address, postalCode, city, JSON.stringify(scaledDimensions)]
    );

    res.json({
      success: true,
      message: `Kauf von ${filename} erfolgreich abgeschlossen und in ${orderDir} gespeichert.`
    });

  } catch (err) {
    console.error('Serverfehler bei Kauf:', err);
    res.status(500).json({ error: 'Interner Serverfehler beim Kaufprozess' });
  }
});

// --- NEU: Endpoint für Text zu 3D-Konvertierung (AI-Generierung) ---
app.post('/generate-3d-model', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Nicht eingeloggt' });
  }

  const { textPrompt } = req.body;
  if (!textPrompt) {
    return res.status(400).json({ error: 'Text-Prompt erforderlich' });
  }

  const username = req.session.user.username;
  let generatedFilename = '';

  try {
    // Pfad zum Python-Skript (muss im gleichen Verzeichnis wie server.js sein)
    const pythonScriptPath = path.join(__dirname, 'generate_3d_model.py');
    // Der Befehl zum Ausführen des Python-Skripts mit dem Prompt als Argument
    const command = `python "${pythonScriptPath}" "${textPrompt}"`;

    console.log(`Executing 3D generation command: ${command}`);

    // Führen Sie das Python-Skript aus
    exec(command, { encoding: 'utf-8', maxBuffer: 1024 * 1024 * 10 }, async (error, stdout, stderr) => { // Erhöht maxBuffer
      if (error) {
        console.error(`exec error (3D generation): ${error}`);
        console.error(`stderr (3D generation): ${stderr}`); // Loggt Python-Fehler
        return res.status(500).json({ error: 'Fehler bei der 3D-Modellgenerierung', details: stderr });
      }

      console.log(`stdout (3D generation): ${stdout}`);
      console.log(`stderr (3D generation): ${stderr}`);

      // Filenamen aus der Ausgabe des Python-Skripts extrahieren
      const filenameMatch = stdout.match(/Generated_Filename: (\S+\.obj)/);
      if (filenameMatch && filenameMatch[1]) {
        generatedFilename = filenameMatch[1];
      } else {
        console.error("Konnte 'Generated_Filename:' nicht in Python-Skript-Ausgabe finden.");
        return res.status(500).json({ error: 'Generierter Dateiname nicht in Skriptausgabe gefunden. Überprüfen Sie das Python-Skript und seine Ausgabe.' });
      }

      // Speichern Sie die Informationen zum generierten Modell in der Datenbank
      try {
        await db.execute('INSERT INTO uploads (USERNAME, FILENAME) VALUES (?, ?)', [username, generatedFilename]);
        const fileUrl = `http://localhost:${PORT}/uploads/${generatedFilename}`;
        res.json({ success: true, url: fileUrl, filename: generatedFilename });
      } catch (dbError) {
        console.error('Fehler beim Speichern des generierten Modells in die DB:', dbError);
        // Wenn Datenbank-Speicherung fehlschlägt, versuchen Sie, die generierte Datei zu löschen
        const filePath = path.join(uploadDir, generatedFilename);
        if (fs.existsSync(filePath)) {
          fs.unlink(filePath, (unlinkErr) => {
            if (unlinkErr) console.error(`Fehler beim Löschen der generierten Datei: ${unlinkErr}`);
          });
        }
        return res.status(500).json({ error: 'Fehler beim Speichern des generierten Modells in die Datenbank.' });
      }
    });
  } catch (err) {
    console.error('Serverfehler bei der 3D-Modellgenerierung:', err);
    res.status(500).json({ error: 'Serverfehler bei der 3D-Modellgenerierung' });
  }
});


// --- Cleanup alter Uploads ---
const DELETE_INTERVAL_MS = 60 * 60 * 1000; // Alle 1 Stunde

setInterval(async () => {
  try {
    const [oldFiles] = await db.query(`
      SELECT FILENAME FROM uploads
      WHERE CREATED_AT < (NOW() - INTERVAL 24 HOUR)
    `);

    for (const file of oldFiles) {
      const filePath = path.join(uploadDir, file.FILENAME);
      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (unlinkErr) => { // fs.unlink ist asynchron, ohne callback ist es fire-and-forget
          if (unlinkErr) console.error(`❌ Fehler beim Löschen der Datei ${file.FILENAME}: ${unlinkErr}`);
          else console.log(`🗑️ Datei gelöscht: ${file.FILENAME}`);
        });
      }
    }

    await db.query(`
      DELETE FROM uploads
      WHERE CREATED_AT < (NOW() - INTERVAL 24 HOUR)
    `);
  } catch (err) {
    console.error('❌ Fehler beim Löschen alter Uploads:', err);
  }
}, DELETE_INTERVAL_MS);


// --- Server starten ---
app.listen(PORT, () => console.log(`✅ Backend läuft auf http://localhost:${PORT}`));