const express = require('express');
const { db } = require('../services/firebase');
const { verifyToken } = require('../middleware/auth');
const router = express.Router();

// --- CREATE TASK ---
router.post('/', verifyToken, async (req, res) => {
  const { name, date, intensity } = req.body; 
  const userId = req.user.uid;
  
  // 1. Validate Intensity
  const validIntensities = ['regular', 'master', 'roast'];
  const taskIntensity = validIntensities.includes(intensity) ? intensity : 'regular';
  
  // 2. Validate Date
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return res.status(400).json({ error: 'Invalid Date Format' });
  }

  try {
    const docRef = await db.collection('tasks').add({
      name,
      date: dateObj, // Firestore saves this as a Timestamp
      intensity: taskIntensity,
      userId,
      state: false
    });
    res.status(201).json({ id: docRef.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- GET TASKS (FIXED HERE) ---
router.get('/', verifyToken, async (req, res) => {
  const userId = req.user.uid;
  try {
    const snapshot = await db.collection('tasks').where('userId', '==', userId).get();
    
    const tasks = snapshot.docs.map(doc => {
      const data = doc.data();

      // FIX: Convert Firestore Timestamp to readable ISO String
      let formattedDate = data.date;
      
      // Check if it's a Firestore Timestamp (has .toDate function)
      if (data.date && typeof data.date.toDate === 'function') {
        formattedDate = data.date.toDate().toISOString();
      } 
      // Fallback: If it's already a string or a number, leave it alone
      
      return { 
        id: doc.id, 
        ...data,
        date: formattedDate // Now sends "2025-12-18T..." instead of an object
      };
    });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- FINISH TASK ---
router.put('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.uid;
  try {
    const taskRef = db.collection('tasks').doc(id);
    const taskDoc = await taskRef.get();
    
    if (!taskDoc.exists || taskDoc.data().userId !== userId) {
      return res.status(404).json({ error: 'Task not found or unauthorized' });
    }

    // Update streaks logic
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

// --- DELETE TASK ---
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