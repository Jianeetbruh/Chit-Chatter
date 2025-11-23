// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCpKNQfhu63kU-7FeyzyCFe8W8m6FpwuDI",
  authDomain: "chitchatter-a9e46.firebaseapp.com",
  projectId: "chitchatter-a9e46",
  storageBucket: "chitchatter-a9e46.firebasestorage.app",
  messagingSenderId: "628142532846",
  appId: "1:628142532846:web:da3ae09a1c33fe3d5babff"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
