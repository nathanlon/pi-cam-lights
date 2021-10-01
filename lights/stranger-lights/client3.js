var WebSocketClient = require('websocket').client;
//var client = new WebSocketClient();

var wsApi = 'ws://192.168.1.27:8000/greeting'

initialise(); 

function initialise() { 
	runTest();
}

function update() {
	
	if(socket.connected) { 

	}
}

async function runTest() {
    console.log("connecting");
    
    const client = new WebSocketClient();


    //client.on('connect', connection => connect.resolve(connection))
    //client.on('connectFailed', err => connect.reject(err))

	client.on('connect', connection => {

		connection.on('message', message => {

			var object = JSON.parse(message.utf8Data);
			//console.dir(message, {depth: null, colors: true})

			console.log("start " + object.greeting.s + "width " + object.greeting.w);

		});


	});

    client.connect(wsApi)
}



