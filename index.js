const http = require("http");
const dotenv = require("dotenv");
const cors = require("cors");
const socketIO = require("socket.io");
const express = require("express");
const app = express();
const databaseConnect = require("./database/index");
// const {UserModel} = require('./schema/UserModel')



// setting dotenv file path
dotenv.config({
  path: "./config.env",
});

databaseConnect();

//creating http server
const server = http.createServer(app);

// creates socketIO server instance use polling for transport
// and allow cross origin request from cors
const io = socketIO(server, {
  transports: ["polling"],
  //origin * means cross-origin requests from any origin will be allowed.
  cors: {
    origin: "*", // or http://localhost:3001 or other for specific origin
  }
})

// socket io connection code with client
io.on("connection", (socket) => {
  console.log("A user is connected");

  // receive message from client
  socket.on("message", (data) => {
    console.log(`message from ${socket.id} : ${data.message} @date ${data.date} ${data.time}`);
    // broadcast to other clients
    socket.broadcast.emit('message', data);
  });

  // when client disconnects
  socket.on("disconnect", () => {
    console.log(`socket ${socket.id} disconnected`);
  });
});

// use cors
app.use(cors());

// route handling
app.use("/", (req, res) => {
  io.emit("message", `Hello, ${req.originalUrl}`);
  res.send("hello world!");
});

// getting port from env file or use 6000 if not
const port = process.env.PORT || 6000;
// server running on PORT from env file
server.listen(port, () => {
  console.log(`App running on port ${port}`);
});
