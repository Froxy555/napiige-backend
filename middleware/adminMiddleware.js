const ADMIN_EMAIL = 'hevesitamas7@gmail.com';

const adminMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Nem vagy bejelentkezve' });
  }

  if (req.user.email !== ADMIN_EMAIL) {
    return res.status(403).json({ message: 'Nincs admin jogosultságod' });
  }

  next();
};

module.exports = adminMiddleware;
