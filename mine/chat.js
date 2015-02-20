var app = require("express.io")();
app.http().io();
var port = process.env.PORT || 3000;

// username => socket_id
var clients = {};
// socket_id => username
var clientSockets = {};

// socket_id => channel
var channels = {};
// channel => [ socket_ids ]
var channelUsers = { };

// List of valid commands
var cmds = ["join", "part", "list", "users", "nick", "whoami", "whereami", "msg"];

// Build a string of cmds usable in a regex
var cmdString = "";
cmds.forEach( function(e, i, a){
    cmdString += e + "|";
});
cmdString = cmdString.slice(0, cmdString.length - 1);

var cmdRE = new RegExp('^\ *\/');
var validCmdRE = new RegExp('^\ *\/('+cmdString+')(.*)$', 'i');
var userRE = new RegExp('^[a-zA-Z][a-zA-Z0-9]+$');
var chanRE = new RegExp('^#[a-zA-Z][a-zA-Z0-9]+$');

console.log("Valid commands: " + validCmdRE);

// routes
app.io.route("speak", function(req) {
    var data = req.data;

    console.log("-> "+data);
    // Commands we want to look for:
    // join, part, list, channels, nick, msg etc.
    if( cmdRE.test(data) ) {
        if( validCmdRE.test(data) ) {
            var cmd = data.match(validCmdRE)[1];
            var args = data.match(validCmdRE)[2].trim();

            var fname = "cmd_" + cmd.toLowerCase();
            // I'm just looking for the rough edges..
            eval(fname)(req, args);
        } else {
            req.io.emit("speak", { user: "SYSTEM", message: "Invalid command" });
        }
    } else {
        // broadcast only to the users of the channel this user is in
        var chan = channels[req.socket.id];
        app.io.room(chan).broadcast("speak", {
            user: clientSockets[req.socket.id],
            message: data
        });
    }
});

app.io.route("join", function(req) {
    var chan = req.data;
    cmd_join(req, chan);
});

app.io.route("set username", set_initial_username);

function set_username(req, username) {
    if(clients[username] === undefined) {
        clients[username] = req.socket.id;
        clientSockets[req.socket.id] = username;
        console.log("paired username:websocket -> "+username+":"+req.socket.id);
        req.io.respond({ name: "speak", OK: "username set successfully" });
        return true;
    } else {
        console.log("failed to pair username:websocket, username already in use");
        req.io.respond({ name: "speak", ERROR: "username in use" });
    }
    return false;
}

function set_initial_username(req) {
    set_username(req, req.data);
}

function cmd_join(req, chan) {
    console.log("I was asked to join channel " + chan);
    var uname = clientSockets[req.socket.id];

    if( chanRE.test(chan) ) {

        if ( channelUsers[chan] === undefined ) {
            channelUsers[chan] = { };
        }
        cmd_part(req);
        req.io.join(chan);
        channelUsers[chan][req.socket.id] = 1;
        channels[req.socket.id] = chan;
        req.io.emit("speak", { user: uname, message: "You have joined channel " + chan });

    } else {
        req.io.emit("speak", { user: uname, message: "[server-message] Invalid Channel Name"});
    }
}

function cmd_part(req) {
    var uname = clientSockets[req.socket.id];
    var chan = channels[req.socket.id];

    if ( chan !== undefined ) {
      console.log("I was asked to part channel " + chan);

      if( chanRE.test(chan) ) {
          req.io.leave(chan);
          delete channelUsers[chan][req.socket.id];
          req.io.emit("speak", { user: uname, message: "You have left channel " + chan });
      } else {
          req.io.emit("speak", { user: uname, message: "[server-message] Invalid Channel Name"});
      }
    }
}

function cmd_list(req) {
    console.log("I was asked to list all the channels");
    var answer = "[server-message] ";
    for ( var chan in channelUsers ) {
        answer += chan + " ";
    }
    req.io.emit("speak", { user: 'SYSTEM', message: answer });
}

function cmd_users(req, chan) {
    var chan = channels[req.socket.id];

    // this is the keys of channels in current room
    if ( chan !== undefined ) {
        console.log("I was asked to list all users in room " + chan);

        var answer = "[server-message] ";
        for ( var sid in channelUsers[chan] ) {
            answer += clientSockets[sid] + " ";
        }
        req.io.emit("speak", { user: 'SYSTEM', message: answer });
    } else {
        req.io.emit("speak", { user: 'SYSTEM', message: "[server-message] Not in a channel!"});
    }
}

function cmd_nick(req, newnick) {
    var uname = clientSockets[req.socket.id];
    console.log("I was asked to change nick from " + uname + " to " + newnick);
    if (userRE.test(newnick)) {
        clients[uname] = undefined;
        if (set_username(req, newnick)) {
            req.io.emit("change username", {
               user: newnick,
               message: "[server-message] nick changed from "+ uname + " to " + newnick
            });
            req.io.broadcast("speak", {
               user: "SYSTEM",
               message: "[server-message] " + uname + " is now known as " + newnick
            });
        }
    } else {
        console.log("invalid nick requested ->" + newnick + "<-");
        req.io.emit("change username", { user: uname, message: "[server-error] invalid nick requested"});
    }
    return false;
}

function cmd_whereami(req){
    var chan = channels[req.socket.id];
    var uname = clientSockets[req.socket.id];
    if(uname === undefined) {
        console.log("unable to find matching username for id " + req.socket.id);
        req.io.emit("speak", { user: uname, message: "[server-error] whereami => unknown!"});
    } else {
        if(chan === undefined) {
            console.log("unable to find matching channel for id " + req.socket.id);
            req.io.emit("speak", { user: uname, message: "[server-error] whereami => unknown!"});
        } else {
            console.log("whereami => " + uname + ":" + chan);
            req.io.emit("speak", { user: uname, message: "[server-reply] whereami => " + chan });
        }
    }
}

function cmd_whoami(req){
    var uname = clientSockets[req.socket.id];
    if(uname === undefined) {
        console.log("unable to find matching username for id " + req.socket.id);
        req.io.emit("speak", { user: uname, message: "[server-error] whoami => unknown!"});
    } else {
        console.log("whoami => " + uname + ":" + req.socket.id);
        req.io.emit("speak", { user: uname, message: "[server-reply] whoami => " + uname });
    }
}

function cmd_msg(req, target, msg) {
    console.log("I was asked to tell " + target + " ''" + msg + "'");

    //var uname = clientSockets[req.socket.id];
    //var targetId = clients[target];

}

// Client HTML
app.get("/", function(req, res) {
    res.sendfile(__dirname + "/public/index.html");
});

app.listen(port);
