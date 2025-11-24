// server.js
const express = require("express");
const path = require("path");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (VERY IMPORTANT)
app.use(express.static(path.join(__dirname, "public")));

let users = []; // temporary in-memory storage

// -------------------- REGISTER --------------------
app.post("/register", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password || username.trim() === "" || password.trim() === "") {
    return res.status(400).json({ error: "Username and password cannot be empty!" });
  }

  if (users.find((u) => u.username === username)) {
    return res.status(400).json({ error: "Username already exists" });
  }

  users.push({ username, password });

  console.log("New user registered:", username);

  // Send success (frontend will redirect)
  res.json({ message: "Registered successfully!" });
});

// -------------------- LOGIN --------------------
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password || username.trim() === "" || password.trim() === "") {
    return res.status(400).json({ error: "Username and password cannot be empty!" });
  }

  const user = users.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) {
    return res.status(400).json({ error: "Incorrect username or password" });
  }

  console.log("User logged in:", username);

  // Return success (frontend will redirect)
  res.json({ message: "Login successful" });
});

// -------------------- SERVE chatting.html --------------------
app.get("/chatting.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "chatting.html"));
});

// -------------------- START SERVER --------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
