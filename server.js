var requirejs = require('requirejs');

requirejs.config({
    nodeRequire : require
});

requirejs([ 'http', 'express', 'socket.io', 'async', 'webcam'],

function(http, express, socketio, async, WebCam) {

    var app = express();
    var server = http.createServer(app);
    server.listen(process.env.WEBCAM_PORT || 8889);

    app.get('/', function(req, res) {
        res.sendFile(__dirname + '/index.html');
    });

    var clients = 0;
    var cached_frames = {}
    var io = socketio.listen(server);
    var pic = io.of('/picture');
        pic.on('connection', function(socket) {
          console.log('Connection to /picture');
          var frame_keys = Object.keys(cached_frames);
          for (var i = 0; i < frame_keys.length; i++) {
            var frame_key = frame_keys[i];
            // tell the client about the frame_key
            socket.emit('frame.new', frame_key);
            // tell the client about the image data
            socket.emit(frame_key, cached_frames[frame_key]);  
          }
        });

    io.sockets.on('connection', function(socket) {
        var address = socket.handshake.address;
        console.log("New connection from " + address);
        clients++;
        socket.on('disconnect', function() {
            var address = socket.handshake.address;
            console.log("Client disconnected " + address);
            clients--;
        });
    });

    var setup_camera = function(device, callback) {
        console.log('Setting up camera ' + device);
        var camera = WebCam.make_camera({
            'palette' : 'YUYV',
            'device' : device,
            'jpeg' : '85',
            'resolution' : '320x240',
            'title' : device,
            'font' : 'Arial:12',
            'frequency' : 10,
            'controls' : {
              'brightness' : 128,
              'contrast' : 32,
              'saturation' : 32,
              'sharpness' : 53
            }
        });

        camera.on('frame', function(imagedata) {
            var image64 = imagedata.toString('base64');
            var frame_key = 'frame'+device
            cached_frames[frame_key] = image64;
            pic.emit(frame_key, cached_frames[frame_key]);
        });

        camera.on('error', function(error) {
            console.log(error);
        });

        camera.grab();

        setTimeout(callback, 5000)
    }

    var video_devices = process.env.VIDEO_DEVICES.split(',');

    async.eachSeries(video_devices, function (video_device, callback) {
      setup_camera(video_device, callback);
    }, function (err) {
      if (err) { throw err; }
      console.log('Cameras are setup');
    });

});


