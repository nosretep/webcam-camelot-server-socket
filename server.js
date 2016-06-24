var requirejs = require('requirejs');

requirejs.config({
    nodeRequire : require
});

requirejs([ 'http', 'express', 'socket.io', 'camelot' ],

function(http, express, socketio, camelot) {

    var clients = 0;
    var app = express();
    var server = http.createServer(app);
    var io = socketio.listen(server);

    io.set('log level', 0);
    var pic = io.of('/picture');
        pic.on('connection', function(socket) {
          console.log('connection to /picture');
        });

    server.listen(8888);

    app.get('/', function(req, res) {
        res.sendFile(__dirname + '/index.html');
    });

    io.sockets.on('connection', function(socket) {
        var address = socket.handshake.address;
        console.log("New connection from " + address.address + ":" + address.port);
        clients++;
        socket.on('disconnect', function() {
            var address = socket.handshake.address;
            console.log("Client disconnected " + address.address + ":" + address.port);
            clients--;
        });
    });

    var camera = new camelot({
        'palette' : 'YUYV',
        'device' : '/dev/video0',
        'jpeg' : '85',
        'resolution' : '320x240'
    // ,
    // 'greyscale' : true,
    // 'controls' : {
    // focus : 'auto',
    // brightness : 225,
    // contrast : 125,
    // saturation : 125,
    // hue : 125,
    // gamma : 125,
    // sharpness : 125
    // }
    });

    camera.on('frame', function(imagedata) {
        var image64 = imagedata.toString('base64');
//        if (pic.volatile) {
//          pic.volatile.emit('frame', image64);
//        }
      pic.emit('frame', image64);
    });

    camera.on('error', function(error) {
        console.log(error);
    });

    camera.grab({
        'title' : 'Camera0',
        'font' : 'Arial:12',
        'frequency' : 10
    });

});
