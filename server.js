// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

// Create app and server
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middlewares
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File to store users
const USERS_FILE = path.join(__dirname, 'users.json');

// Helper functions
function readUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  const data = fs.readFileSync(USERS_FILE, 'utf-8');
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Register route
app.post('/register', (req, res) => {
  const { username, password } = req.body;
  let users = readUsers();

  if (users.find(u => u.username === username)) {
    return res.send('❌ Username already exists!');
  }

  users.push({ username, password, friends: [], friendRequests: [] });
  writeUsers(users);

  res.redirect('/login.html');
});

// Login route
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  let users = readUsers();
  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
    res.redirect('/chat.html?user=' + username);
  } else {
    res.send('❌ Invalid username or password!');
  }
});

// Keep track of online users
let onlineUsers = {}; // username -> socket.id

io.on('connection', (socket) => {
  console.log('A user connected.');

  // When a user joins
  socket.on('join', (username) => {
    onlineUsers[username] = socket.id;
    console.log(username, 'joined the chat');
  });

  // Handle chat messages
  socket.on('chat message', ({ from, to, message }) => {
    const targetSocket = onlineUsers[to];
    if (targetSocket) {
      io.to(targetSocket).emit('chat message', { from, message });
    }
  });

  // Handle friend requests
  socket.on('send-friend-request', ({ from, to }) => {
    const users = readUsers();
    const receiver = users.find(u => u.username === to);

    if (receiver && !receiver.friendRequests.includes(from)) {
      receiver.friendRequests.push(from);
      writeUsers(users);

      const targetSocket = onlineUsers[to];
      if (targetSocket) io.to(targetSocket).emit('new-friend-request', from);
    }
  });

  // Disconnect event
  socket.on('disconnect', () => {
    for (let user in onlineUsers) {
      if (onlineUsers[user] === socket.id) delete onlineUsers[user];
    }
    console.log('A user disconnected.');
  });
});

// Start server (Render uses process.env.PORT)
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
