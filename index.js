const express = require('express');
const http = require('http');
const socket = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socket(server, {
  cors: {
    origin: "*"
  }
});

const PORT = process.env.PORT || 5000;

const {addUser, removeUser, getUser, getUsersInRoom} = require('./user');

const route = require('./routes');
const { use } = require('./routes');

app.use(route);
app.use(cors());

// app.use('*', (req, res, next) => {
//   res.header('Access-Control-Allow-Origin', '*');
//   next();
// })

io.on('connection', (socket) => {
  console.log("Connected!");

   socket.on('join', ({name, room}, callback) => {
    // console.log(name, room);
    const {error, user} = addUser({id: socket.id, name, room});

    if(error) return callback(error);

    if(!user) return callback("Something Went Wrong");

    if(!user.name || !user.room || !socket || !socket.id) return callback("Something Went Wrong");

    socket.emit('message', {user: 'admin', text: `${user.name}, welcome to the room ${user.room}`});
    socket.broadcast.to(user.room).emit('message', {user: 'admin', text: `${user.name}, has joined`});

    socket.join(user.room);

    io.to(user.room).emit('roomData', {room: user.room, users: getUsersInRoom(user.room)})

    callback();

  })

  socket.on('sendMessage', (message, callback) => {
    const user = getUser(socket.id);

    if(!user || !socket || !user.room || !socket.id){
      callback("Something Went Wrong.")
    }

    io.to(user.room).emit('message', {user: user.name, text: message});
    io.to(user.room).emit('roomData', {room: user.room, users: getUsersInRoom(user.room)});

    callback();
  })

  socket.on('disconnect', () => {
    console.log("User has left!");

    const user = removeUser(socket.id);
    io.to(user.room).emit('roomData', {room: user.room, users: getUsersInRoom(user.room)});

    if(user){
      io.to(user.room).emit('message', {user: 'admin', text: `${user.name} has left`})
    }

  })
})

// For production side
if (process.env.NODE_ENV == "production") {
  app.use(express.static("Frontend/build"));
  const path = require("path");
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "Frontend", "build", "index.html"));
  });
}


// app.get('/', (req, res) => {
//   res.send("HELLO WORLD!")
// })

server.listen(PORT, () => console.log("Server running"));