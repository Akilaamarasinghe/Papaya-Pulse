import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDVJmH_gh1r3AqV_PaKPziBMFAUxvq3tAQ",
  authDomain: "papaya-pulse.firebaseapp.com",
  projectId: "papaya-pulse",
  storageBucket: "papaya-pulse.firebasestorage.app",
  messagingSenderId: "542766429012",
  appId: "1:542766429012:web:8567a068bdb96c20dd4ec1",
  measurementId: "G-9CC37BRZTT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
const auth = getAuth(app);

export { auth };
export default app;
