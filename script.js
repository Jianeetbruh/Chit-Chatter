// -----------------------------
// Firebase Config
// -----------------------------
const firebaseConfig = {
  apiKey: "AIzaSyCpKNQfhu63kU-7FeyzyCFe8W8m6FpwuDI",
  authDomain: "chitchatter-a9e46.firebaseapp.com",
  projectId: "chitchatter-a9e46",
  storageBucket: "chitchatter-a9e46.firebasestorage.app",
  messagingSenderId: "628142532846",
  appId: "1:628142532846:web:da3ae09a1c33fe3d5babff"
};

// -----------------------------
// Initialize Firebase (COMPAT MODE)
// -----------------------------
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

// Auto-join socket after login
let socket;

auth.onAuthStateChanged(user => {
    if (!user) return;

    socket = io();
    socket.emit("join", user.email);

    console.log("🔵 Joined socket as:", user.email);
});
