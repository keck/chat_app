var app = require("express.io")();
app.http().io();
var port = process.env.PORT || 3000;

var clients = {};
var clientSockets = {};

// List of valid commands
var cmds = ["join", "part", "list", "channels", "nick", "whoami", "msg"];

// Build a string of cmds usable in a regex
var cmdString = "";
cmds.forEach( function(e, i, a){
    cmdString += e + "|";
});
cmdString = cmdString.slice(0, cmdString.length - 1);

var cmdRE = new RegExp('^\ *\/('+cmdString+')(.*)$', 'i');
var userRE = new RegExp('/^[a-zA-Z][a-zA-Z0-9]+$/');

console.log("Valid commands: " + cmdRE);

// routes
app.io.route("speak", function(req) {
    var data = req.data;

    console.log("-> "+data);
    // Commands we want to look for:
    // join, part, list, channels, nick, msg
    if( cmdRE.test(data) ) {
        var cmd = data.match(cmdRE)[1];
        var args = data.match(cmdRE)[2].trim();

        var fname = "cmd_" + cmd.toLowerCase();
        // I'm just looking for the rough edges..
        eval(fname)(req, args);

    } else {
        app.io.broadcast("speak", {
            user: clientSockets[req.socket.id],
            message: data
        });
    }
});

app.io.route("set username", set_initial_username);

function set_username(req, username) {
    if(clients[username] === undefined) {
        clients[username] = req.socket.id;
        clientSockets[req.socket.id] = username;
        console.log("paired username:websocket -> "+username+":"+req.socket.id);
        req.io.respond({ name: "speak", OK: "username set successfully" });
    } else {
        console.log("failed to pair username:websocket, username already in use");
        req.io.respond({ name: "speak", ERROR: "username in use" });
    }
}

function set_initial_username(req) {
    set_username(req, req.data);
}

//var cmds = ["join", "part", "list", "channels", "nick", "msg"];
function cmd_join(req, chan) {
    console.log("I was asked to join channel " + chan);
}

function cmd_part(req, chan) {
    console.log("I was asked to part channel " + chan);
}

function cmd_list(req, chan) {
    console.log("I was asked to list users in chan" + chan);
}

function cmd_channels(req) {
    console.log("I was asked to list all channels");
}

function cmd_nick(req, newnick) {
    console.log("I was asked to change nick to " + newnick);
}

function cmd_whoami(req){
    var uname = clientSockets[req.socket.id];
    if(uname === undefined) {
        console.log("unable to find matching username for id " + req.socket.id);
        req.io.respond({ message: "[error] who are you?" });
    } else {
        console.log("whoami => " + uname + ":" + req.socket.id);
        req.io.emit("speak", { user: uname, message: "[server-reply] whoami => " + uname });
    }
}

function cmd_msg(req, target, msg) {
    console.log("I was asked to tell " + target + " ''" + msg + "'");
}

// Client HTML
app.get("/", function(req, res) {
    res.sendfile(__dirname + "/public/index.html");
});

app.listen(port);
