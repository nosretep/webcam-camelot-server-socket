define(
  ['child_process', 'util', 'node-uuid', 'events', 'fs'], 
  function(child_process, util, uuid, events, fs) {

    var spawn = child_process.spawn;
    var location = '/tmp/camelot/';
    
    if (!fs.exists(location)){
      fs.mkdir(location, 0777);
    }

    var WebCam = function (opts) {
      this.opts = opts;
      return this;
    }

    util.inherits(WebCam, events.EventEmitter);

    WebCam.prototype.grab = function () {

      var self = this;
      var opts = self.opts;
      var grabber = function () {

        var format = ".jpg";

        fs.exists(opts.device, function (device_exists) {

          var inner_grabber = function () {

            // name of the image file to be created, read, and deleted
            var filename = location + uuid() + format;

            // arguments to be sent to fswebcam including the image file name
            var camera_args = set_camera_args(opts, filename)

            self.emit('info.device', JSON.stringify(camera_args))

            // create the image file using web camera with fswebcam
            var fswebcam = spawn('fswebcam', camera_args);

            // when fswebcam is complete
            fswebcam.on('exit', function (code) {

              // make sure the image file was created
              fs.exists(filename, function (file_exists) {
                if (!file_exists) {
                  var err = new Error('Frame file unavailable.');
                  self.emit('error', err);
                } else {
                  // open the image file
                  fs.readFile(filename, function (err, data) {
                    if (err) {
                      self.emit('error', err);
                    } else {
                      // emit the image file data
                      self.emit('frame', data);

                      // delete the file
                      fs.unlink(filename);
                    }
                  });
                }
              });
            });
          };

          if (!device_exists) {
            var message = 'device not found (' + opts.device + ').';
            var err = new Error(message);
            self.emit('error.device', err);
          } else {
            inner_grabber();
          }

        });

        if (opts.frequency) {
          setTimeout(function () {
            grabber();
          }, 1000 * opts.frequency);
        }
      };

      grabber();
    };

    function set_camera_args(opts, filename) {
      var camera_args = []
      for ( var option in opts) {
        switch (option) {
          case 'device':
            break;
          case 'greyscale':
            if (opts[option] === true) {
              camera_args.push("--" + option);
              camera_args.push(opts[option]);
            }
            break;
          case 'png':
            format = ".png";
            camera_args.push("--" + option);
            camera_args.push(opts[option]);
          case 'controls':
            for ( var control in opts[option]) {
              switch (control) {
                case 'brightness':
                  var brightness =
                    opts['controls']['brightness'] > 127 ? 127 : opts['controls']['brightness'];
                  camera_args.push("--set");
                  camera_args.push("Brightness=" + brightness + "");
                  continue;
                case 'contrast':
                  var contrast =
                    opts['controls']['contrast'] > 255 ? 255 : opts['controls']['contrast'];
                  camera_args.push("--set");
                  camera_args.push("Contrast=" + contrast + "");
                  continue;
                case 'saturation':
                  var saturation =
                    opts['controls']['saturation'] > 255 ? 255 : opts['controls']['saturation'];
                  saturation = saturation < 0 ? 0 : saturation;
                  camera_args.push("--set");
                  camera_args.push("Saturation=" + saturation + "");
                  continue;
                case 'gamma':
                  var gamma = opts['controls']['gamma'] > 500 ? 500 : opts['controls']['gamma'];
                  gamma = gamma < 75 ? 75 : gamma;
                  camera_args.push("--set");
                  camera_args.push("Gamma=" + gamma + "");
                  continue;
                case 'sharpness':
                  var sharpness =
                    opts['controls']['sharpness'] > 255 ? 255 : opts['controls']['sharpness'];
                  sharpness = sharpness < 0 ? 0 : sharpness;
                  camera_args.push("--set");
                  camera_args.push("Sharpness=" + sharpness + "");
                  continue;
                case 'hue':
                  var hue = opts['controls']['hue'] > 127 ? 127 : opts['controls']['hue'];
                  hue = hue < -128 ? -128 : hue;
                  camera_args.push("--set");
                  camera_args.push("Hue=" + hue + "");
                  continue;
                case 'focus':
                  if (opts['controls']['focus'] === 'auto') {
                    camera_args.push("--set");
                    camera_args.push("Focus, Auto=1");
                  } else {
                    var focus = opts['controls']['focus'] > 200 ? 200 : opts['controls']['focus'];
                    focus = focus < 0 ? 0 : focus;
                    camera_args.push("--set");
                    camera_args.push("Focus, Auto=0");
                    camera_args.push("--set");
                    camera_args.push("Focus (absolute)=" + focus + "");
                  }
                  continue;
                default:
                  continue;
              }
            }
            break;
          default:
            camera_args.push("--" + option);
            camera_args.push(opts[option]);
            break;
        }
      }
      camera_args.push('--save', filename);
      camera_args.push('--device', opts.device);
      return camera_args
    }

    return WebCam

  }
)

/*

copied and after refactors, soon to be inspired by, https://github.com/pdeschen/camelot

(MIT license)

Copyright 2011-2012 Pascal Deschenes pdeschen@gmail.com

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/