// firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC1-Hifv_Frr6yEylS22mSYfiMqqzixBmc",
  authDomain: "stan-auth.firebaseapp.com",
  projectId: "stan-auth",
  storageBucket: "stan-auth.firebasestorage.app",
  messagingSenderId: "785682953382",
  appId: "1:785682953382:web:c421f0d6c5363807edf067",
  measurementId: "G-JBYVLW1MC0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();

// Restrict sign-in to Stanford accounts
provider.setCustomParameters({
  hd: "stanford.edu"
});

export { auth, provider, signInWithPopup }; 