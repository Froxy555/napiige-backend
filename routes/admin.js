const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const adminMiddleware = require('../middleware/adminMiddleware');
const { sendTestReminder } = require('../services/scheduler');

// Get all pending users
router.get('/pending-users', protect, adminMiddleware, async (req, res) => {
  try {
    const pendingUsers = await User.find({ isApproved: false })
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json(pendingUsers);
  } catch (error) {
    console.error('Error fetching pending users:', error);
    res.status(500).json({ message: 'Hiba történt a felhasználók lekérdezése során' });
  }
});

// Get all approved users
router.get('/approved-users', protect, adminMiddleware, async (req, res) => {
  try {
    const approvedUsers = await User.find({ isApproved: true })
      .select('-password')
      .populate('approvedBy', 'name email')
      .sort({ approvedAt: -1 });
    
    res.json(approvedUsers);
  } catch (error) {
    console.error('Error fetching approved users:', error);
    res.status(500).json({ message: 'Hiba történt a felhasználók lekérdezése során' });
  }
});

// Approve a user
router.post('/approve-user/:userId', protect, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Felhasználó nem található' });
    }

    if (user.isApproved) {
      return res.status(400).json({ message: 'A felhasználó már jóvá van hagyva' });
    }

    user.isApproved = true;
    user.approvedBy = req.user._id;
    user.approvedAt = new Date();
    await user.save();

    res.json({ 
      message: 'Felhasználó sikeresen jóváhagyva',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Error approving user:', error);
    res.status(500).json({ message: 'Hiba történt a jóváhagyás során' });
  }
});

// Reject/delete a user
router.delete('/reject-user/:userId', protect, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Felhasználó nem található' });
    }

    await User.findByIdAndDelete(req.params.userId);

    res.json({ message: 'Felhasználó sikeresen elutasítva és törölve' });
  } catch (error) {
    console.error('Error rejecting user:', error);
    res.status(500).json({ message: 'Hiba történt az elutasítás során' });
  }
});

// Teszt emlékeztető email küldése
router.post('/send-test-reminder/:userId', protect, adminMiddleware, async (req, res) => {
  try {
    const result = await sendTestReminder(req.params.userId);
    
    if (result.success) {
      res.json({ 
        success: true,
        message: 'Teszt emlékeztető sikeresen elküldve',
        messageId: result.messageId
      });
    } else {
      res.status(400).json({ 
        success: false,
        message: result.message || result.error
      });
    }
  } catch (error) {
    console.error('Error sending test reminder:', error);
    res.status(500).json({ 
      success: false,
      message: 'Hiba történt az email küldése során' 
    });
  }
});

module.exports = router;
