import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  "projectId": "studio-9010812303-c2599",
  "appId": "1:422966058394:web:26bb54b46e4cc511112e23",
  "storageBucket": "studio-9010812303-c2599.firebasestorage.app",
  "apiKey": "AIzaSyBPh5z8mslN9JLw5zT3ZcY0bmMr3V-4QwA",
  "authDomain": "studio-9010812303-c2599.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "422966058394"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
