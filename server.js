const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve public folder
app.use(express.static(path.join(__dirname, "public")));

let users = [];

// Default page → new homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Register
app.post("/register", (req, res) => {
  const { username, password } = req.body;

  if (users.find(u => u.username === username)) {
    return res.status(400).json({ error: "Username already exists" });
  }

  users.push({ username, password });
  console.log("Registered:", username);

  res.json({ message: "Registered successfully!" });
});

// Login
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!users.find(u => u.username === username && u.password === password)) {
    return res.status(400).json({ error: "Incorrect username or password" });
  }

  console.log("Logged in:", username);

  res.json({ message: "Login successful" });
});

// Fix "Cannot GET chat.html"
app.get("/chat.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "chat.html"));
});

// Socket.io
io.on("connection", (socket) => {
  console.log("User connected");

  socket.on("chat message", (msg) => {
    io.emit("chat message", msg);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port", PORT);
});
