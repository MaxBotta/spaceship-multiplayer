const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
app.use(express.static('public'));

app.get('/', function (req, res) {
    res.sendFile('index.html');
});


let USERS = [];
let TEAMS = {
    red: 0,
    blue: 0
};

io.on('connection', (socket) => {

    console.log('a user connected');

    socket.on('disconnect', () => {
        console.log('user disconnected');
        io.emit("remove_user", {id: String(socket.id)});

        USERS = USERS.filter(user => user.id !== String(socket.id));
    });

    socket.on('new_user_connected', (msg) => {
        console.log("new user", msg.user.username);
        USERS.push(msg.user);
        socket.emit('existing_users', { users: USERS });
        io.emit("add_new_user", {user: msg.user});
    });

    socket.on("update_player", (msg) => {
        for(let i = 0; i < USERS.length; i++) {
            if(USERS[i].id === msg.user.id) {
                USERS[i] = msg.user;
            }
        }
    });

    socket.on("new_bullet", (msg) => {
        io.emit("create_bullet", msg);
    })

    socket.on("add_team_point", (msg) => {
        TEAMS[msg.team]++;
        console.log("team " + msg.team + " gets a point");
        io.emit("update_teams", {teams: TEAMS});
    })
});

setInterval(() => {
    io.emit("update_users", {users: USERS})
}, 40);

server.listen(process.env.PORT ? process.env.PORT : 3000, () => {
    console.log('listening on *:3000');
});