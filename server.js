const express = require("express");
const path = require("path");
const app = express();

app.use(express.json());

// VERY IMPORTANT — serve static files
app.use(express.static("public"));

let users = [];

// Register
app.post("/register", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password || username.trim() === "" || password.trim() === "") {
    return res.status(400).json({ error: "Username and password cannot be empty!" });
  }

  if (users.find(u => u.username === username)) {
    return res.status(400).json({ error: "Username already exists" });
  }

  users.push({ username, password });
  res.json({ message: "Registered successfully!" });
});

// Login
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password || username.trim() === "" || password.trim() === "") {
    return res.status(400).json({ error: "Username and password cannot be empty!" });
  }

  const user = users.find(
    u => u.username === username && u.password === password
  );

  if (!user) {
    return res.status(400).json({ error: "Incorrect username or password" });
  }

  res.json({ message: "Login successful" });
});

// SERVE chatting.html
app.get("/chatting.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "chatting.html"));
});

// Start server
app.listen(3000, () => console.log("Server running on port 3000"));
