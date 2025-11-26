// server.js
const express = require("express");
const path = require("path");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (VERY IMPORTANT)
app.use(express.static(path.join(__dirname, "public")));

let users = []; // temporary in-memory storage

const express = require("express");
const path = require("path");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// serve static files
app.use(express.static(path.join(__dirname, "public")));

app.get("/chatting.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "chatting.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port " + PORT));


