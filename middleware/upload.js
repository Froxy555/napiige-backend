const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Könyvtárak létrehozása, ha nem léteznek
const uploadDirs = {
  messages: path.join(__dirname, '../uploads/messages'),
  groups: path.join(__dirname, '../uploads/groups')
};

Object.values(uploadDirs).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Tárolási konfiguráció
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadType = req.baseUrl.includes('messages') ? 'messages' : 'groups';
    cb(null, uploadDirs[uploadType]);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Fájl szűrés
const fileFilter = (req, file, cb) => {
  // Engedélyezett fájltípusok
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Nem engedélyezett fájltípus!'), false);
  }
};

// Multer konfiguráció
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  }
});

module.exports = upload;
