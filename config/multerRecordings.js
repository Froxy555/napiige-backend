const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Könyvtár létrehozása, ha nem létezik
const uploadDir = 'uploads/recordings/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage konfiguráció MP3-hoz
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'recording-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter - csak MP3 és audio fájlok
const audioFilter = (req, file, cb) => {
  const allowedTypes = /mp3|mpeg|wav|m4a|ogg/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = /audio/.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Csak audio fájlok engedélyezettek (mp3, wav, m4a, ogg)'));
  }
};

// Multer konfiguráció - max 100MB
const uploadRecording = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB max
  },
  fileFilter: audioFilter
});

module.exports = uploadRecording;
