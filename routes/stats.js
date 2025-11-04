const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getUserStats, recordReading } = require('../services/activityService');
const { getUserAchievements } = require('../services/achievementService');

// @route   GET /api/stats/me
// @desc    Saját statisztikák lekérése
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const stats = await getUserStats(req.user._id);
    const achievements = await getUserAchievements(req.user._id);

    res.json({
      success: true,
      stats: {
        ...stats,
        achievements: achievements.unlocked
      },
      lockedAchievements: achievements.locked
    });
  } catch (error) {
    console.error('Stats lekérési hiba:', error);
    res.status(500).json({
      success: false,
      message: 'Hiba történt a statisztikák lekérésekor'
    });
  }
});

// @route   POST /api/stats/record-reading
// @desc    Olvasás regisztrálása
// @access  Private
router.post('/record-reading', protect, async (req, res) => {
  try {
    const { date, newTestamentRef, oldTestamentRef, newTestamentText, oldTestamentText } = req.body;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Dátum megadása kötelező'
      });
    }

    const result = await recordReading(req.user._id, date, newTestamentRef, oldTestamentRef, newTestamentText, oldTestamentText);

    res.json({
      success: true,
      alreadyRecorded: result.alreadyRecorded,
      stats: {
        currentStreak: result.activity.currentStreak,
        longestStreak: result.activity.longestStreak,
        totalReadings: result.activity.totalReadings
      },
      newAchievements: result.newAchievements
    });
  } catch (error) {
    console.error('Reading regisztrálási hiba:', error);
    res.status(500).json({
      success: false,
      message: 'Hiba történt az olvasás regisztrálásakor'
    });
  }
});

module.exports = router;
