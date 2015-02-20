var app = require("express.io")();
app.http().io();
var port = process.env.PORT || 3000;

var clients = {};
var clientSockets = {};

// List of valid commands
var cmds = ["join", "part", "list", "channels", "nick", "msg"];

// Build a string of cmds usable in a regex
var cmdString = "";
cmds.forEach( function(e, i, a){
    cmdString += e + "|";
});
cmdString = cmdString.slice(0, cmdString.length - 1);

//var cmdRe = new RegExp('^\s*\/('+cmdString+')\s?', 'i');
var cmdRe = new RegExp('^\ *\/('+cmdString+')(.*)$', 'i');

console.log("Valid commands: " + cmdRe);

// routes
app.io.route("speak", function(req) {
    var data = req.data;

    console.log("-> "+data);
    // Commands we want to look for:
    // join, part, list, channels, nick, msg
    if( cmdRe.test(data) ) {
        var cmd = data.match(cmdRe)[1];
        var args = data.match(cmdRe)[2].trim();
        console.log("got cmd + args " + cmd + args);

        var fname = "cmd_" + cmd.toLowerCase();
        eval(fname)(args);

    } else {
        app.io.broadcast("speak", {
            user: clientSockets[req.socket.id],
            message: data
        });
    }
});

app.io.route("set username", function(req) {
    var username = req.data;
    if(clients[username] === undefined) {
        clients[username] = req.socket.id;
        clientSockets[req.socket.id] = username;
        console.log("paired username:websocket -> "+username+":"+req.socket.id);
        req.io.respond({ OK: "username set successfully" });
    } else {
        console.log("failed to pair username:websocket, username already in use");
        req.io.respond({ ERROR: "username in use" });
    }
});


//var cmds = ["join", "part", "list", "channels", "nick", "msg"];
function cmd_join(chan) {
    console.log("I was asked to join channel " + chan);
}

function cmd_part(chan) {
    console.log("I was asked to part channel " + chan);
}

function cmd_list(chan) {
    console.log("I was asked to list users in chan" + chan);
}

function cmd_channels() {
    console.log("I was asked to list all channels");
}

function cmd_nick(newnick) {
    console.log("I was asked to change nick to " + newnick);
}

function cmd_msg(target, msg) {
    console.log("I was asked to tell " + target + " ''" + msg + "'");
}

// Client HTML
app.get("/", function(req, res) {
    res.sendfile(__dirname + "/public/index.html");
});

app.listen(port);
