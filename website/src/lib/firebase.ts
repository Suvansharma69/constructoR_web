import { initializeApp } from 'firebase/app'
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB8scbT_eLHKdh_ZJjYCVNYf7lKgqb-3Jo",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "constructr-fc62f.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "constructr-fc62f",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "constructr-fc62f.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "735530644991",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:735530644991:web:707d1f16ad477445e8a3ca",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-NKG0V647VC",
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)

export {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
}
export type { FirebaseUser }
export default app
