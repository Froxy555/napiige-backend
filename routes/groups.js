const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Összes felhasználó lekérése (csoportkészítéshez)
router.get('/users', protect, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select('name username email profileImage');
    
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Hiba a felhasználók lekérésekor',
      error: error.message 
    });
  }
});

// Csoport létrehozása
router.post('/', protect, upload.single('groupImage'), async (req, res) => {
  try {
    const { name, description } = req.body;
    const memberIds = req.body.memberIds ? JSON.parse(req.body.memberIds) : [];

    if (!name || !memberIds || memberIds.length < 1) {
      return res.status(400).json({ 
        success: false, 
        message: 'Csoportnév és legalább 1 tag megadása kötelező' 
      });
    }

    // Létrehozó automatikusan tag lesz
    const allMembers = [req.user._id, ...memberIds];
    const uniqueMembers = [...new Set(allMembers.map(id => id.toString()))];

    const groupImage = req.file ? `/uploads/groups/${req.file.filename}` : '';

    const group = await Group.create({
      name,
      description: description || '',
      groupImage,
      creator: req.user._id,
      members: uniqueMembers
    });

    const populatedGroup = await Group.findById(group._id)
      .populate('creator', 'name username profileImage')
      .populate('members', 'name username profileImage');

    res.status(201).json({ 
      success: true, 
      group: populatedGroup 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Hiba a csoport létrehozásakor',
      error: error.message 
    });
  }
});

// Felhasználó csoportjainak lekérése
router.get('/', protect, async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user._id })
      .populate('creator', 'name username profileImage')
      .populate('members', 'name username profileImage')
      .sort({ updatedAt: -1 });

    res.json({ success: true, groups });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Hiba a csoportok lekérésekor',
      error: error.message 
    });
  }
});

// Egy csoport adatainak lekérése
router.get('/:id', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('creator', 'name username profileImage')
      .populate('members', 'name username profileImage');

    if (!group) {
      return res.status(404).json({ 
        success: false, 
        message: 'Csoport nem található' 
      });
    }

    // Ellenőrizzük, hogy a felhasználó tagja-e a csoportnak
    const isMember = group.members.some(
      member => member._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ 
        success: false, 
        message: 'Nincs jogosultságod megtekinteni ezt a csoportot' 
      });
    }

    res.json({ success: true, group });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Hiba a csoport lekérésekor',
      error: error.message 
    });
  }
});

// Tag hozzáadása csoporthoz
router.post('/:id/members', protect, async (req, res) => {
  try {
    const { userId } = req.body;
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ 
        success: false, 
        message: 'Csoport nem található' 
      });
    }

    // Csak a létrehozó adhat hozzá tagot
    if (group.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Csak a csoport létrehozója adhat hozzá új tagokat' 
      });
    }

    // Ellenőrizzük, hogy már tag-e
    if (group.members.includes(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Ez a felhasználó már tagja a csoportnak' 
      });
    }

    group.members.push(userId);
    await group.save();

    const updatedGroup = await Group.findById(group._id)
      .populate('creator', 'name username profileImage')
      .populate('members', 'name username profileImage');

    res.json({ success: true, group: updatedGroup });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Hiba a tag hozzáadásakor',
      error: error.message 
    });
  }
});

// Tag eltávolítása csoportból
router.delete('/:id/members/:userId', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ 
        success: false, 
        message: 'Csoport nem található' 
      });
    }

    // Csak a létrehozó távolíthat el tagot
    if (group.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Csak a csoport létrehozója távolíthat el tagokat' 
      });
    }

    // Létrehozót nem lehet eltávolítani
    if (req.params.userId === group.creator.toString()) {
      return res.status(400).json({ 
        success: false, 
        message: 'A csoport létrehozóját nem lehet eltávolítani' 
      });
    }

    group.members = group.members.filter(
      memberId => memberId.toString() !== req.params.userId
    );
    await group.save();

    const updatedGroup = await Group.findById(group._id)
      .populate('creator', 'name username profileImage')
      .populate('members', 'name username profileImage');

    res.json({ success: true, group: updatedGroup });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Hiba a tag eltávolításakor',
      error: error.message 
    });
  }
});

// Csoport adatainak frissítése (kép és leírás)
router.put('/:id', protect, upload.single('groupImage'), async (req, res) => {
  try {
    const { name, description } = req.body;
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ 
        success: false, 
        message: 'Csoport nem található' 
      });
    }

    // Csak a létrehozó módosíthatja
    if (group.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Csak a csoport létrehozója módosíthatja a csoport adatait' 
      });
    }

    if (name) group.name = name;
    if (description !== undefined) group.description = description;
    if (req.file) group.groupImage = `/uploads/groups/${req.file.filename}`;

    await group.save();

    const updatedGroup = await Group.findById(group._id)
      .populate('creator', 'name username profileImage')
      .populate('members', 'name username profileImage');

    res.json({ success: true, group: updatedGroup });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Hiba a csoport frissítésekor',
      error: error.message 
    });
  }
});

// Csoport törlése
router.delete('/:id', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ 
        success: false, 
        message: 'Csoport nem található' 
      });
    }

    // Csak a létrehozó törölheti a csoportot
    if (group.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Csak a csoport létrehozója törölheti a csoportot' 
      });
    }

    await Group.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Csoport törölve' });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Hiba a csoport törlésekor',
      error: error.message 
    });
  }
});

module.exports = router;
