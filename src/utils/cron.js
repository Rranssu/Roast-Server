const cron = require('node-cron');
const { db, admin } = require('../services/firebase');

cron.schedule('* * * * *', async () => { // Every minute
  try {
    const now = new Date();
    const snapshot = await db.collection('tasks')
      .where('state', '==', false)
      .where('date', '<=', now)
      .get();

    for (const doc of snapshot.docs) {
      const task = doc.data();
      // Reset streak for the user
      const streakRef = db.collection('streaks').doc(task.userId);
      await streakRef.set({ currentStreak: 0, bestStreak: (await streakRef.get()).data()?.bestStreak || 0 });

      // TODO: Trigger roasting audio (e.g., send FCM notification to app)
      // Example: admin.messaging().send({ token: userDeviceToken, notification: { title: 'Task Failed!', body: 'Time for some roasting!' } });

      // Optionally delete the failed task or keep it for history
      await doc.ref.delete();
    }
  } catch (error) {
    console.error('Cron error:', error);
  }
});