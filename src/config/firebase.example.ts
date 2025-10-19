import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * Firebase Configuration Template
 * 
 * SETUP INSTRUCTIONS:
 * 1. Copy this file and rename it to: firebase.ts (in the same directory)
 * 2. Go to Firebase Console: https://console.firebase.google.com/
 * 3. Select your project → Settings (gear icon) → Project settings
 * 4. Scroll down to "Your apps" → Find your web app
 * 5. Copy your Firebase config values
 * 6. Replace the placeholder values below with your actual values
 * 7. Save the firebase.ts file
 * 8. The firebase.ts file is in .gitignore, so your credentials stay safe!
 * 
 * SECURITY:
 * - firebase.ts is in .gitignore and will NOT be committed to git
 * - This template file (firebase.example.ts) CAN be committed
 * - NEVER commit your actual Firebase credentials!
 */

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",                    // e.g., "AIzaSyA1234567890abcdefghijk"
  authDomain: "YOUR_AUTH_DOMAIN",             // e.g., "meal-planner-xxxxx.firebaseapp.com"
  projectId: "YOUR_PROJECT_ID",               // e.g., "meal-planner-xxxxx"
  storageBucket: "YOUR_STORAGE_BUCKET",       // e.g., "meal-planner-xxxxx.appspot.com"
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // e.g., "123456789012"
  appId: "YOUR_APP_ID"                        // e.g., "1:123456789012:web:abcdef1234567890"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export default app;

