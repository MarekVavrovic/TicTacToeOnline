const path = require("path");
const http = require("http");
const express = require("express");
const socketIO = require("socket.io");
const formatChatMsg = require("./public/utils/messages");
const {
  userJoinChat,
  getCurrentUser,
  userLeftChat,
  getRoomUsers,
  assignPlayerSymbol,
} = require("./public/utils/users");
const socketInstance = require("./public/utils/socketInstance");

//initialize variables
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Set up the socketInstance with the io object for assignPlayerSymbol
socketInstance.initialize(io);

//set static folder to access front-end
app.use(express.static(path.join(__dirname, "public")));
const chatBot = "ChatBot ";

//SocketIO Run when client connects
io.on("connection", (socket) => {
  console.log(`New connection...${socket.id}`);

  socket.on(`joinRoom`, ({ username, room }) => {
    const roomUsers = getRoomUsers(room);

    if (roomUsers.length < 2) {
      const user = userJoinChat(socket.id, username, room);
      socket.join(user.room);

      // Send to game.js
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });

      //Send to chatClient.js
      socket.emit("message", formatChatMsg(chatBot, `Welcome to the game.`));
      socket.broadcast
        .to(user.room)
        .emit(
          "message",
          formatChatMsg(chatBot, ` ${user.username} has joined the game`)
        );

      socket.on("chatMessage", (inputMsg) => {
        const user = getCurrentUser(socket.id);
        if (user && user.room) {
          io.to(user.room).emit(
            "message",
            formatChatMsg(user.username, inputMsg)
          );
        }
      });

      // Send to chatClient.js
      socket.emit("roomJoined", room);

      //GAME LOGIC START
      //handling win & board size is changed
      socket.on("boardSettingsChanged", ({ boardSize, boardWin }) => {
        const user = getCurrentUser(socket.id);
        if (user && user.room) {
          // Broadcast the new settings to all clients in the room
          io.to(user.room).emit("boardSettingsUpdated", {
            newBoardSize: boardSize,
            newBoardWin: boardWin,
          });
        }
      });

      //broadcast the move to all clients in the room and then toggle the turn.
      socket.on("playerMove", ({ row, col, player }) => {
        //  to all clients 
        io.to(user.room).emit("moveMade", { row, col, player });

        // Determine and emit whose turn it is next
        const nextPlayer = player === "X" ? "O" : "X";
        io.to(user.room).emit("turn", nextPlayer);
        
      });

      if (roomUsers.length === 1) {
        // If two players are in the room, start the game
        assignPlayerSymbol(user.room, user.id); // Assign the player symbol
        io.to(user.room).emit("turn", "X"); // Start with "X"
      }

      socket.on("resetScore", () => {
        const user = getCurrentUser(socket.id);
        if (user) {
          // Emit resetScore event to all clients in the same room
          io.to(user.room).emit("resetScore");
        }
      });

      socket.on("resetGame", () => {
        const user = getCurrentUser(socket.id);
        if (user) {
          socket.broadcast.to(user.room).emit("gameReset");
        }
      });
    } else {
      //send msg to entryForm.js
      socket.emit("roomFull", `Room is full. Please try another room.`);
    }
  });

  //GAME LOGIC END
  //When a user disconnect
  socket.on("disconnect", () => {
    const user = userLeftChat(socket.id);
    if (user) {
      io.to(user.room).emit(
        "message",
        formatChatMsg(chatBot, `${user.username} has left the game`)
      );

      // Leave room button
      io.to(user.room).emit("resetGame");

      //user and room info on disconnect
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server on port ${PORT}`));
