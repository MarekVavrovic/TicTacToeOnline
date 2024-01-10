import socket from "./socketInit.js";
const chatForm = document.getElementById("chat-form");
const chatMessages = document.querySelector(".chat-messages");
const chatCircle = document.getElementById("chat-circle");
const chatBox = document.querySelector(".chat-box");
const roomName = document.getElementById("room");

//const socket = io();

let lastScrollHeight = chatMessages.scrollHeight;
let chatIsOpen = false;

function toggleChatBox() {
  if (chatIsOpen) {
    chatBox.style.display = "none";
    chatIsOpen = false;
  } else {
    chatBox.style.display = "block";
    chatIsOpen = true;
  }
}

chatCircle.addEventListener("click", toggleChatBox);
const chatBoxHeader = chatBox.querySelector(".chat-box-toggle");
chatBoxHeader.addEventListener("click", toggleChatBox);

// get username and room from querystring
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

socket.emit(`joinRoom`, {
  username,
  room,
  roomId: document.body.dataset.roomId,
});



socket.on("message", (message) => {
  outputMessage(message);
  if (!chatIsOpen) {
    toggleChatBox();
  }
  scrollChatToBottom();
});

socket.on("roomJoined", (receivedRoomId) => {
  document.body.dataset.roomId = receivedRoomId; // Storing the room ID
  console.log("Room ID set:", receivedRoomId); // Debugging
});

//output room and users
socket.on("roomUsers", ({ room, users }) => {
  outputRoomName(room);
});

function outputRoomName(room) {
  roomName.value = room;
  console.log(`Room:${room}`);
}

// Submitting messages in the chat bot
chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const inputMsg = event.target.elements.msg.value;

  // sending input to socketIO
  socket.emit("chatMessage", inputMsg);

  event.target.elements.msg.value = "";
  event.target.elements.msg.focus();
});

//functions

function outputMessage(inputMsg) {
  const div = document.createElement("div");
  div.classList.add("message");
  const p = document.createElement("p");
  p.classList.add("meta");
  p.innerText = inputMsg.username;
  p.innerHTML += `<span>${inputMsg.time}</span>`;
  div.appendChild(p);
  const para = document.createElement("p");
  para.innerText = inputMsg.text;
  div.appendChild(para);

  document.querySelector(".chat-messages").appendChild(div);
}

function scrollChatToBottom() {
  const newScrollHeight = chatMessages.scrollHeight;
  if (newScrollHeight > lastScrollHeight) {
    chatMessages.scrollTop = newScrollHeight;
    lastScrollHeight = newScrollHeight;
  }
}


socket.on("connect_error", (error) => {
  console.error("Socket connection error:", error);
});

socket.on("connect_timeout", (timeout) => {
  console.error("Socket connection timeout:", timeout);
});
