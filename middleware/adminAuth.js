// শুধু session এ admin=true থাকলে পরের route এ যেতে দেবে
function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}

module.exports = { requireAdmin };
