// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB_MGClYnzuyjFggCtyN2aINsOA4XyB-aw",
  authDomain: "document-b67d4.firebaseapp.com",
  projectId: "document-b67d4",
  storageBucket: "document-b67d4.firebasestorage.app",
  messagingSenderId: "771853163147",
  appId: "1:771853163147:web:a840929fc7b0531250528e",
  measurementId: "G-HC3WRXRT0P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);