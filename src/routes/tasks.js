const express = require('express');
const { db } = require('../services/firebase');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

// Create a task
router.post('/', verifyToken, async (req, res) => {
  const { name, date, intensity } = req.body; // Added intensity
  const userId = req.user.uid;
  
  // Validate intensity
  const validIntensities = ['regular', 'master', 'roast'];
  const taskIntensity = validIntensities.includes(intensity) ? intensity : 'regular'; // Default to 'regular'
  
  try {
    const docRef = await db.collection('tasks').add({
      name,
      date: new Date(date),
      intensity: taskIntensity,
      userId,
      state: false
    });
    res.status(201).json({ id: docRef.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get tasks for user
router.get('/', verifyToken, async (req, res) => {
  const userId = req.user.uid;
  try {
    const snapshot = await db.collection('tasks').where('userId', '==', userId).get();
    const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); // Includes intensity
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update task (mark as finished) - Also updates streaks and deletes task
router.put('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.uid;
  try {
    const taskRef = db.collection('tasks').doc(id);
    const taskDoc = await taskRef.get();
    if (!taskDoc.exists || taskDoc.data().userId !== userId) {
      return res.status(404).json({ error: 'Task not found or unauthorized' });
    }

    // Update streaks
    const streakRef = db.collection('streaks').doc(userId);
    const streakDoc = await streakRef.get();
    let currentStreak = 0;
    let bestStreak = 0;
    if (streakDoc.exists) {
      currentStreak = streakDoc.data().currentStreak + 1;
      bestStreak = Math.max(streakDoc.data().bestStreak, currentStreak);
    } else {
      currentStreak = 1;
      bestStreak = 1;
    }
    await streakRef.set({ currentStreak, bestStreak });

    // Delete the task
    await taskRef.delete();
    res.json({ message: 'Task finished and deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete task (optional, if needed for manual deletion)
router.delete('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.uid;
  try {
    const taskRef = db.collection('tasks').doc(id);
    const taskDoc = await taskRef.get();
    if (!taskDoc.exists || taskDoc.data().userId !== userId) {
      return res.status(404).json({ error: 'Task not found or unauthorized' });
    }
    await taskRef.delete();
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;