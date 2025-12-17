const express = require('express');
const { auth } = require('../services/firebase');
const { verifyToken } = require('../middleware/auth'); // For protected endpoints
const router = express.Router();

// POST /api/auth/signup - Create a new user with email/password (server-side)
router.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  try {
    const userRecord = await auth.createUser({
      email,
      password,
      emailVerified: false, // Optionally set to true if you handle verification
    });
    // Optionally, initialize streaks for the new user
    const { db } = require('../services/firebase');
    await db.collection('streaks').doc(userRecord.uid).set({ currentStreak: 0, bestStreak: 0 });

    res.status(201).json({ message: 'User created successfully', uid: userRecord.uid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/auth/user - Get current user info (protected, requires token)
router.get('/user', verifyToken, async (req, res) => {
  try {
    const userRecord = await auth.getUser(req.user.uid);
    res.json({
      uid: userRecord.uid,
      email: userRecord.email,
      emailVerified: userRecord.emailVerified,
      provider: userRecord.providerData.map(p => p.providerId), // e.g., ['password']
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/auth/user - Delete current user (protected)
router.delete('/user', verifyToken, async (req, res) => {
  try {
    await auth.deleteUser(req.user.uid);
    // Optionally, clean up Firestore data (tasks, streaks)
    const { db } = require('../services/firebase');
    await db.collection('tasks').where('userId', '==', req.user.uid).get().then(snapshot => {
      snapshot.forEach(doc => doc.ref.delete());
    });
    await db.collection('streaks').doc(req.user.uid).delete();

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/send-verification - Send email verification (requires token)
router.post('/send-verification', verifyToken, async (req, res) => {
  try {
    const userRecord = await auth.getUser(req.user.uid);
    if (!userRecord.email) {
      return res.status(400).json({ error: 'No email associated with user' });
    }
    await auth.generateEmailVerificationLink(userRecord.email); // Note: This generates a link; for full email sending, integrate with a service like SendGrid
    res.json({ message: 'Verification email sent (link generated)' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;