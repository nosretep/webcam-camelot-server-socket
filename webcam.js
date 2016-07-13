define(
  ['child_process', 'util', 'node-uuid', 'events', 'fs'], 
  function(child_process, util, uuid, events, fs) {

    var spawn = child_process.spawn;
    var location = '/tmp/camelot/';
    fs.mkdir(location, 0777);

    function camera(options) {

      var _options = {
        verbose: true,
        device : '/dev/video1',
        resolution : '1280x720',
        png : '1',
        greyscale : false,
        title : 'Camelot!',
        font : 'Arial:12',
        controls : {
          focus : 'auto',
          brightness : 0,
          contrast : 136,
          saturation : 150,
          hue : 0,
          gamma : 100,
          sharpness : 50
        }
      };

      var self = this;
      var opts = mixin(options, _options);

      self.grab = function (options, callback) {

        var grabber = function () {

            events.EventEmitter.call(self);
            var camera_args = [];
            self.format = ".jpg";

            //console.log('device is', this.opts.device);
            fs.exists(opts.device, function (exists) {

              var p =
                function () {

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
                              //brightness = brightness < -128 ? -128 : brightness;
                              camera_args.push("--set");
                              camera_args.push("Brightness=" + brightness + "");
                              continue;
                            case 'contrast':
                              var contrast =
                                opts['controls']['contrast'] > 255 ? 255 : opts['controls']['contrast'];
                              //contrast = contrast < 60 ? 60 : contrast;
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

                  var file = location + uuid() + format;

                  camera_args.push('--save', file);
                  camera_args.push('--device', opts.device);

                  var fswebcam = spawn('fswebcam', camera_args);

                  fswebcam.on('exit', function (code) {

                    fs.exists(file, function (exists) {
                      if (!exists) {
                        var err = new Error('Frame file unavailable.');
                        self.emit('error', err);
                        if (callback) {
                          callback.call(err);
                        }
                      } else {
                        fs.readFile(file, function (err, data) {

                          if (err) {
                            self.emit('error', err);
                            if (callback) {
                              callback.call(err);
                            }
                          } else {

                            self.emit('frame', data);
                            fs.unlink(file);
                            if (callback) {
                              callback(data);
                            }
                          }
                        });
                      }
                    });
                  });
                };

              if (!exists) {
                var message = 'device not found (' + opts.device + ').';
                console.error(message);
                var err = new Error(message);
                self.emit('error.device', err);
                if (callback) {
                  callback.call(err);
                }
                fs.watchFile(opts.device, function (curr, prev) {
                  console.info("device status changed.");
                  p.apply(self);
                });
                return;
              }
              p.apply(self);
            });

            if (opts.frequency) {
              setTimeout(function () {
                grabber();
              }, 1000 * opts.frequency);
            }
          };

        grabber();
      };

      return self;
    }

    util.inherits(camera, events.EventEmitter);

    var mixin = function (source, destination) {

      if (typeof (source) == "object") {
        for ( var prop in source) {
          if ((typeof (source[prop]) == "object") && (source[prop] instanceof Array)) {
            if (destination[prop] === undefined) {
              destination[prop] = [];
            }
            for ( var index = 0; index < source[prop].length; index += 1) {
              if (typeof (source[prop][index]) == "object") {
                if (destination[prop][index] === undefined) {
                  destination[prop][index] = {};
                }
                destination[prop].push(mixin(source[prop][index], destination[prop][index]));
              } else {
                destination[prop].push(source[prop][index]);
              }
            }
          } else if (typeof (source[prop]) == "object") {
            if (destination[prop] === undefined) {
              destination[prop] = {};
            }
            mixin(source[prop], destination[prop]);
          } else {
            destination[prop] = source[prop];
          }
        }
      }

      return destination;
    };

    return {
      make_camera: function (options) {
        return new camera(options)
      }
    }

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