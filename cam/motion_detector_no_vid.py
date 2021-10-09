from picamera.array import PiRGBArray
from picamera import PiCamera
import datetime
import imutils
import time
import cv2
import json
import eventlet
from eventlet import wsgi, websocket

isInitialised = False
camera = PiCamera()
screenWidth = 320
camera.resolution = (screenWidth, 240)
camera.framerate = 10
rawCapture = PiRGBArray(camera)
lightCount = 50
pixelsPerLight = round(screenWidth / lightCount)

highResStream = camera.capture_continuous(rawCapture, format="bgr", use_video_port=True)

print("done warming up")

@websocket.WebSocketWSGI
def greeting_handle(ws):
	firstFrame = None
	print("Connected")

	time.sleep(2.0)
	count = 1

	while True:
		count = count + 1
		if count > 100:
			count = 1
		else:
			continue

		hrs = next(highResStream)
		frame = hrs.array
		rawCapture.truncate(0)
		rawCapture.seek(0)
		text = "Unoccupied"
		if frame is None:
			break
		gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
		gray = cv2.GaussianBlur(gray, (21,21), 0)

		if firstFrame is None:
			firstFrame = gray
			continue

		frameDelta = cv2.absdiff(firstFrame, gray)
		thresh = cv2.threshold(frameDelta, 25, 255, cv2.THRESH_BINARY)[1]

		thresh = cv2.dilate(thresh, None, iterations=2)
		cnts = cv2.findContours(thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
		cnts = imutils.grab_contours(cnts)

		count = 1
		for c in cnts:
			if cv2.contourArea(c) < 500:
				continue

			(x, y, w, h) = cv2.boundingRect(c)
			startLight = round(x/pixelsPerLight)
			widthLights = round(w/pixelsPerLight)
			print("x: " + str(startLight) + ", w: " + str(widthLights))
			ws.send(json.dumps({ 'greeting': {'s': startLight, 'w': str(widthLights) }}))

		key = cv2.waitKey(1) & 0xFF

		if key == ord("q"):
			break


def site(env, start_response):
    if env['PATH_INFO'] == '/greeting':
        return greeting_handle(env, start_response)
    else:
        start_response('200 OK', [('Content-Type', 'text/plain')])
        return ['Eventlet running...']


def run_start():
	listener = eventlet.listen(('0.0.0.0', 8000))
	wsgi.server(listener, site)

if __name__ == '__main__':
    run_start()
