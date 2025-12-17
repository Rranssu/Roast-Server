const admin = require('firebase-admin');
const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://roast-531d6.firebaseio.com'
});

const db = admin.firestore();
const auth = admin.auth();
module.exports = { admin, db, auth };