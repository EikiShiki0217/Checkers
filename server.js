const http = require("http");
const express = require("express");
const app = express();

app.get("/", (req, res) => res.sendFile(__dirname + "/index.html"));
app.use(express.static("https://github.com/EiraiShiki0823/Checkers/blob/main"));

app.listen(9091, () => {
    console.log("Listening on http port 9091");
});

const websocket = require("websocket").server;
const httpServer = http.createServer();

httpServer.listen(9090, () => {
    console.log("Listening.. on 9090");
});

const clients = {};
const rooms = {};
const roomList = [];

const wsServer = new websocket({
    "httpServer": httpServer
});


wsServer.on("request", request => {
    //connection
    const connection = request.accept(null, request.origin);
    connection.on("open", () => {
        console.log("opened!");
    });
    connection.on("close", () => {
        console.log("closed!");
    });
    connection.on("message", (message) => {
        const req = JSON.parse(message.utf8Data);

        //Enter
        if (req.method === "enter") {
            const clientId = req.clientId;
            const playerName = req.playerName;
            console.log("entered");
            const payLoad = {
                "method": "enter",
                "clientId": clientId,
                "playerName": playerName
            }

            const con = clients[clientId].connection;
            con.send(JSON.stringify(payLoad));
        }

        //Create

        if (req.method === "create") {
            const clientId = req.clientId;
            const playerName = req.playerName;
            const roomId = randomRoomId();
            const checkers = [
                [[0, 0], [1, 0], [0, 0], [1, 0], [0, 0], [1, 0], [0, 0], [1, 0]],
                [[1, 0], [0, 0], [1, 0], [0, 0], [1, 0], [0, 0], [1, 0], [0, 0]],
                [[0, 0], [1, 0], [0, 0], [1, 0], [0, 0], [1, 0], [0, 0], [1, 0]],
                [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
                [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
                [[2, 0], [0, 0], [2, 0], [0, 0], [2, 0], [0, 0], [2, 0], [0, 0]],
                [[0, 0], [2, 0], [0, 0], [2, 0], [0, 0], [2, 0], [0, 0], [2, 0]],
                [[2, 0], [0, 0], [2, 0], [0, 0], [2, 0], [0, 0], [2, 0], [0, 0]]
            ];
            const side = Math.floor(Math.random() * 2) + 1;
            roomList.push(roomId);
            rooms[roomId] = {
                "roomId": roomId,
                "checkers": checkers,
                "turn": 1,
                "start": false,
                "white_piece": 12,
                "black_piece": 12,
                "winner": null,
                "clients": [
                    {
                        "clientId": clientId,
                        "playerName": playerName,
                        "type": "host",
                        "side": side
                    }
                ]
            }
            const payLoad = {
                "method": "room",
                "room" : rooms[roomId]
            }

            const con = clients[clientId].connection;
            con.send(JSON.stringify(payLoad));
        }

        //leave
        if(req.method === "leave") {
            const clientId = req.clientId;
            const roomId = req.roomId;
            const room = rooms[roomId];
            var side = null;
            var index = 0;
            room.clients.forEach(c => {
                if (c.clientId === clientId) {
                    side = c.side;
                    room.clients.splice(index, 1);
                }
                index++;
            });

            const payLoadLeave = {
                "method": "leave",
                "clientId": clientId,
                "side": side
            }
            
            const con = clients[clientId].connection;
            con.send(JSON.stringify(payLoadLeave));

            const payLoad = {
                "method": "room",
                "room": room,
            }
            room.clients.forEach(c => {
                const con = clients[c.clientId].connection;
                con.send(JSON.stringify(payLoad));
                con.send(JSON.stringify(payLoadLeave));
            });
        }

        //show roomlist
        if (req.method === "roomList") {
            const clientId = req.clientId;

            const payLoad = {
                "method": "roomList",
                "roomList": roomList
            }

            const con = clients[clientId].connection;
            con.send(JSON.stringify(payLoad));
        }

        //join
        if (req.method === "join") {
            const clientId = req.clientId;
            const playerName = req.playerName;
            const roomId = req.roomId;
            const room = rooms[roomId];
            if (room.clients.length >= 2) {
                return;
            }

            var side = 1;
            room.clients.forEach(c => {
                if (c.side === 1) {
                    side = 2;
                }
            });

            room.clients.push({
                "clientId": clientId,
                "playerName": playerName,
                "type": "guest",
                "side": side
            });

            const payLoad = {
                "method": "room",
                "room": room
            }
            
            room.clients.forEach(c => {
                clients[c.clientId].connection.send(JSON.stringify(payLoad));
            });
        }

        //start
        if (req.method === "start"){
            const roomId = req.roomId;
            const room = rooms[roomId];
            room.start = true;

            const payLoad = {
                "method": "start",
                "room": room
            }

            room.clients.forEach(c => {
                clients[c.clientId].connection.send(JSON.stringify(payLoad));
            });
        }

        //update
        if (req.method === "update") {
            const roomId = req.roomId;
            const room = rooms[roomId];

            for (let i = 0; i < 8; i++) {
                for (let j = 0; j < 8; j++) {
                    for (let k = 0; k < 2; k++) {
                        room.checkers[i][j][k] = req.checkers[i][j][k];
                    }
                }
            }
            if (room.turn === 1) {
                room.turn = 2;
            } else {
                room.turn = 1;
            }

            var whiteP = 0;
            var blackP = 0;

            for (let i = 0; i < 8; i++) {
                for (let j = 0; j < 8; j++) {
                    if (room.checkers[i][j][0] === 1) {
                        whiteP++;
                    } else if (room.checkers[i][j][0] === 2) {
                        blackP++;
                    }
                }
            }
            room.white_piece = whiteP;
            room.black_piece = blackP;

            const payLoad = {
                "method": "update",
                "room": room
            }

            room.clients.forEach(c => {
                clients[c.clientId].connection.send(JSON.stringify(payLoad));
            });
        }
    });

    const clientId = randomClientId();
    clients[clientId] = {
        "connection": connection
    }

    const payLoad = {
        "method": "connect",
        "clientId": clientId
    }

    connection.send(JSON.stringify(payLoad));

});

function randomClientId() {
    const letters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < 6; i++) {
        const randomIndex = Math.floor(Math.random() * letters.length);
        id += letters.charAt(randomIndex);
    }
    return id;
}

function randomRoomId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    let id = '';
    for (let i = 0; i < 4; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        id += chars.charAt(randomIndex);
    }
    return id;
}
