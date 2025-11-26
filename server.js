// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));   // VERY IMPORTANT

// ----------- ROUTES -----------

// Serve login page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// Serve register page
app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "register.html"));
});

// Serve chat page
app.get("/chatting.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "chatting.html"));
});

// ----------- SOCKET.IO -----------

let onlineUsers = {}; // email → socket.id

io.on("connection", (socket) => {
  console.log("🔵 User connected:", socket.id);

  // When user logs in and joins the socket
  socket.on("join", (email) => {
    onlineUsers[email] = socket.id;
    console.log(`🟢 ${email} joined`);
  });

  // Private messaging
  socket.on("send-message", (data) => {
    const { from, to, message } = data;

    if (onlineUsers[to]) {
      io.to(onlineUsers[to]).emit("receive-message", {
        from,
        message
      });
    }
  });

  // Friend Request
  socket.on("friend-request", ({ from, to }) => {
    if (onlineUsers[to]) {
      io.to(onlineUsers[to]).emit("friend-request", { from });
    }
  });

  // User disconnecting
  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);

    // Remove from online list
    for (let email in onlineUsers) {
      if (onlineUsers[email] === socket.id) {
        delete onlineUsers[email];
        break;
      }
    }
  });
});

// PORT for Render
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
