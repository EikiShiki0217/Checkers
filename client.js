//client Informations
var clientId = null;
var playerName = null;
var checkers = [];
for (let i = 0; i < 8; i++) {
    checkers[i] = new Array(8);
    for (let j = 0; j < 8; j++) {
        checkers[i][j] = new Array(2);
    }
}
var side = null;
var enemySide = null;
var roomId = null;
var currentTurn = null;
var roomList = [];
var winner;

var ws = new WebSocket("ws://" +  + ":9090");
var wsUrl = ws.url

//HTML elements

//enter menu
const enter = document.getElementById("enter");
const btnEnter = document.getElementById("btnEnter");
const nameInput = document.getElementById("nameInput");

//menu
const menu = document.getElementById("menu");
const btnCreate = document.getElementById("btnCreate");
const btnRoomList = document.getElementById("btnRoomList");

//join room menu
const join_game = document.getElementById("join_game");

//room
const room = document.getElementById("room");
const roomIdLabel = document.getElementById("roomId");
const pName_white = document.getElementById("pName_white");
const pName_black = document.getElementById("pName_black");
const btnStart = document.getElementById("btnStart");
const btnLeave = document.getElementById("btnLeave");

//gameTurn
const gameTurn = document.getElementById("turn");

//Enter
btnEnter.addEventListener("click", e => {

    const name = nameInput.value;
    const payLoad = {
        "method": "enter",
        "clientId": clientId,
        "playerName": name
    }

    ws.send(JSON.stringify(payLoad));
    enter.style.display = "none";
    menu.style.display = "block";
});

//Create
btnCreate.addEventListener("click", e => {

    const payLoad = {
        "method": "create",
        "clientId": clientId,
        "playerName": playerName
    }

    ws.send(JSON.stringify(payLoad));

    menu.style.display = "none";
    room.style.display = "block";
});

//btnLeave
btnLeave.addEventListener("click", e => {
    const payLoad = {
        "method": "leave",
        "roomId": roomId,
        "clientId": clientId,
        "playerName": playerName
    }
    
    ws.send(JSON.stringify(payLoad));
    
    room.style.display = "none";
    menu.style.display = "block";
})

//btnRoomList
btnRoomList.addEventListener("click", e => {

    const payLoad = {
        "method": "roomList",
        "clientId": clientId,
    }
    
    ws.send(JSON.stringify(payLoad));

    menu.style.display = "none";
    join_game.style.display = "block";
});

//start
btnStart.addEventListener("click", e => {

    const payLoad = {
        "method": "start",
        "roomId": roomId
    }

    ws.send(JSON.stringify(payLoad));
});


//gameplay
const pieces = document.querySelectorAll(".piece");
const black_cells = document.querySelectorAll(".black");
var choosed_row = null;
var choosed_col = null;
var posEat = 0;
var haveNextEat = false;

black_cells.forEach((black) => {
    black.addEventListener("click", () => {
        const row = parseInt(black.dataset.row);
        const col = parseInt(black.dataset.col);
        if (checkTurn()) {
            if (haveNextEat){
                if (isEatCell(row, col)) {
                    eatEnemy(row, col);
                }
            } else {
                if (posEat >= 1){
                    if (checkSide(row, col)){
                        disActive();
                        checkEat();
                        if (!isSelected(row, col)) {
                            checkMove(row, col);
                        }
                    } else {
                        if (isEatCell(row, col)) {
                            eatEnemy(row, col);
                        }
                    }
                } else {
                    if (checkSide(row, col)) {
                        disActive();
                        if (!isSelected(row, col)) {
                            checkMove(row, col);
                        }
                    } else {
                        if (isMoveCell(row, col)) {
                            move(row, col);
                        }
                    }
                }
            }
        }
    });
});


function checkTurn() {
    var isMyTurn = false;
    if (currentTurn === 1 && side === 1) {
        isMyTurn = true;
    } else if (currentTurn === 2 && side === 2) {
        isMyTurn = true;
    }
    return isMyTurn;
}


function checkSide(row, col) {
    var mySide = false;
    black_cells.forEach((black) => {
        if (parseInt(black.dataset.row) === row && parseInt(black.dataset.col) === col) {
            if (parseInt(black.dataset.side) === side) {
                mySide = true;
            }
        }
    });
    return mySide;
}

function isSelected(row, col) {
    var isSelected = false;
    black_cells.forEach((black) => {
        if (parseInt(black.dataset.row) === row && parseInt(black.dataset.col) === col) {
            if (parseInt(black.dataset.row) === choosed_row && parseInt(black.dataset.col) === choosed_col) {
                isSelected = true;
            }
        }
    });
    return isSelected;
}

function isEatCell(row, col) {
    var isEatCell = false;
    black_cells.forEach((black) => {
        if (parseInt(black.dataset.row) === row && parseInt(black.dataset.col) === col) {
            if (parseInt(black.dataset.active) === 2) {
                isEatCell = true;
            }
        }
    });
    return isEatCell;
}

function isMoveCell(row, col) {
    var isMoveCell = false;
    black_cells.forEach((black) => {
        if (parseInt(black.dataset.row) === row && parseInt(black.dataset.col) === col) {
            if (parseInt(black.dataset.active) === 1) {
                isMoveCell = true;
            }
        }
    });
    return isMoveCell;
}

function move(row, col) {
    for (let i = 0; i < 2; i++) {
        checkers[row][col][i] = checkers[choosed_row][choosed_col][i];
        checkers[choosed_row][choosed_col][i] = 0;
    }
    for (let i = 0; i < 8; i ++) {
        if (checkers[0][i][0] === side) {
            checkers[0][i][1] === 1;
        }
    }
    disActive();
    update();
}

function eatEnemy(row, col) {
    for (let i = 0; i < 2; i++) {
        checkers[row][col][i] = checkers[choosed_row][choosed_col][i];
        checkers[choosed_row][choosed_col][i] = 0;
        checkers[(choosed_row + row) / 2][(choosed_col + col) / 2][i] = 0;
    }
    disActive();
    checkNextEat(row, col);
    if (!haveNextEat) {
        update();
    } else {
        setCheckers();
    }
}

function checkNextEat(row, col) {
    for (let e1 = -1; e1 <= 1; e1 += 2) {
        if (row - 2 >= 0) {
            if (col + e1 + e1 >= 0 && col + e1 + e1 <= 7) {
                if (checkers[row][col][0] === side) {
                    if (checkers[row][col][1] === 0) {
                        if (checkers[row - 1][col + e1][0] === enemySide) {
                            if (checkers[row - 2][col + e1 + e1][0] === 0) {
                                black_cells.forEach((black) => {
                                    if (parseInt(black.dataset.row) === row && parseInt(black.dataset.col) === col) {
                                        choosed_row = row;
                                        choosed_col = col;
                                        black.dataset.eat = 1;
                                    }
                                });
                            }
                        }
                    }
                }
            }
        }
        for (let e2 = -1; e2 <= 1; e2 += 2) {
            if (row + e1 + e1 >= 0 && row + e1 + e1 <= 7) {
                if (col + e2 + e2 >= 0 && col + e2 + e2 <= 7) {
                    if (checkers[row][col][0] === side) {
                        if (checkers[row][col][1] === 1) {
                            if (checkers[row + e1][col + e2][0] === enemySide) {
                                if (checkers[row + e1 + e1][col + e2 + e2][0] === 0) {
                                    black_cells.forEach((black) => {
                                        if (parseInt(black.dataset.row) === row && parseInt(black.dataset.col) === col) {
                                            choosed_row = row;
                                            choosed_col = col;
                                            black.dataset.eat = 1;
                                        }
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    black_cells.forEach((black) => {
        if (parseInt(black.dataset.eat) === 1) {
            black.classList.add("active");
            posEat++;
        }
    });
    if (posEat === 1) {
        haveNextEat = true;
    } else if (posEat === 0) {
        haveNextEat = false;
    }
    addNextEatCell(row, col);
}

function addNextEatCell(row, col) {
    for (let e1 = -1; e1 <= 1; e1 += 2) {
        if (row - 2 >= 0) {
            if (col + e1 + e1 >= 0 && col + e1 + e1 <= 7) {
                if (checkers[row][col][0] === side) {
                    if (checkers[row][col][1] === 0) {
                        if (checkers[row - 1][col + e1][0] === enemySide) {
                            if (checkers[row - 2][col + e1 + e1][0] === 0) {
                                black_cells.forEach((black) => {
                                    if (parseInt(black.dataset.row) === row - 2 && parseInt(black.dataset.col) === col + e1 + e1) {
                                        black.dataset.active = 2;
                                        black.classList.add("active");
                                    }
                                });
                            }
                        }
                    }
                }
            }
        }
        for (let e2 = -1; e2 <= 1; e2 += 2) {
            if (row + e1 >= 0 && row + e1 <= 7) {
                if (col + e2 + e2 >= 0 && col + e2 + e2 <= 7) {
                    if (checkers[row][col][0] === side) {
                        if (checkers[row][col][1] === 1) {
                            if (checkers[row + e1][col + e2][0] === enemySide) {
                                if (checkers[row + e1 + e1][col + e2 + e2][0] === 0) {
                                    black_cells.forEach((black) => {
                                        if (parseInt(black.dataset.row) === row + e1 + e1 && parseInt(black.dataset.col) === col + e2 + e2) {
                                            black.dataset.active = 2;
                                            black.classList.add("active");
                                        }
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

function update() {

    var sendcheckers = [];
    for (let i = 0; i < 8; i++) {
        sendcheckers[i] = new Array(8);
        for (let j = 0; j < 8; j++) {
            sendcheckers[i][j] = new Array(2);
        }
    }

    for (let i = 0; i < 8; i++) {
        if (checkers[0][i][0] === side) {
            checkers[0][i][1] = 1;
            console.log(checkers[0][i][1]);
        }
        for (let j = 0; j < 8; j++) {
            for (let k = 0; k < 2; k++) {
                if (side === 1) {
                    sendcheckers[i][j][k] = checkers[7 - i][7 - j][k];
                } else if (side === 2) {
                    sendcheckers[i][j][k] = checkers[i][j][k];
                }
            }
        }
    }
    
    const payLoad = {
        "method": "update",
        "roomId": roomId,
        "checkers": sendcheckers
    }

    ws.send(JSON.stringify(payLoad));
}

function disActive() {
    black_cells.forEach((black) => {
        black.dataset.active = 0;
        black.dataset.eat = 0;
        choosed_row = null;
        choosed_col = null;
        posEat = 0;
        if (black.classList.contains("active")) {
            black.classList.remove("active");
        }
        if (black.classList.contains("eat")) {
            black.classList.remove("eat");
        }
    });
}

function checkEat() {
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            for (let e1 = -1; e1 <= 1; e1 += 2) {
                if (i - 2 >= 0) {
                    if (j + e1 + e1 >= 0 && j + e1 + e1 <= 7) {
                        if (checkers[i][j][0] === side) {
                            if (checkers[i][j][1] === 0) {
                                if (checkers[i - 1][j + e1][0] === enemySide) {
                                    if (checkers[i - 2][j + e1 + e1][0] === 0) {
                                        black_cells.forEach((black) => {
                                            if (parseInt(black.dataset.row) === i && parseInt(black.dataset.col) === j) {
                                                black.dataset.eat = 1;
                                            }
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
                for (let e2 = -1; e2 <= 1; e2 += 2) {
                    if (i + e1 + e1 >= 0 && i + e1 + e1 <= 7) {
                        if (j + e2 + e2 >= 0 && j + e2 + e2 <= 7) {
                            if (checkers[i][j][0] === side) {
                                if (checkers[i][j][1] === 1) {
                                    if (checkers[i + e1][j + e2][0] === enemySide) {
                                        if (checkers[i + e1 + e1][j + e2 + e2][0] === 0) {
                                            black_cells.forEach((black) => {
                                                if (parseInt(black.dataset.row) === i && parseInt(black.dataset.col) === j) {
                                                    black.dataset.eat = 1;
                                                }
                                            });
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    black_cells.forEach((black) => {
        if (parseInt(black.dataset.eat) === 1) {
            posEat++;
            black.classList.add("eat");
        }
    });
    addEatCell();
}

function addEatCell () {
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            if (posEat === 1) {
                for (let e1 = -1; e1 <= 1; e1 += 2) {
                    if (i - 2 >= 0) {
                        if (j + e1 + e1 >= 0 && j + e1 + e1 <= 7) {
                            if (checkers[i][j][0] === side) {
                                if (checkers[i][j][1] === 0) {
                                    if (checkers[i - 1][j + e1][0] === enemySide) {
                                        if (checkers[i - 2][j + e1 + e1][0] === 0) {
                                            black_cells.forEach((black) => {
                                                if (parseInt(black.dataset.row) === i - 2 && parseInt(black.dataset.col) === j + e1 + e1) {
                                                    black.classList.add("eat");
                                                }
                                            });
                                        }
                                    }
                                }
                            }
                        }
                    }
                    for (let e2 = -1; e2 <= 1; e2 += 2) {
                        if (i + e1 >= 0 && i + e1 <= 7) {
                            if (j + e2 + e2 >= 0 && j + e2 + e2 <= 7) {
                                if (checkers[i][j][0] === side) {
                                    if (checkers[i][j][1] === 1) {
                                        if (checkers[i + e1][j + e2][0] === enemySide) {
                                            if (checkers[i + e1 + e1][j + e2 + e2][0] === 0) {
                                                black_cells.forEach((black) => {
                                                    if (parseInt(black.dataset.row) === i + e1 + e1 && parseInt(black.dataset.col) === j + e2 + e2) {
                                                        black.classList.add("eat");
                                                    }
                                                });
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

}

function checkMove(row, col) {
    choosed_row = row;
    choosed_col = col;
    black_cells.forEach((black) => {
        if (posEat >= 1) {
            if(checkers[row][col][1] === 0) {
                if (parseInt(black.dataset.row) === row - 2) {
                    if (parseInt(black.dataset.col) === col - 2 ||parseInt(black.dataset.col) === col + 2) {
                        if (checkers[(parseInt(black.dataset.row) + row) / 2][(parseInt(black.dataset.col) + col) / 2][0] === enemySide) {
                            if (checkers[parseInt(black.dataset.row)][parseInt(black.dataset.col)][0] === 0) {
                                activeCell(row, col);
                                activeCell(parseInt(black.dataset.row), parseInt(black.dataset.col));
                            }
                        }
                    }
                }
            } else {
                if (parseInt(black.dataset.row) === row - 2 || parseInt(black.dataset.row) === row + 2) {
                    if (parseInt(black.dataset.col) === col - 2 ||parseInt(black.dataset.col) === col + 2) {
                        if (checkers[(parseInt(black.dataset.row) + row) / 2][(parseInt(black.dataset.col) + col) / 2][0] === enemySide) {
                            if (checkers[parseInt(black.dataset.row)][parseInt(black.dataset.col)][0] === 0) {
                                activeCell(row, col);
                                activeCell(parseInt(black.dataset.row), parseInt(black.dataset.col));
                            }
                        }
                    }     
                }
            }
        } else {
            activeCell(row, col);
            if(checkers[row][col][1] === 0) {
                if (parseInt(black.dataset.row) === row - 1) {
                    if (parseInt(black.dataset.col) === col - 1 ||parseInt(black.dataset.col) === col + 1) {
                        if (checkers[parseInt(black.dataset.row)][parseInt(black.dataset.col)][0] === 0) {
                            activeCell(parseInt(black.dataset.row), parseInt(black.dataset.col));
                        }
                    }
                }
            } else {
                if (parseInt(black.dataset.row) === row - 1 || parseInt(black.dataset.row) === row + 1) {
                    if (parseInt(black.dataset.col) === col - 1 ||parseInt(black.dataset.col) === col + 1) {
                        if (checkers[parseInt(black.dataset.row)][parseInt(black.dataset.col)][0] === 0) {
                            activeCell(parseInt(black.dataset.row), parseInt(black.dataset.col));
                        }
                    }
                }
            }
        }
    });
}

function activeCell(row, col) {
    black_cells.forEach((black) => {
        if (parseInt(black.dataset.row) === row && parseInt(black.dataset.col) === col) {
            if (!black.classList.contains("active")) {
                if (posEat >= 1) {
                    if (black.classList.contains("eat")) {
                        black.classList.remove("eat");
                    }
                    black.dataset.active = 2;
                } else {
                    black.dataset.active = 1;
                }
                black.classList.add("active");
            }
        }
    });
}

function setCheckers() {
    black_cells.forEach((black) => {
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                if (black.dataset.row == i && black.dataset.col == j) {
                    black.dataset.piece = checkers[i][j][1];
                    if (checkers[i][j][0] === 1) {
                        black.dataset.side = 1;
                        if (parseInt(black.dataset.piece) === 0) {
                            black.innerHTML = "<div class='white_man'></div>";
                        } else {
                            black.innerHTML = "<div class='white_king'></div>";
                        }
                    } else if (checkers[i][j][0] === 2){
                        black.dataset.side = 2;
                        if (parseInt(black.dataset.piece) === 0) {
                            black.innerHTML = "<div class='black_man'></div>";
                        } else {
                            black.innerHTML = "<div class='black_king'></div>";
                        }
                    } else {
                        black.dataset.side = 0;
                        black.innerHTML = null;
                    }
                }
            }
        }
    });
    const whitep = document.querySelector(".white_player");
    const blackp = document.querySelector(".black_player");

    if (currentTurn === 1) {
        if(!whitep.classList.contains("current_turn")) {
            whitep.classList.add("current_turn");
            blackp.classList.remove("current_turn");
        }
    } else if (currentTurn === 2) {
        if(!blackp.classList.contains("current_turn")) {
            blackp.classList.add("current_turn");
            whitep.classList.remove("current_turn");
        }
    }
}

//response
ws.onmessage = message => {
    //message data
    const response = JSON.parse(message.data);

    //connect
    if (response.method === "connect") {
        clientId = response.clientId;
    }

    //enter
    if (response.method === "enter") {
        playerName = response.playerName;
    }

    //leave
    if (response.method === "leave"){
        if (response.clientId === clientId) {
            roomId = null;
        }
        if (response.side === 1) {
            pName_white.innerText = null;
        } else if (response.side === 2) {
            pName_black.innerText = null;
        }
    }

    //roomList
    if (response.method === "roomList") {
        roomList = response.roomList;
        roomList.forEach(c => {
            const div = document.createElement('div');
            div.classList.add('roomList');
            div.textContent = c.toUpperCase();
            join_game.appendChild(div);
        })

        const btnJoin = document.querySelectorAll(".roomList");
        btnJoin.forEach((enterRoom) => {
            enterRoom.addEventListener("click", () => {
                roomId = enterRoom.innerText.toLowerCase();
                const payLoad = {
                    "method": "join",
                    "roomId": roomId,
                    "clientId": clientId,
                    "playerName": playerName
                }
                
                ws.send(JSON.stringify(payLoad));

                join_game.style.display = "none";
                join_game.innerHTML = "<h1>Rooms</h1>";
                room.style.display = "block";
            });
        });
    }

    //room
    if (response.method === "room"){
        const enteredRoom = response.room;
        roomId = enteredRoom.roomId;
        currentTurn = enteredRoom.turn;
        roomIdLabel.innerText = roomId.toUpperCase();
        enteredRoom.clients.forEach(c => {
            if (c.side === 1) {
                pName_white.innerText = c.playerName.toUpperCase();
            } else if (c.side === 2) {
                pName_black.innerText = c.playerName.toUpperCase();
            }
            if (c.clientId === clientId) {
                side = c.side;
                if (c.type === "guest") {
                    btnStart.style.display = "none";
                }
            }
        });

        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                for (let k = 0; k < 2; k++) {
                    if (side === 1) {
                        checkers[i][j][k] = enteredRoom.checkers[7 - i][7 - j][k];
                    } else if (side === 2) {
                        checkers[i][j][k] = enteredRoom.checkers[i][j][k];
                    }
                }
            }
        }
    }

    //start
    if (response.method === "start") {
        const enteredRoom = response.room;
        room.style.display = "none";
        gameTurn.style.display = "block";
        setCheckers();
        enteredRoom.clients.forEach(c => {
            if (c.side === 1) {
                document.getElementById("white").innerText = c.playerName.toUpperCase();
            } else if (c.side === 2) {
                document.getElementById("black").innerText = c.playerName.toUpperCase();
            }
        });
        if (side === 1) {
            enemySide = 2;
        } else if (side === 2) {
            enemySide = 1;
        }
    }

    //update
    if (response.method === "update"){
        const enteredRoom = response.room;
        currentTurn = enteredRoom.turn;
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                for (let k = 0; k < 2; k++) {
                    if (side === 1) {
                        checkers[i][j][k] = enteredRoom.checkers[7 - i][7 - j][k];
                    } else if (side === 2) {
                        checkers[i][j][k] = enteredRoom.checkers[i][j][k];
                    }
                }
            }
        }

        if (enteredRoom.white_piece === 0) {
            winner = 2;
        }
        if (enteredRoom.black_piece === 0) {
            winner = 1;
        }

        if (side === 1 && currentTurn === 1 || side === 2 && currentTurn === 2) {
            checkEat();
        }
        setCheckers();
    }
}