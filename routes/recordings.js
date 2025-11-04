const express = require('express');
const router = express.Router();
const Recording = require('../models/Recording');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const uploadRecording = require('../config/multerRecordings');
const { sendEmail, emailTemplates } = require('../config/email');
const path = require('path');
const fs = require('fs');

// @route   GET /api/recordings
// @desc    Összes felvétel lekérése
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const recordings = await Recording.find()
      .populate('uploadedBy', 'name username')
      .sort({ date: -1, createdAt: -1 });

    res.json({ 
      success: true, 
      recordings 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Hiba a felvételek lekérésekor',
      error: error.message 
    });
  }
});

// @route   GET /api/recordings/:id
// @desc    Egy felvétel adatainak lekérése
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const recording = await Recording.findById(req.params.id)
      .populate('uploadedBy', 'name username profileImage');

    if (!recording) {
      return res.status(404).json({ 
        success: false, 
        message: 'Felvétel nem található' 
      });
    }

    res.json({ 
      success: true, 
      recording 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Hiba a felvétel lekérésekor',
      error: error.message 
    });
  }
});

// @route   POST /api/recordings
// @desc    Új felvétel feltöltése
// @access  Private
router.post('/', protect, uploadRecording.single('audioFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nincs feltöltött fájl' 
      });
    }

    const { title, date } = req.body;

    if (!title || !date) {
      // Töröljük a feltöltött fájlt, ha hiányzik az adat
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ 
        success: false, 
        message: 'Cím és dátum megadása kötelező' 
      });
    }

    const recording = await Recording.create({
      title,
      date: new Date(date),
      filePath: `/uploads/recordings/${req.file.filename}`,
      fileSize: req.file.size,
      uploadedBy: req.user._id
    });

    const populatedRecording = await Recording.findById(recording._id)
      .populate('uploadedBy', 'name username profileImage');

    // Email értesítés küldése minden felhasználónak (kivéve a feltöltőt)
    try {
      const users = await User.find({ 
        _id: { $ne: req.user._id },
        email: { $exists: true, $ne: null }
      });

      const formattedDate = new Date(date).toLocaleDateString('hu-HU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      for (const user of users) {
        await sendEmail({
          to: user.email,
          subject: `🎙️ Új felvétel: ${title}`,
          html: emailTemplates.newRecording(
            req.user.name,
            title,
            formattedDate
          )
        });
      }
    } catch (emailError) {
      console.error('Email értesítés hiba:', emailError);
      // Ne dobjunk hibát, ha az email küldés nem sikerül
    }

    res.status(201).json({ 
      success: true, 
      recording: populatedRecording 
    });
  } catch (error) {
    // Hiba esetén töröljük a feltöltött fájlt
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ 
      success: false, 
      message: 'Hiba a felvétel feltöltésekor',
      error: error.message 
    });
  }
});

// @route   DELETE /api/recordings/:id
// @desc    Felvétel törlése
// @access  Private (csak admin vagy feltöltő)
router.delete('/:id', protect, async (req, res) => {
  try {
    const recording = await Recording.findById(req.params.id);

    if (!recording) {
      return res.status(404).json({ 
        success: false, 
        message: 'Felvétel nem található' 
      });
    }

    // Csak a feltöltő törölheti (vagy később admin)
    if (recording.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Nincs jogosultságod törölni ezt a felvételt' 
      });
    }

    // Fájl törlése
    const filePath = path.join(__dirname, '..', recording.filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Recording.findByIdAndDelete(req.params.id);

    res.json({ 
      success: true, 
      message: 'Felvétel törölve' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Hiba a felvétel törlésekor',
      error: error.message 
    });
  }
});

module.exports = router;
