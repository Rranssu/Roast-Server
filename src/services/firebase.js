const admin = require('firebase-admin');

// Use the JSON string from Render's env var
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://roast-531d6.firebaseio.com' // Replace with your Firebase project ID
});

const db = admin.firestore();
const auth = admin.auth();
module.exports = { admin, db, auth };
