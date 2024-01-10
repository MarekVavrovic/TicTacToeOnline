import socket from "./socketInit.js";

const winSound = document.getElementById("winSound");
const clickSound = document.getElementById("clickSound");
const sidebarSound = document.getElementById("sidebarSound");

const modal = document.getElementById("myModal");
const modalText = document.getElementById("modalText");
const modalTitle = document.getElementById("modal-title");
const closeModal = document.getElementById("closeModal");
const menuButton = document.getElementById("menuButton");

const boardElement = document.getElementById("board");
const boardSizeSelect = document.getElementById("boardSizeSelect");
const boardWinSelect = document.getElementById("boardWinSelect");
const clearBoard = document.getElementById("clearBoard");
// Sidebar toggle button
const toggleSidebarButton = document.getElementById("toggleSidebar");
const sidebar = document.getElementById("sidebar");
const resetScoreButton = document.getElementById("resetScoreButton");

// Player names input elements
const playerXNameInput = document.getElementById("playerXName");
const playerONameInput = document.getElementById("playerOName");

const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

// Add the roomId from the dataset to the emitted data
const roomId = document.body.dataset.roomId;

socket.emit(`joinRoom`, { username, room, roomId }); 

toggleSidebarButton.addEventListener("click", () => {
  playSound(sidebarSound);
  sidebar.classList.toggle("open");
});


// Global variables to store player names
let playerXName = 'Player X';
let playerOName = 'Player O';

// Update player names when received
socket.on("roomUsers", ({ room, users }) => {
  updatePlayerNames(users);
});

function updatePlayerNames(users) {
  if (users.length > 0) {
    playerXName = users[0].username; // Set Player X name
    playerXNameInput.value = playerXName;
    if (users.length > 1) {
      playerOName = users[1].username; // Set Player O name
      playerONameInput.value = playerOName;
    }
  } else {
    playerXNameInput.value = "Waiting for player X";
    playerONameInput.value = "Waiting for player O";
  }
}




let boardWin = parseInt(boardWinSelect.value);
let boardSize = parseInt(boardSizeSelect.value);

let currentPlayer = "X";

function makeMove(row, col, player) {
 
  const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
  if (cell && !cell.textContent) {
    cell.textContent = player;
    cell.style.color = player === "X" ? "red" : "blue";
  }
}



let board = new Array(boardSize)
  .fill(null)
  .map(() => new Array(boardSize).fill(null));

function createBoard() {
  boardElement.innerHTML = "";
  boardElement.style.gridTemplateColumns = `repeat(${boardSize}, 50px)`;

  for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.row = row;
      cell.dataset.col = col;
      cell.addEventListener("click", handleCellClick);
      boardElement.appendChild(cell);
    }
  }
}

let isMyTurn = true;
let myPlayerSymbol; //set by the server

socket.on("playerSymbol", (symbol) => {
  myPlayerSymbol = symbol;
  currentPlayer = symbol; // Set the currentPlayer based on the symbol
});

socket.on("turn", (player) => {
  isMyTurn = player === myPlayerSymbol;
  // Update UI or game state to reflect whose turn it is
});

function handleCellClick(event) {
  // Retrieve the values of roomId, row, col, and myPlayerSymbol
  console.log("handleCellClick triggered");
  const roomId = document.body.dataset.roomId; // Assuming roomId is stored in a data attribute
  const row = parseInt(event.target.dataset.row);
  const col = parseInt(event.target.dataset.col);

  console.log("roomId:", roomId);
  console.log("row:", row);
  console.log("col:", col);
  console.log("myPlayerSymbol:", myPlayerSymbol);

  if (board[row][col] === null && isMyTurn) {
    console.log(
      `Emitting playerMove in room ${roomId}:`,
      row,
      col,
      myPlayerSymbol
    );

    socket.emit("playerMove", {
      row,
      col,
      player: myPlayerSymbol
    });

    playSound(clickSound);
  }
}





socket.on("initGame", ({ mySymbol, firstTurn }) => {
  myPlayerSymbol = mySymbol;
  isMyTurn = myPlayerSymbol === firstTurn;
});

socket.on("moveMade", ({ row, col, player }) => {


  if (board[row][col] === null) {
    board[row][col] = player;
    makeMove(row, col, player);

    // Check for a win or a draw after the move
    const winCheck = checkWin(row, col);
    if (winCheck) {
     let nextPlayerName = currentPlayer === "X" ? playerOName : playerXName; // Assuming currentPlayer holds the symbol of the current player
     displayWinner(currentPlayer, nextPlayerName);
    } else if (checkDraw()) {
     displayWinner(null);
    }

    // Switch to the next player
    isMyTurn = player !== myPlayerSymbol;
  }
});


function showModal() {
  modal.style.visibility = "visible";
  modal.style.zIndex = 10;
}

function hideModal() {
  modal.style.visibility = "hidden";
}

function playSound(soundElement) {
  soundElement.currentTime = 0;
  soundElement.play();
}

//CheckWin
function checkWin(row, col) {
  const symbol = board[row][col];

  // Define direction vectors for checking different directions
  const directions = [
    [1, 0], // Check right
    [0, 1], // Check down
    [1, 1], // Check diagonal (down-right)
    [-1, 1], // Check diagonal (up-right)
  ];

  for (const [dx, dy] of directions) {
    let count = 1; // Count the consecutive symbols in the current direction

    // Check in both directions (forward and backward)
    for (let dir = -1; dir <= 1; dir += 2) {
      for (let step = 1; step < boardWin; step++) {
        const newRow = row + dir * step * dy;
        const newCol = col + dir * step * dx;

        if (
          newRow >= 0 &&
          newRow < boardSize &&
          newCol >= 0 &&
          newCol < boardSize &&
          board[newRow][newCol] === symbol
        ) {
          count++;
        } else {
          break; // Stop counting if the sequence is broken
        }
      }

      if (count === boardWin) {
        return board[row][col]; // Return the winning symbol ('X' or 'O')
      }
    }
  }

  return false; // No winning sequence found
}

// Display player names when a player wins
let playerXScore = 0;
let playerOScore = 0;

function displayWinner(winner, nextPlayerName) {
  let winnerName = winner === "X" ? playerXName : playerOName;

  if (winner === "X") {
    playerXScore++;
    modalText.innerHTML = `${winnerName} wins!<br>Next game starts: ${nextPlayerName}`;
  } else if (winner === "O") {
    playerOScore++;
    modalText.innerHTML = `${winnerName} wins!<br>Next game starts: ${nextPlayerName}`;
  } else {
    // In case of a draw
    modalText.innerHTML = "It's a draw!<br>Next game starts: ${nextPlayerName}";
  }

  updateScoresAndProbability();
  showModal();
  playSound(winSound);
  resetGame();
}



socket.on("resetScore", () => {
  // Reset local scores
  playerXScore = 0;
  playerOScore = 0;

  // Update UI with new scores
  updateScoresAndProbability();
});

function updateScoresAndProbability() {
  const totalGames = playerXScore + playerOScore;
  const probabilityX = totalGames > 0 ? (playerXScore / totalGames) * 100 : 0;
  const probabilityO = totalGames > 0 ? (playerOScore / totalGames) * 100 : 0;

  modalText.innerHTML += `<div><span class="score">Score:</span> ${playerXName} ( ${playerXScore} - ${playerOScore} ) ${playerOName}</div>`;
  modalText.innerHTML += `<div><span class="score">Probability Of Winning:</span> ${playerXName}: ${probabilityX.toFixed(
    2
  )}%, ${playerOName}: ${probabilityO.toFixed(2)}%</div>`;
}




function checkDraw() {
  for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
      if (board[row][col] === null) {
        return false;
      }
    }
  }
  return true;
}

function resetGame() {
  board = new Array(boardSize)
    .fill(null)
    .map(() => new Array(boardSize).fill(null));
  currentPlayer = "X";
  boardElement.innerHTML = "";

  createBoard();
  socket.emit("resetGame");
}

socket.on("gameReset", () => {
  board = new Array(boardSize)
    .fill(null)
    .map(() => new Array(boardSize).fill(null));
  currentPlayer = "X";
  boardElement.innerHTML = "";
  createBoard();
  // Reset any other necessary state variables
});

//if one of the players leave the room
socket.on("resetGame", () => {
  // Reset local scores
  playerXScore = 0;
  playerOScore = 0;

  // Reset board size and winning match length to default values
  boardSize = 5; // Default board size (5x5)
  boardWin = 3; // Default match length (3)

  // Update UI elements
  boardSizeSelect.value = boardSize;
  boardWinSelect.value = boardWin;

  // Reset the board and update scores and probabilities
  resetBoard();
  updateScoresAndProbability();
});

function resetBoard() {
  board = new Array(boardSize)
    .fill(null)
    .map(() => new Array(boardSize).fill(null));
  boardElement.innerHTML = "";
  createBoard();
}

//Clear board
clearBoard.addEventListener("click", () => {
  playSound(sidebarSound);
  sidebar.classList.toggle("open");
  resetGame();
});

//Reset board size
boardSizeSelect.addEventListener("change", function () {
  boardSize = parseInt(this.value);
  socket.emit("boardSettingsChanged", { boardSize, boardWin });
  resetGame();
});

//Reset match logic
boardWinSelect.addEventListener("change", function () {
  boardWin = parseInt(this.value);
  socket.emit("boardSettingsChanged", { boardSize, boardWin });
  resetGame();
});

socket.on("boardSettingsUpdated", ({ newBoardSize, newBoardWin }) => {
  boardSize = newBoardSize;
  boardWin = newBoardWin;
  boardSizeSelect.value = newBoardSize;
  boardWinSelect.value = newBoardWin;
  resetGame();
});


closeModal.addEventListener("click", hideModal);

resetScoreButton.addEventListener("click", function () {
  socket.emit("resetScore");
  playSound(sidebarSound);
  sidebar.classList.toggle("open");
  showModal();
  playerXScore = 0;
  playerOScore = 0;

  modalText.innerHTML = `<div style="font-size: 15px;><span class="score"  "></span> ${playerXName}: ${playerXScore}:${playerOScore}: ${playerOName} </div>`;
  showModal();
});

socket.on("connect_error", (error) => {
  console.error("Socket connection error:", error);
});

socket.on("connect_timeout", (timeout) => {
  console.error("Socket connection timeout:", timeout);
});


createBoard();
