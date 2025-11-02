const ADMIN_EMAIL = 'hevesitamas7@gmail.com';

const approvalMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Nem vagy bejelentkezve' });
  }

  // Admin always has access
  if (req.user.email === ADMIN_EMAIL) {
    return next();
  }

  // Check if user is approved
  if (!req.user.isApproved) {
    return res.status(403).json({ 
      message: 'A fiókod még nincs jóváhagyva. Kérlek várj az adminiszrátor jóváhagyására.',
      pending: true 
    });
  }

  next();
};

module.exports = approvalMiddleware;
