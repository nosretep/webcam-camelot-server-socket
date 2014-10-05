/*
** Tree.js - Cody Shepp <me@codyshepp.com>
** This script runs on the computer that handles web server duties.
** You can run both scripts on one computer if you want,
** just set createSpeaker(127.0.0.1:1234) in leaf.js
*/

//Includes - you'll need the follow modules installed
var app = require('express')();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var m = require('messenger');

//use this port to access the web interface (http://server.ip.add.here:8888)
server.listen(8888);

//serves out index.html
app.get('/', function(req, res){
  res.sendfile(__dirname + '/index.html');
});

//create a listener for data coming from the camera.
//your messenger should "listen" and "speak" on the same port.
//you can even run both tree.js and leaf.js on the pi itself!
var messenger = m.createListener(1234);
io.sockets.on('connection', function(socket){
  console.log('connected');
  //when we receive a frame from the camera
  messenger.on('image', function(m, data){
    //console.log(m);
    //send that frame to the client (index.html)
    socket.emit('frame', data['imagedata']);
  });
});

