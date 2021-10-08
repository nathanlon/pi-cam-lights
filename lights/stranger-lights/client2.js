var neopixels = require('rpi-ws281x-native');
var Colour = require('color');
var isOnline = require('is-online');
var exec = require('child_process').exec;

var WebSocketClient = require('websocket').client;

const wsApi = 'ws://192.168.1.27:8000/greeting';

const colours = {
    white : {h:20, s:80, l:80},
    blue : {h:185, s:100, l:50},
    red : {h:350, s:80, l:50},
    green : {h:160, s:90, l:50},
    yellow : {h:35, s:100, l:60},
};

var NUM_LEDS = 50,
	pixelData = new Uint32Array(NUM_LEDS),
	pixelDataProcessed = new Uint32Array(NUM_LEDS);
	
neopixels.init(NUM_LEDS);
neopixels.render(pixelData);

var lastMessageTime = 0; 
var socket;
var letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"; 
var lightIndex = {
	A : 42, 
	B : 43, 
	C : 44, 
	D : 45, 
	E : 46, 
	F : 47, 
	G : 48, 
	H : 49, 
	I : 40, 
	J : 39, 
	K : 38, 
	L : 37, 
	M : 36, 
	N : 35, 
	O : 34, 
	P : 33, 
	Q : 32, 
	R : 22,
	S : 23,
	T : 24,
	U : 25,
	V : 26,
	W : 27,
	X : 28,
	Y : 29,
	Z : 30
};

var lightColours = [ 
    'white',    // A
    'blue',     // B
    'red',      // C
    'green',    // D
    'blue',     // E
    'yellow',   // F
    'red',      // G
    'green',    // H
    'green',    // I
    'red',      // J
    'blue',     // K
    'green',    // L
    'yellow',   // M
    'red',      // N
    'red',      // O
    'green',    // P
    'red',      // Q
    'green',    // R
    'white',    // S
    'yellow',   // T
    'blue',     // U
    'red',      // V
    'blue',     // W
    'yellow',   // X
    'red',      // Y
    'red',      // Z
    ];

var lightColoursByIndex = []; 

for(var i = 0; i<NUM_LEDS; i++) { 
	var c = colours[lightColours[i%lightColours.length]];
	lightColoursByIndex.push(c); 
}
for(var i = 0; i<letters.length; i++) { 
	var index = lightIndex[letters[i]]; 
	lightColoursByIndex[index] = colours[lightColours[i]]; 
}

var lights = []; 

for (var i = 0; i<NUM_LEDS; i++) { 
	lights.push(new Light(lightColoursByIndex[i]));
}

var dimmed = true; 
var lightsChanged = true; 
var internetConnection = false; 
var currentSenderName = ""; 

initialise(); 

function initialise() { 
	doRainbowStrobe();
	runTest();
}

// // ---- animation-loop

// function update() {
	
// 	if(!socket.connected) { 
// 		var hue = 135; 
// 		if(!internetConnection) hue = 0; 
// 		for(var i = 0; i<lights.length; i++) { 
// 			if((i==0) || (i==lights.length-1)) {
// 				pixelData[i] = Colour().hsl(hue,100,(Math.sin(Date.now()*0.01)*0.5+0.5)*50).rgbNumber(); 
// 			} else { 
// 				pixelData[i] = 0;	
// 			}
// 		}
// 		updatePixels();
// 		lightsChanged = true; 
// 		dimmed = true; 
// 	} else { 

// 		var flickerLight = Math.floor(Math.random()*lights.length*100); 
		
		
// 		for(var i = 0; i<lights.length; i++) { 
// 			var light=lights[i];
// 			if(dimmed && (flickerLight==i)) light.startFlicker(0.5);
// 			light.update(); 
// 			if(light.changed) {
// 				pixelData[i] = lights[i].getColour(); 
// 				lightsChanged = true; 
// 			}
// 		}
// 		if(lightsChanged) {
// 			updatePixels(); 
// 			lightsChanged = false; 
// 		}
// 	}
// }

async function runTest() {
    console.log("connecting");
    
    const client = new WebSocketClient();

    client.on('connect', connection => {
        connection.on('message', message => {
			var object = JSON.parse(message.utf8Data);
			//console.dir(message, {depth: null, colors: true})

			console.log("start " + object.greeting.s + "width " + object.greeting.w);

			var flickerLight = object.greeting.s;
			var width = object.greeting.w;

			//var flickerLight = Math.floor(Math.random()*lights.length*100); 
		
		
			for(var i = 0; i<lights.length; i++) { 
				var light=lights[i];
				if(dimmed && (flickerLight<=i) && (flickerLight+width>=i)) {
					light.turnLightOn();
				} else {
					light.turnLightOff();
				}
				//light.update(); 
				if(light.changed) {
					pixelData[i] = lights[i].getColour(); 
					lightsChanged = true; 
				}
			}
			if(lightsChanged) {
				updatePixels(); 
				lightsChanged = false; 
			}
        });
    });
        
    client.connect(wsApi)
}


// function initSocketConnection() { 
// 	console.log("initting socket connection");
// 	socket.on('connect', function(){
// 		console.log("connected!");
// 		//socket.emit('register', {type:'receiver', room:room}); 
// 		//showMessage('join room '+room); 
	
	
// 	});


// 	socket.on('registered', function(data) { 
// 			console.log('registered', data); 
// 			console.log("Connected! Your id is "+data.name+" ");
// 	});

// 	socket.on('motion', function(data){
// 		console.log('letter', data);
		
// 		lights[data.light].turnLightOn(); 
// 		//else lights[pixelnum].turnLightOff(); 

// 		lastMessageTime = Date.now();

// 	});
// 	socket.on('resetletters', function(){
// 		console.log('resetlights');

// 		for(var i = 0; i<lights.length; i++) { 
// 			lights[i].turnLightOff(); 
// 			lights[i].startFlicker(); 
// 		} 

// 		lastMessageTime = Date.now();

// 	});
	
// 	socket.on('status', function(data) { 
// 		if(data.currentControllerName=="") dimmed = true; 
// 		else dimmed = false; 
// 	});

// 	socket.on('disconnect', function(){
	
// 	});
	
// 	socket.on('reboot', function() { 
// 		console.log("REBOOT!"); 
// 		execute('/sbin/reboot', function(callback){
// 	    	console.log(callback);
// 		});
// 	});
	
// }


function updatePixels() { 
	for(var i = 0; i<NUM_LEDS; i++) { 
		var pixel = pixelData[i]; 
		if(pixel==0) {
			pixelDataProcessed[i] = 0; 
		} else { 
			var g = pixel>>16; 
			var r = (pixel>>8) & 0xff; 
			var b = pixel & 0xff; 
			pixelDataProcessed[i] =  (r << 16) + (g  << 8) + b ; 
		}
	}
	neopixels.render(pixelDataProcessed);
}



function Light( colour) { 
	
	this.colour = colour; 
	var lightOn = false; 
	this.brightness = 0; 
	this.changed = true; 
	var turnOnTime = 0; 
	var turnOffDelay = 0;
	var fadeSpeed = Math.random()*0.6+0.03; 
	var flickerSpeed = Math.random()*2+2;
	var flickerMinBrightness = 0;
	var flickerCountdown = 0; 
	this.update = function() { 
	
		var newBrightness = this.brightness; 
		
		if (newBrightness<0.001) newBrightness = 0;
		
		if(flickerCountdown>0) { 
			flickerCountdown--; 
			
			var target = (flickerCountdown%6<flickerSpeed)?0.5:flickerMinBrightness;
			newBrightness+=((target-newBrightness))*0.8;

		} else if(dimmed){ 
			newBrightness+=((0.5-newBrightness))*fadeSpeed; 
			if(Math.abs(0.5-newBrightness)<0.01) newBrightness = 0.5; 	
		} else if(lightOn) { 
			newBrightness+=((1-newBrightness))*0.5; 
		} else { 
			if(turnOffDelay>0) {
				turnOffDelay--; 
				newBrightness+=((1-newBrightness))*0.85; 
			} else { 
				newBrightness*=0.7;
			}
		}
		
		this.changed = this.brightness!=newBrightness; 
		this.brightness=newBrightness; 
	}
	
	this.turnLightOn = function() { 
		if(!lightOn) {
			lightOn = true; 
			this.brightness = 1.5; //may comment out
			turnOnTime = Date.now();
			this.changed = true;
		} 
	}
	this.turnLightOff =function() { 
		if(lightOn) { 
			lightOn = false; 
			this.brightness = 0;
			// var framessinceturnon = Math.floor((Date.now()-turnOnTime)/16); // 16 mils per frame
			// if(framessinceturnon<3) { 
			// 	turnOffDelay = 3; 
			// }
			this.changed = true;
		}
	}
	
	this.startFlicker = function(strength) { 
		strength = (typeof strength !== 'undefined') ? strength : 1; // 1 is full strength
		flickerCountdown = 12; 
		flickerMinBrightness = 0.5-(strength/2); 
	}
	
	this.getColour = function() { 
		if(this.brightness <0.001) return 0; 
		else return Colour().hsl(colour.h, colour.s, colour.l * this.brightness).rgbNumber(); 
	}
	
}

function doRainbowStrobe(){ 

	for(var loop=0; loop<360*3; loop+=10) { 
		for(var i = 0; i<NUM_LEDS; i++) {
			//console.log(loop, i); 
			var position = (i*10)+loop; 
			var b;
			if(position<360*2) 
				b = map(position, 360, 360*2, 0,1, true);  
			else
				b = map(position, 360*2, 360*3, 1,0, true);
				  
			pixelData[i] = Colour().hsl(position%360, 100,50*b).rgbNumber(); 
			
		}
		updatePixels();
	}
	
	
}

function map(value, min1, max1, min2, max2, clampResult) { 
	var returnvalue = ((value-min1) / (max1 - min1) * (max2-min2)) + min2; 
	if(clampResult) return clamp(returnvalue, min2, max2); 
	else return returnvalue; 
};

function clamp(value, min, max) { 
	if(max<min) { 
		var temp = min; 
		min = max; 
		max = temp; 
	}
	return Math.max(min, Math.min(value, max)); 
};
function showMessage(message) { 
	console.log(message);
}


process.stdin.resume();//so the program will not close instantly

function exitHandler(options, err) {
	neopixels.reset();
    if (err) console.log(err.stack);
    if (options.exit) process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));


function execute(command, callback){
    exec(command, function(error, stdout, stderr){ callback(stdout); });
}


