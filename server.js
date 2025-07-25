const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

const { initSocket } = require("./websocket/socket");
const gameRoute = require("./routes/game.routes");
// const path = require('path');
const { runGameLoop } = require("./services/gameManager.service");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = initSocket(server);

// Middleware
// app.use(express.static(path.join(__dirname, 'public')));
const corsOptions = {
  origin: "https://crypto-crash.netlify.app",
  credentials: true
};

app.use(cors(corsOptions));
// app.options("*", cors(corsOptions)); 
app.use(express.json());
app.use("/api/v1", gameRoute);

// Basic route
app.get("/", (req, res) => {
  res.send("Hi from crashgame api");
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    runGameLoop();
  })
  .catch((err) => console.error("Mongo error:", err));

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
