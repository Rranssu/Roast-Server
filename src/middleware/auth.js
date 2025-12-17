const { admin } = require('../services/firebase');

const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Expect "Bearer <token>"
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken; // Attach user info (e.g., uid) to req
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = { verifyToken };