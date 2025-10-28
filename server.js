// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// ✅ Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Temporary in-memory users (replace with DB later)
let users = [];

// 📄 Serve main page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// 🧾 Register endpoint
app.post("/register", (req, res) => {
  const { username, password } = req.body;
  const userExists = users.find((u) => u.username === username);

  if (userExists) {
    return res.status(400).json({ error: "Username already exists" });
  }

  users.push({ username, password });
  console.log("User registered:", username);
  res.json({ message: "Registration successful!" });
});

// 🔐 Login endpoint
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) {
    return res.status(400).json({ error: "Invalid username or password" });
  }

  console.log("User logged in:", username);
  res.json({ message: "Login successful!" });
});

// 💬 Chat page route
app.get("/chat.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "chat.html"));
});

// ⚡ Socket.IO setup
io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("chat message", (msg) => {
    io.emit("chat message", msg); // Broadcast message to all
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

// 🚀 Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () =>
  console.log(`✅ Server running on port ${PORT}`)
);
