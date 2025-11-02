const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Group = require('../models/Group');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const path = require('path');

// Csoport üzeneteinek lekérése
router.get('/group/:groupId', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ 
        success: false, 
        message: 'Csoport nem található' 
      });
    }

    // Ellenőrizzük, hogy a felhasználó tagja-e a csoportnak
    const isMember = group.members.some(
      memberId => memberId.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ 
        success: false, 
        message: 'Nincs jogosultságod megtekinteni ezt a csoportot' 
      });
    }

    const messages = await Message.find({ group: req.params.groupId })
      .populate('sender', 'name username profileImage')
      .populate('replyTo')
      .sort({ createdAt: 1 });

    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Hiba az üzenetek lekérésekor',
      error: error.message 
    });
  }
});

// Üzenet küldése csoportba fájlokkal
router.post('/', protect, upload.array('files', 5), async (req, res) => {
  try {
    const { groupId, content, replyTo } = req.body;

    if (!groupId || !content) {
      return res.status(400).json({ 
        success: false, 
        message: 'Csoport és üzenet megadása kötelező' 
      });
    }

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ 
        success: false, 
        message: 'Csoport nem található' 
      });
    }

    // Ellenőrizzük, hogy a felhasználó tagja-e a csoportnak
    const isMember = group.members.some(
      memberId => memberId.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ 
        success: false, 
        message: 'Nincs jogosultságod üzenetet küldeni ebbe a csoportba' 
      });
    }

    // Fájlok feldolgozása
    const attachments = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: `/uploads/messages/${file.filename}`
    })) : [];

    const message = await Message.create({
      group: groupId,
      sender: req.user._id,
      content,
      attachments,
      replyTo: replyTo || null
    });

    // Csoport frissítési idejének módosítása
    group.updatedAt = Date.now();
    await group.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name username profileImage')
      .populate('replyTo');

    res.status(201).json({ 
      success: true, 
      message: populatedMessage 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Hiba az üzenet küldésekor',
      error: error.message 
    });
  }
});

// Üzenet szerkesztése
router.put('/:id', protect, async (req, res) => {
  try {
    const { content } = req.body;
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ 
        success: false, 
        message: 'Üzenet nem található' 
      });
    }

    // Csak a feladó szerkesztheti az üzenetet
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Csak a saját üzenetedet szerkesztheted' 
      });
    }

    message.content = content;
    message.editedAt = Date.now();
    await message.save();

    const updatedMessage = await Message.findById(message._id)
      .populate('sender', 'name username profileImage')
      .populate('replyTo');

    res.json({ success: true, message: updatedMessage });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Hiba az üzenet szerkesztésekor',
      error: error.message 
    });
  }
});

// Üzenet törlése
router.delete('/:id', protect, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ 
        success: false, 
        message: 'Üzenet nem található' 
      });
    }

    // Csak a feladó törölheti az üzenetet
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Csak a saját üzenetedet törölheted' 
      });
    }

    // Fájlok törlése a fájlrendszerből
    const fs = require('fs');
    if (message.attachments && message.attachments.length > 0) {
      message.attachments.forEach(attachment => {
        const filePath = path.join(__dirname, '..', attachment.path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }

    await Message.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Üzenet törölve' });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Hiba az üzenet törlésekor',
      error: error.message 
    });
  }
});

// Üzenet olvasottnak jelölése
router.post('/:id/read', protect, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ 
        success: false, 
        message: 'Üzenet nem található' 
      });
    }

    // Ellenőrizzük, hogy a felhasználó már olvasta-e
    const alreadyRead = message.readBy.some(
      read => read.user.toString() === req.user._id.toString()
    );

    if (!alreadyRead) {
      message.readBy.push({
        user: req.user._id,
        readAt: Date.now()
      });
      await message.save();
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Hiba az olvasási visszaigazoláskor',
      error: error.message 
    });
  }
});

// Összes üzenet olvasottnak jelölése egy csoportban
router.post('/group/:groupId/read-all', protect, async (req, res) => {
  try {
    const messages = await Message.find({ 
      group: req.params.groupId,
      sender: { $ne: req.user._id }
    });

    for (const message of messages) {
      const alreadyRead = message.readBy.some(
        read => read.user.toString() === req.user._id.toString()
      );

      if (!alreadyRead) {
        message.readBy.push({
          user: req.user._id,
          readAt: Date.now()
        });
        await message.save();
      }
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Hiba az üzenetek olvasottnak jelölésekor',
      error: error.message 
    });
  }
});

module.exports = router;
