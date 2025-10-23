// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

const USERS_FILE = path.join(__dirname, "users.json");

// Make sure the user file exists
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify([]));
}

// REGISTER endpoint
app.post("/register", (req, res) => {
  const { username, password } = req.body;
  let users = JSON.parse(fs.readFileSync(USERS_FILE));

  if (users.find((u) => u.username === username)) {
    return res.send(`
      <script>alert("Username already exists! Try another."); window.location.href = "/register.html";</script>
    `);
  }

  users.push({ username, password });
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

  res.send(`
    <script>alert("Registration successful! Please log in."); window.location.href = "/login.html";</script>
  `);
});

// LOGIN endpoint
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const users = JSON.parse(fs.readFileSync(USERS_FILE));

  const user = users.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) {
    return res.send(`
      <script>alert("Invalid username or password! Try again."); window.location.href = "/login.html";</script>
    `);
  }

  // Login success → go to chat
  res.redirect(`/chat.html?user=${encodeURIComponent(username)}`);
});

// SOCKET.IO for chat
io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("chat message", (msg) => {
    io.emit("chat message", msg);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
