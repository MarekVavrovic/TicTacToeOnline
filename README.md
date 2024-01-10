```
1. Create a Separate JS File for Socket Initialization
Create a new JavaScript file, say socketInit.js, which will initialize the socket and export it.

javascript
Copy code
// socketInit.js
const socket = io();
export default socket;
2. Import the Socket Instance in Other JS Files
In your other JavaScript files (chatClient.js, game.js, etc.), import the socket instance from socketInit.js instead of initializing a new one.

chatClient.js:
javascript
Copy code
// chatClient.js
import socket from './socketInit.js';

// Rest of your chatClient.js code...
game.js:
javascript
Copy code
// game.js
```js
import socket from './socketInit.js';
```


// Rest of your game.js code...
3. Update Your HTML File
In your HTML file, make sure to include socketInit.js before the other scripts that depend on it.

html
Copy code
```js
```
<!-- Include the socket.io client library -->
<script src="/socket.io/socket.io.js"></script>

<!-- Include your new socket initialization script -->
<script type="module" src="./js/socketInit.js"></script>

<!-- Then include your other scripts -->
<script type="module" src="./js/chatClient.js"></script>
<script type="module" src="./js/game.js"></script>
```
``` handleCellClick function should only make a move if it's the player's turn, and then it should emit this move to the server. The local game state should only be updated after confirmation from the server.```

```js
function handleCellClick(event) {
  const row = parseInt(event.target.dataset.row);
  const col = parseInt(event.target.dataset.col);

  if (board[row][col] === null && isMyTurn) {
    // Emit the move to the server
    socket.emit("playerMove", {
      row,
      col,
      player: myPlayerSymbol,
      room: "RoomID",
    });
    playSound(clickSound);
  }
}

```
When the server broadcasts a move, update your board accordingly. This handles moves made by both the local player and the opponent.

```js 
socket.on('moveMade', ({ row, col, player }) => {
  if (board[row][col] === null) {
    board[row][col] = player;
    updateCell(row, col, player);

    if (checkWin(row, col)) {
      displayWinner(player);
      resetGame();
    } else if (checkDraw()) {
      modalText.textContent = "It's a draw!";
      showModal();
      resetGame();
    } else {
      // Switch to the next player
      currentPlayer = currentPlayer === "X" ? "O" : "X";
    }

    // Toggle the turn only if the move was made by the other player
    isMyTurn = (player !== myPlayerSymbol);
  }
});

```
Ensure the updateCell function updates the cell's display correctly.

```js
function updateCell(row, col, player) {
  const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
  if (cell) {
    cell.textContent = player;
    cell.style.color = player === "X" ? "red" : "blue";
    cell.classList.add(`player${player}`);
  }
}

```

server.js - broadcast the move to all clients in the room and then toggle the turn.

```js
socket.on("playerMove", ({ row, col, player, room }) => {
  // Broadcast the move to all clients in the room
  io.to(room).emit("moveMade", { row, col, player });

  // Determine and emit whose turn it is next
  const nextPlayer = player === "X" ? "O" : "X";
  io.to(room).emit("turn", nextPlayer);
});

```

