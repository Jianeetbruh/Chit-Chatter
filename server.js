app.use(express.static(path.join(__dirname, 'public')));
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // serve public folder

const USERS_FILE = './users.json';

function readUsers() {
    if (!fs.existsSync(USERS_FILE)) return [];
    return JSON.parse(fs.readFileSync(USERS_FILE));
}

function writeUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// --- Routes ---

app.post('/register', (req, res) => {
    const { username, password } = req.body;
    let users = readUsers();
    if (users.find(u => u.username === username)) return res.json({ success: false, message: 'Username exists' });
    users.push({ username, password, friends: [], friendRequests: [], groups: [] });
    writeUsers(users);
    res.json({ success: true });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const users = readUsers();
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) return res.json({ success: false, message: 'Invalid credentials' });
    res.json({ success: true, user });
});

app.post('/friend-request', (req, res) => {
    const { from, to } = req.body;
    let users = readUsers();
    const receiver = users.find(u => u.username === to);
    if (!receiver) return res.json({ success: false, message: 'User not found' });
    if (!receiver.friendRequests.includes(from)) receiver.friendRequests.push(from);
    writeUsers(users);
    res.json({ success: true });
});

app.post('/accept-friend', (req, res) => {
    const { from, to } = req.body;
    let users = readUsers();
    const user = users.find(u => u.username === to);
    const sender = users.find(u => u.username === from);
    if (!user || !sender) return res.json({ success: false });
    if (!user.friends.includes(from)) user.friends.push(from);
    if (!sender.friends.includes(to)) sender.friends.push(to);
    user.friendRequests = user.friendRequests.filter(u => u !== from);
    writeUsers(users);
    res.json({ success: true });
});

app.post('/create-group', (req, res) => {
    const { groupName, members, creator } = req.body;
    let users = readUsers();
    members.forEach(member => {
        const u = users.find(us => us.username === member);
        if (u && !u.groups.includes(groupName)) u.groups.push(groupName);
    });
    const creatorUser = users.find(u => u.username === creator);
    if (creatorUser && !creatorUser.groups.includes(groupName)) creatorUser.groups.push(groupName);
    writeUsers(users);
    res.json({ success: true });
});

// --- Socket.IO ---
let onlineUsers = {}; // username -> socket.id

io.on('connection', (socket) => {
    console.log('A user connected');

    // Track online users
    socket.on('join', username => {
        onlineUsers[username] = socket.id;
    });

    // Private message
    socket.on('private-message', ({ from, to, message }) => {
        const targetSocket = onlineUsers[to];
        if (targetSocket) io.to(targetSocket).emit('private-message', { from, message });
    });

    // Group message
    socket.on('group-message', ({ from, group, message, members }) => {
        members.forEach(member => {
            const targetSocket = onlineUsers[member];
            if (targetSocket) io.to(targetSocket).emit('group-message', { from, group, message });
        });
    });

    // Real-time friend request
    socket.on('send-friend-request', ({ from, to }) => {
        const users = readUsers();
        const receiver = users.find(u => u.username === to);
        if (receiver && !receiver.friendRequests.includes(from)) {
            receiver.friendRequests.push(from);
            writeUsers(users);

            // Send real-time update if receiver is online
            const targetSocket = onlineUsers[to];
            if (targetSocket) io.to(targetSocket).emit('new-friend-request', from);
        }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        for (let user in onlineUsers) {
            if (onlineUsers[user] === socket.id) delete onlineUsers[user];
        }
        console.log('A user disconnected');
    });
});

// --- Start server ---
const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
