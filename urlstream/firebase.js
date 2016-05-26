export const firebase = require("firebase");

firebase.initializeApp({
  serviceAccount: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY
  },
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

export const db = firebase.database();
export const Tweets = db.ref('tweets');
export const Urls = db.ref('urls');
export const TopImages = db.ref('top_images');
