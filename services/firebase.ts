import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

const firebaseConfig = {
  projectId: "gen-lang-client-0662492374",
  appId: "1:1020378087200:web:8192edfd69d8e278f32145",
  apiKey: "AIzaSyCG0jzM8Pt7jqNh8z3c4kxJzq5mHDchCJg",
  authDomain: "gen-lang-client-0662492374.firebaseapp.com",
  storageBucket: "gen-lang-client-0662492374.firebasestorage.app",
  messagingSenderId: "1020378087200"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "ai-studio-copyofsalestrack-0dde2e81-565f-4dd0-90d2-7730e6e16e5e");
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logoutFirebase = () => signOut(auth);

export const testConnection = async () => {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    if(error.message && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
};
testConnection();
