const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
console.log("starting");
// Create an HTTP server
const server = http.createServer((req, res) => {
    // console.log("path = ");
    // console.log(path.win32.sep);
    fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Internal Server Error');
        } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        }
    });
});

// Create a WebSocket server
const wss = new WebSocket.Server({ server });

// Function to generate a unique player ID
function generatePlayerId() {
    return Math.random().toString(36).substring(2, 8);
}

// Function to determine the winner based on player choices
function determineWinner(player1Choice, player2Choice) {
    if (player1Choice === player2Choice && player1Choice !== null) {
        return 'It\'s a tie!';
    } else if (
        (player1Choice === 'rock' && player2Choice === 'scissors') ||
        (player1Choice === 'scissors' && player2Choice === 'paper') ||
        (player1Choice === 'paper' && player2Choice === 'rock')
    ) {
        return 'Player 1 wins!';
    } else {
        return 'Player 2 wins!';
    }
}

// Track connected players and their choices
let players = {};
let gameInProgress = false;

// Handle WebSocket connections
wss.on('connection', (ws) => {
    // Generate player ID
    const playerId = generatePlayerId();

    // Store player's WebSocket connection
    players[playerId] = ws;

    // Send player ID to the client
    ws.send(JSON.stringify({ playerId }));

    // Handle messages from the player
    ws.on('message', (message) => {
        const { playerId, choice } = JSON.parse(message);

        // Check if player exists before setting choice
        if (players[playerId]) {
            players[playerId].choice = choice;

            // Log the types of players[1], players[2], and players[3]
            console.log(typeof players[1], typeof players[2], typeof players[3]);

            // Check if both players have made a choice
            if (Object.keys(players).length === 2 && players[1] && players[2] && players[1].choice && players[2].choice && !gameInProgress) {
                // Set game in progress
                gameInProgress = true;

                // Determine the winner
                const result = determineWinner(players[1].choice, players[2].choice);

                // Send result to both players
                for (const playerId in players) {
                    players[playerId].send(JSON.stringify({ result }));
                }

                // Reset game state for the next round
                //players = {};
                players[1].choice = null;
                players[2].choice  = null;
                gameInProgress = false;
            }
        }
    });

    // Handle client disconnection
    ws.on('close', () => {
        delete players[playerId];
    });
});



// Start the server on port 3000
server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
