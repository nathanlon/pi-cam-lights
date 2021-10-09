from picamera.array import PiRGBArray
from picamera import PiCamera
import datetime
import imutils
import time
import cv2
import json
import eventlet
from eventlet import wsgi, websocket

print("done warming up test")

@websocket.WebSocketWSGI
def greeting_handle(ws):
	firstFrame = None
	print("Connected Test")

	time.sleep(2.0)

	lightCount = 50
	startLight = 1
	widthLights = 1

	while True:
		startLight = startLight + 1
		widthLights = widthLights + 1
		print("x: " + str(startLight) + ", w: " + str(widthLights))
		ws.send(json.dumps({ 'greeting': {'s': startLight, 'w': str(widthLights) }}))
		time.sleep(1)
		if startLight > lightCount:
			startLight = 1
			widthLights = 1


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
