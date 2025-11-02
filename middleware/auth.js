const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Token kinyerése
      token = req.headers.authorization.split(' ')[1];

      // Token ellenőrzés
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Felhasználó hozzáadása a request-hez (jelszó nélkül)
      req.user = await User.findById(decoded.id).select('-password');

      next();
    } catch (error) {
      console.error('Token hiba:', error.message);
      res.status(401).json({ message: 'Nincs jogosultság, token hiba' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Nincs jogosultság, hiányzó token' });
  }
};

module.exports = { protect };
