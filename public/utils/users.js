const socketInstance = require("./socketInstance");

// Retrieve the io instance
const io = socketInstance.getIO();

const users = [];

function userJoinChat(id, username, room) {
  // Check if the user already exists in the room
  const existingUser = users.find(
    (user) => user.id === id && user.room === room
  );

  if (existingUser) {
    // Return the existing user
    return existingUser;
  }

  // Create a new user and add them to the room
  const user = { id, username, room, symbol: "" };
  users.push(user);
  return user;
}

function getCurrentUser(id) {
  return users.find((user) => user.id === id);
}

function userLeftChat(id) {
  const index = users.findIndex((user) => user.id === id);
  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
}

function getRoomUsers(room) {
  return users.filter((user) => user.room === room);
}

function assignPlayerSymbol(room, userId) {
  const roomUsers = getRoomUsers(room);
  const existingXPlayer = roomUsers.find((user) => user.symbol === "X");

  if (!existingXPlayer) {
    // If no "X" player exists, assign "X" to the current user
    const userToUpdate = roomUsers.find((user) => user.id === userId);
    if (userToUpdate) {
      userToUpdate.symbol = "X";
    }
    // Emit the playerSymbol event to the user
    socketInstance.getIO().to(userId).emit("playerSymbol", "X");
  } else {
    // If there is already an "X" player, assign "O" to the current user
    const userToUpdate = roomUsers.find((user) => user.id === userId);
    if (userToUpdate) {
      userToUpdate.symbol = "O";
    }
    // Emit the playerSymbol event to the user
    socketInstance.getIO().to(userId).emit("playerSymbol", "O");
  }
}



module.exports = {
  userJoinChat,
  getCurrentUser,
  userLeftChat,
  getRoomUsers,
  assignPlayerSymbol,
};
