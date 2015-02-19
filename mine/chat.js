var app = require('express.io')();
app.http().io();
var port = process.env.PORT || 3000;

app.io.route('chat message', function(req) {
    console.log("got message!");
    req.io.emit('chat message', {
        message: req.data
    })
})

// Client HTML
app.get('/', function(req, res) {
    res.sendfile(__dirname + '/public/index.html');
})

app.listen(port);
