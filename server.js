
var app = require('express')();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var camelot = require('camelot');

server.listen(8888);

app.get('/', function(req, res){
  res.sendfile(__dirname + '/index.html');
});

io.sockets.on('connection', function(socket){
  camera.on('frame', function(imagedata){
	  var image64 = imagedata.toString('base64');
	  socket.emit('frame', image64);
  });
});

var camera = new camelot({
  'palette': 'YUYV',
  'device': '/dev/video0',
  'jpeg': '85',
  'resolution': '320x240',
//  'greyscale' : true,
  'controls' : {
    focus : 'auto',
    brightness : 225,
    contrast : 125,
    saturation : 125,
    hue : 125,
    gamma : 125,
    sharpness : 125
  }
});

camera.on('error', function(error){
  console.log(error);
});

camera.grab({
  'title': 'Camera0',
  'font': 'Arial:12',
  'frequency': 1
});