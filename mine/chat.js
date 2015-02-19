var app = require('express.io')();
app.http().io();
var port = process.env.PORT || 3000;

var clients = {};
var clientSockets = {};

// routes
app.io.route('speak', function(req) {
    console.log("-> "+req.data)
    req.io.broadcast('speak', {
        user: clientSockets[req.socket.id],
        message: req.data
    });
});

app.io.route('set username', function(req) {
    var username = req.data;
    console.log("attempting to set username -> "+req.data+":"+req.socket.id);
    if(clients[username] === undefined) {
        clients[username] = req.socket.id;
        clientSockets[req.socket.id] = username;
        console.log("paired username:websocket -> "+req.data+":"+req.socket.id);
        req.io.respond({ OK: 'username set successfully' });
    } else {
        req.io.respond({ ERROR: 'username in use' });
    }

});



// Client HTML
app.get('/', function(req, res) {
    res.sendfile(__dirname + '/public/index.html');
});

app.listen(port);
