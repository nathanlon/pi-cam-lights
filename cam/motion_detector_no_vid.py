from picamera.array import PiRGBArray
from picamera import PiCamera
import datetime
import imutils
import time
import cv2
import json
import eventlet
from eventlet import wsgi, websocket

# # create a Socket.IO server
# sio = socketio.Server()

# # wrap with a WSGI application
# app = socketio.WSGIApp(sio)

# @sio.event
# def connect(sid, environ, auth):
#     print('connect ', sid)

# @sio.event
# def disconnect(sid):
#     print('disconnect ', sid)
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

	while True:
		# message = ws.wait()
		# if message is None: break

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

		for c in cnts:
			if cv2.contourArea(c) < 500:
				continue

			(x, y, w, h) = cv2.boundingRect(c)
			startLight = round(x/pixelsPerLight)
			widthLights = round(w/pixelsPerLight)
			print("x: " + str(startLight) + ", w: " + str(widthLights))
			# sio.emit('motion', {'light': startLight, 'w': str(widthLights)})
			ws.send(json.dumps({ 'greeting': {'s': startLight, 'w': str(widthLights) }}))
			
			# cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
			text = "Occupied"

		# cv2.putText(frame, "Room Status: {}".format(text), (10, 20),
		#	cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)

		# cv2.imshow("Security Feed", frame)
		# cv2.imshow("Thresh", thresh)
		# cv2.imshow("Frame Delta", frameDelta)
		key = cv2.waitKey(1) & 0xFF

		if key == ord("q"):
			break

	startLight = 1
	widthLights = 1

	while True:
		startLight = startLight + 1
		widthLights = widthLights + 1
		print("x: " + str(startLight) + ", w: " + str(widthLights))
		ws.send(json.dumps({ 'greeting': {'s': startLight, 'w': str(widthLights) }}))
		time.sleep(1)



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
