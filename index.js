const http = require("http");
const dotenv = require("dotenv");
const cors = require("cors");
const socketIO = require("socket.io");
const express = require("express");
const app = express();
const databaseConnect = require("./database/index");
const  MessageModel  = require('./models/MessagesModel');
const AuthModel = require("./models/AuthModel");




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

// array of all connected users
let connectedUsers = [];
// socket io connection code with client
io.on("connection", (socket) => {
  console.log("A user is connected");
  connectedUsers.push(socket.id);
  console.log("user list",connectedUsers);
  let userSid = socket.id;
  // sending updated list of clients to all clients use io instead of socket to send to every user
  socket.emit("socket_id", userSid);
  io.emit("connected_users", { connectedUsers });
  socket.on("message", (data) => {
    console.log(`message from ${socket.id} to ${data.recipient} : ${data.message} @date ${data.date} ${data.time}`);
    // broadcast to other clients
    try{
      //{senderNumber:"555", receiverNumber:"333", text:data.message, date:data.date, time:data.time, messageType:"text"}
      let msg = new MessageModel({senderNumber:"555", receiverNumber:"123", text:data.message, date:data.date, time:data.time, messageType:"text"})
      msg.save();
    }
    catch(error){
      console.log(error)
    }
    // sending message to all users 
    // socket.broadcast.emit('message', data);
    // for sending data specific client using socket id (data.receipent) coming from client
    io.to(data.sender).emit('message', data)
    io.to(data.recipient).emit('message', data)
  });

  // when client start typing
  socket.on("typing", (data) => {
    io.to(data.recipient).emit('typing-indicator', data);
  });
  // when client disconnects
  socket.on("disconnect", () => {
    console.log(`socket ${socket.id} disconnected`);
    connectedUsers = connectedUsers.filter((user) => user !== socket.id);
    io.emit("connected_users", { connectedUsers });
  });
});

// disconnect all the socket connections 
// connectedUsers.forEach((socket) => {
//   socket.disconnect(true); 
// });

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
