/*
**  Leaf.js - Cody Shepp <me@codyshepp.com>
**  This script runs on the computer with the camera attached. In my case, the Pi.
*/
//Includes - you'll need the following modules installed, as well as fswebcam
var camelot = require('camelot');
var messenger = require('messenger');
//replace ip address with the address of the server
leaf = messenger.createSpeaker('192.168.0.90:1234');
//create a new connection to fswebcam and set some options
var camera = new camelot({
  'palette': 'YUYV',
  'device': '/dev/video0',
  'jpeg': '85',
  'resolution': '352x288',
//  'greyscale' : true,
  /*
  'controls' : {
    focus : 'auto',
    brightness : 225,
    contrast : 125,
    saturation : 125,
    hue : 125,
    gamma : 125,
    sharpness : 125
  } */
});

//when we get a frame from the camera,
camera.on('frame', function(imagedata){
  console.log('sending frame');
  //convert to base64 string to transfer
  var image64 = imagedata.toString('base64');
  //and send to the tree
  leaf.send('image', {'imagedata': image64});
});

//log errors!
camera.on('error', function(error){
  console.log(error);
});

//initiate camera recording - note: frequency = frames per second
camera.grab({
  'title': 'Camera0',
  'font': 'Arial:12',
  'frequency': 5
});

