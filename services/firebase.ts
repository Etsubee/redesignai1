import * as firebaseApp from 'firebase/app';
import * as firebaseAuth from 'firebase/auth';

// User provided configuration
const firebaseConfig = {
  apiKey: "AIzaSyCoxb4OdrLz2XWshHwlFJDBg991JgGVNxg",
  authDomain: "redesignai-92b93.firebaseapp.com",
  projectId: "redesignai-92b93",
  storageBucket: "redesignai-92b93.firebasestorage.app",
  messagingSenderId: "514926421002",
  appId: "1:514926421002:web:23d8f96b177017c06a2bf3",
  measurementId: "G-954JHDKE2R"
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
    console.error("Firebase Configuration is missing variables.");
  }
} catch (error) {
  console.error("Failed to initialize Firebase:", error);
}

// Helper functions to avoid named import issues in App.tsx
export const signInWithGoogle = async () => {
  if (!auth || !googleProvider) throw new Error("Authentication service is not fully initialized.");
  // @ts-ignore
  return firebaseAuth.signInWithPopup(auth, googleProvider);
};

export const logoutUser = async () => {
  if (!auth) return;
  // @ts-ignore
  return firebaseAuth.signOut(auth);
};

export const subscribeToAuthChanges = (callback: (user: any) => void) => {
  if (!auth) return () => {};
  // @ts-ignore
  return firebaseAuth.onAuthStateChanged(auth, callback);
};

export { auth };