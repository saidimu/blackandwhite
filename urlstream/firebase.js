export const firebase = require("firebase");

firebase.initializeApp({
  serviceAccount: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY
  },
  databaseURL: process.env.FIREBASE_DATABASE_URL
});
