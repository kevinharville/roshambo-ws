const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

console.log("starting");

// Create an HTTP server
const server = http.createServer((req, res) => {
    if (req.url.endsWith('.css')) {
        const cssPath = path.join(__dirname, req.url);
        fs.readFile(cssPath, 'utf8', (err, css) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
                return;
            }

            res.writeHead(200, { 'Content-Type': 'text/css' });
            res.end(css);
        });
    }
    else {
        fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data);
            }
        });
    }
});

// Create a WebSocket server
const wss = new WebSocket.Server({ server });

// Function to determine the winner based on player choices
function determineWinner(player1Choice, player2Choice) {
    if (player1Choice === player2Choice) {
        return "It's a tie!";
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
const players = {};

// Handle WebSocket connections
wss.on('connection', (ws) => {
    const playerId = Object.keys(players).length + 1;
    console.log("adding player " + playerId)
    players[playerId] = { ws };

    // Send player ID to the client
    ws.send(JSON.stringify({ playerId }));

    // Handle messages from the player
    ws.on('message', (message) => {
        const data = JSON.parse(message);

        if (data.type === 'choice') {
            players[playerId].choice = data.choice;
        } else if (data.type === 'playAgain') {
            console.log("play again server")
            delete players[playerId].choice;
        }

        // Check if both players have made a choice
        if (Object.keys(players).length === 2 && players[1].choice && players[2].choice) {
            const result = determineWinner(players[1].choice, players[2].choice);

            // Send result to both players
            Object.values(players).forEach(player => {
                player.ws.send(JSON.stringify({ result }));
            });
        }
    });

    // Handle client disconnection
    ws.on('close', () => {
        delete players[playerId];
        console.log(`Player ${playerId} disconnected.`);
    });
});

// Start the server on port 3000
server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});