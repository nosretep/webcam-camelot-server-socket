webcam-server-socket
============================

- Using Linux
- USB webcam check http://www.ideasonboard.org/uvc/ or http://elinux.org/RPi_USB_Webcams
- Make sure fswebcam is installed

```
VIDEO_DEVICES=/dev/video0,/dev/video1 WEBCAM_PORT=8889 node server.js
```

- Open browser
- View at your http://YOUR_IP:WEBCAM_PORT
