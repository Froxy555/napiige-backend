const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const upload = require('../config/multer');

// JWT token generálás
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @route   POST /api/auth/register
// @desc    Új felhasználó regisztrálása
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    // Ellenőrzés: minden mező ki van-e töltve
    if (!name || !username || !email || !password) {
      return res.status(400).json({ message: 'Kérlek töltsd ki az összes mezőt' });
    }

    // Ellenőrzés: létezik-e már a felhasználónév
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(400).json({ message: 'Ez a felhasználónév már foglalt' });
    }

    // Ellenőrzés: létezik-e már az email
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ message: 'Ez az email cím már regisztrálva van' });
    }

    // Jelszó hossz ellenőrzés
    if (password.length < 6) {
      return res.status(400).json({ message: 'A jelszónak legalább 6 karakter hosszúnak kell lennie' });
    }

    // Admin email check - auto-approve admin
    const isAdmin = email.toLowerCase() === 'hevesitamas7@gmail.com';

    // Új felhasználó létrehozása
    const user = await User.create({
      name,
      username,
      email,
      password,
      isApproved: isAdmin,
      approvedAt: isAdmin ? new Date() : null
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        isApproved: user.isApproved,
        token: generateToken(user._id),
        message: isAdmin ? 'Sikeres regisztráció!' : 'Regisztráció sikeres! Várj az adminisztrátor jóváhagyására.'
      });
    } else {
      res.status(400).json({ message: 'Érvénytelen felhasználói adatok' });
    }
  } catch (error) {
    console.error('Regisztrációs hiba:', error);
    res.status(500).json({ message: 'Szerver hiba történt a regisztráció során' });
  }
});

// @route   POST /api/auth/login
// @desc    Felhasználó bejelentkezés
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;

    // Ellenőrzés: minden mező ki van-e töltve
    if (!usernameOrEmail || !password) {
      return res.status(400).json({ message: 'Kérlek add meg a bejelentkezési adatokat' });
    }

    // Felhasználó keresése username VAGY email alapján
    const user = await User.findOne({
      $or: [
        { username: usernameOrEmail.toLowerCase() },
        { email: usernameOrEmail.toLowerCase() }
      ]
    });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        isApproved: user.isApproved,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Hibás felhasználónév/email vagy jelszó' });
    }
  } catch (error) {
    console.error('Bejelentkezési hiba:', error);
    res.status(500).json({ message: 'Szerver hiba történt a bejelentkezés során' });
  }
});

// @route   GET /api/auth/me
// @desc    Aktuális felhasználó adatainak lekérése
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        isApproved: user.isApproved,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('Felhasználó lekérési hiba:', error);
    res.status(500).json({ success: false, message: 'Szerver hiba történt' });
  }
});

// @route   PUT /api/auth/update-profile
// @desc    Profil adatok módosítása (név, username)
// @access  Private
router.put('/update-profile', protect, async (req, res) => {
  try {
    const { name, username } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'Felhasználó nem található' });
    }

    // Ellenőrzés: username egyedi-e (ha módosult)
    if (username && username !== user.username) {
      const usernameExists = await User.findOne({ 
        username: username.toLowerCase(),
        _id: { $ne: user._id }
      });
      if (usernameExists) {
        return res.status(400).json({ message: 'Ez a felhasználónév már foglalt' });
      }
      user.username = username.toLowerCase();
    }

    if (name) {
      user.name = name;
    }

    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      profileImage: user.profileImage,
      isApproved: user.isApproved,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Profil frissítési hiba:', error);
    res.status(500).json({ message: 'Szerver hiba történt' });
  }
});

// @route   PUT /api/auth/change-password
// @desc    Jelszó módosítása
// @access  Private
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Minden mező kitöltése kötelező' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Az új jelszónak legalább 6 karakter hosszúnak kell lennie' });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'Felhasználó nem található' });
    }

    // Ellenőrzés: jelenlegi jelszó helyes-e
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'A jelenlegi jelszó helytelen' });
    }

    // Új jelszó beállítása
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Jelszó sikeresen megváltoztatva' });
  } catch (error) {
    console.error('Jelszó módosítási hiba:', error);
    res.status(500).json({ message: 'Szerver hiba történt' });
  }
});

// @route   POST /api/auth/upload-profile-image
// @desc    Profilkép feltöltése
// @access  Private
router.post('/upload-profile-image', protect, upload.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Nincs feltöltött fájl' });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'Felhasználó nem található' });
    }

    // Régi kép törlése ha van
    if (user.profileImage) {
      const oldImagePath = path.join(__dirname, '..', user.profileImage);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // Új kép útjának mentése
    user.profileImage = `/uploads/profiles/${req.file.filename}`;
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      profileImage: user.profileImage,
      isApproved: user.isApproved,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Profilkép feltöltési hiba:', error);
    res.status(500).json({ message: 'Szerver hiba történt' });
  }
});

module.exports = router;
