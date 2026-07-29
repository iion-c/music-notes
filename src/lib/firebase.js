import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBx7aEXz7_7muCIGZ86yPS6MdgWqKdnmao",
  authDomain: "matthewdelgado-61289.firebaseapp.com",
  projectId: "matthewdelgado-61289",
  storageBucket: "matthewdelgado-61289.firebasestorage.app",
  messagingSenderId: "411963375186",
  appId: "1:411963375186:web:10ad9c99a00e75be63698b"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
