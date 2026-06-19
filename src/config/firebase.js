const admin = require('firebase-admin');

/**
 * Firebase Admin SDK
 * 
 * This runs on YOUR server. It's different from Firebase client SDK on frontend.
 * 
 * Purpose:
 *  - Verify Firebase ID tokens sent by frontend
 *  - The token proves the user is authenticated with Firebase
 *  - We then trust that token and allow access to our APIs
 * 
 * Credentials come from your Firebase project's service account.
 * Download from: Firebase Console → Project Settings → Service Accounts
 */
admin.initializeApp({
  credential: admin.credential.cert({
    type: 'service_account',
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
  }),
});

module.exports = admin;