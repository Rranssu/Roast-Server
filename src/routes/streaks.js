const express = require('express');
const { db } = require('../services/firebase');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

// Get streaks for user
router.get('/', verifyToken, async (req, res) => {
  const userId = req.user.uid;
  try {
    const doc = await db.collection('streaks').doc(userId).get();
    if (doc.exists) {
      res.json(doc.data());
    } else {
      res.json({ currentStreak: 0, bestStreak: 0 });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;