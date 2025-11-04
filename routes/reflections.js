const express = require('express');
const router = express.Router();
const Reflection = require('../models/Reflection');
const { protect } = require('../middleware/auth');
const { recordReflection } = require('../services/activityService');

// @route   GET /api/reflections/:date
// @desc    Adott dátumhoz tartozó lelki üzenetek lekérése
// @access  Private
router.get('/:date', protect, async (req, res) => {
  try {
    const { date } = req.params;
    
    const reflections = await Reflection.find({ date })
      .sort({ createdAt: -1 })
      .select('user userName userProfileImage date message scriptureReference createdAt')
      .populate('user', 'name username');
    
    res.json({
      success: true,
      count: reflections.length,
      reflections
    });
  } catch (error) {
    console.error('Reflections lekérési hiba:', error);
    res.status(500).json({ 
      success: false,
      message: 'Hiba történt a lelki üzenetek lekérésekor' 
    });
  }
});

// @route   POST /api/reflections
// @desc    Új lelki üzenet létrehozása
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { date, message, scriptureReference } = req.body;

    // Validáció
    if (!date || !message) {
      return res.status(400).json({ 
        success: false,
        message: 'Dátum és üzenet megadása kötelező' 
      });
    }

    if (message.trim().length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Az üzenet nem lehet üres' 
      });
    }

    if (message.length > 1000) {
      return res.status(400).json({ 
        success: false,
        message: 'Az üzenet maximum 1000 karakter hosszú lehet' 
      });
    }

    // Új reflection létrehozása
    let reflection = await Reflection.create({
      user: req.user._id,
      userName: req.user.name,
      userProfileImage: req.user.profileImage || null,
      date,
      message: message.trim(),
      scriptureReference: scriptureReference || ''
    });

    // Activity tracking
    const activityResult = await recordReflection(req.user._id);

    res.status(201).json({
      success: true,
      reflection,
      newAchievements: activityResult.newAchievements
    });
  } catch (error) {
    console.error('Reflection létrehozási hiba:', error);
    res.status(500).json({ 
      success: false,
      message: 'Hiba történt a lelki üzenet mentésekor' 
    });
  }
});

// @route   PUT /api/reflections/:id
// @desc    Saját reflection módosítása
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { message } = req.body;
    const reflection = await Reflection.findById(req.params.id);

    if (!reflection) {
      return res.status(404).json({ 
        success: false,
        message: 'Nem található ez a lelki üzenet' 
      });
    }

    // Ellenőrzés: csak a saját üzenetét módosíthatja
    if (reflection.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false,
        message: 'Nincs jogosultságod módosítani ezt az üzenetet' 
      });
    }

    // Validáció
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Az üzenet nem lehet üres' 
      });
    }

    if (message.length > 1000) {
      return res.status(400).json({ 
        success: false,
        message: 'Az üzenet maximum 1000 karakter hosszú lehet' 
      });
    }

    // Módosítás
    reflection.message = message.trim();
    await reflection.save();

    res.json({
      success: true,
      reflection
    });
  } catch (error) {
    console.error('Reflection módosítási hiba:', error);
    res.status(500).json({ 
      success: false,
      message: 'Hiba történt a lelki üzenet módosításakor' 
    });
  }
});

// @route   DELETE /api/reflections/:id
// @desc    Saját reflection törlése
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const reflection = await Reflection.findById(req.params.id);

    if (!reflection) {
      return res.status(404).json({ 
        success: false,
        message: 'Nem található ez a lelki üzenet' 
      });
    }

    // Ellenőrzés: csak a saját üzenetet törölheti
    if (reflection.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false,
        message: 'Nincs jogosultságod törölni ezt az üzenetet' 
      });
    }

    await Reflection.deleteOne({ _id: req.params.id });

    res.json({
      success: true,
      message: 'Lelki üzenet sikeresen törölve'
    });
  } catch (error) {
    console.error('Reflection törlési hiba:', error);
    res.status(500).json({ 
      success: false,
      message: 'Hiba történt a lelki üzenet törlésekor' 
    });
  }
});

module.exports = router;
