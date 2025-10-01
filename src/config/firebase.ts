import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyARzaswLQ7IsUjZ5YZronIvpGhZ0CFwPMI",
  authDomain: "voxa-28f6c.firebaseapp.com",
  projectId: "voxa-28f6c",
  storageBucket: "voxa-28f6c.appspot.com",
  messagingSenderId: "105152390155",
  appId: "1:105152390155:android:75df63a826a90d0e04530e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };
