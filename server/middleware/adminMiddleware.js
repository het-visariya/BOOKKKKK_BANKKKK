const adminMiddleware = (req, res, next) => {
  if (!req.user) {
    console.error('[AdminMiddleware] No req.user — authMiddleware may not have run');
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  if (req.user.role !== 'admin') {
    console.error('[AdminMiddleware] Access denied: role =', req.user.role, '| userId =', req.user.userId);
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

module.exports = adminMiddleware;
