const admin = require('firebase-admin');
const path = require('path');

// TODO: Download your Firebase service account JSON file and place it in config folder
// Get it from: Firebase Console > Project Settings > Service Accounts > Generate New Private Key

let serviceAccount;
try {
  serviceAccount = require(path.join(__dirname, 'firebase-service-account.json'));
} catch (error) {
  console.warn('Firebase service account file not found. Using environment variables.');
  // Alternative: Use environment variables
  serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  };
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
