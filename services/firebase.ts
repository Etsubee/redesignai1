import * as firebaseApp from 'firebase/app';
import * as firebaseAuth from 'firebase/auth';

// Use process.env for Vite environment variables (polyfill provided in vite.config.ts)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

let app;
let auth: any;
let googleProvider: any;

try {
  // Check if critical config is present to avoid hard crash inside initializeApp
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    // @ts-ignore: suppress potential type conflict with older/mixed firebase versions
    app = firebaseApp.initializeApp(firebaseConfig);
    // @ts-ignore
    auth = firebaseAuth.getAuth(app);
    // @ts-ignore
    googleProvider = new firebaseAuth.GoogleAuthProvider();
  } else {
    console.error("Firebase Configuration is missing variables. Check .env file.");
  }
} catch (error) {
  console.error("Failed to initialize Firebase:", error);
}

export { auth, googleProvider };