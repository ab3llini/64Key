/**
	* PingService.
	* This class is used to implement the service that make possible to ping other host in the mesh network.
	* Please note that this is an application-level ping, slower of course than the typical kernel one.
	* @extends Service
	* @namespace
	*/
class PingService extends Service {

	constructor(connection, context) {

		//Build the super class, ALWAYS!
		super(connection, context)

		this.host = null;
		this.sender = null;
		this.isRunning = false;

		this.settings = {

			delay : 1000,
			sequences : 10

		}
		this.sequence = {

			interval : null,
			number : 0

		}

	}

	/**
		* When the service is loaded, the ping starts immediately
		* @param uid The host to ping
		*/
	load(uid) {

		this.host = uid;

		if (this.isRunning) {

			//With proper unload we should never enter this, but to be extra safe..
			this.stop()

		}

		//Load the ping interface
		this.context.load( "services/ping/html/ping.html", () => this.onInterfaceLoaded())

	}

	/*
		* Stops the ping
		*/
	unload() {

		this.stop();
		this.clean();

	}

	/**
		* Method triggered when a ping response is received (might be a ping request or a pong).
		* @param {String} from The uid of the sender
		* @param {String} data The parsed JSON data
		*/
	onData(from, data) {

		switch(data.type) {

			case 'ping-request':
				this.sendData(from, {

					service : 'ping',
					data : {
						type: 'ping-response',
						sequence : data.sequence,
						timestamp : data.timestamp
					}

				})
			break;
			case 'ping-response':
				this.insertNewPongEntry(data.sequence, (new Date()).getMilliseconds() - new Date(data.timestamp).getMilliseconds())
			break;

		}

	}

	/**
	* Method triggered by the UI
	* @param {Object} button The button DOM element
	*/
	start(button) {

		this.sender = button;

		if (this.isRunning == false) {

			//Clean the view
			this.clean()

			//Fire the interval
			this.sequence.interval = setInterval(() => this.run(), this.settings.delay);

			//Update sender
			$(button).toggleClass('btn-success btn-danger');

			//Update value
			$(button).html('Stop')

			//Update status
			this.isRunning = true;


		}
		else {

			this.stop()

		}

	}

	/**
	 * Cleans the view from the old ping requests
	 */
	clean() {

		//Removes all the rows added
		for (var i = 0; i < this.sequence.number; i++) {

			$("#ping-table tr:last").remove()

		}

		//Reset sequence number here, because clean() requires it to determine the amount of rows added
		this.sequence.number = 0;

	}

	/**
	* Stops the ping clearing the timeinterval
	*/
	stop() {

		//Clear timeIntervals
		clearInterval(this.sequence.interval)

		//Reset running state
		this.isRunning = false;

		//Update sender
		$(this.sender).toggleClass('btn-danger btn-success');

		//Update value
		$(this.sender).html('Start')

	}

	/**
	 * Runs the ping and automatically stops it when the request limit has been reached */
	run() {

		if (this.sequence.number == this.settings.sequences) {

			//If we reached the maximum amount of icmp_echo_request stop the interval
			this.stop()

			return;

		}

		//Create the ping message
		let ping = {

			service : 'ping',
			data : {
				type: 'ping-request',
				sequence : this.sequence.number,
				timestamp : new Date()
			}

		}

		this.sendData(this.host, ping)

		//!!!Remember to increment the sequence number
		this.sequence.number++;

	}

	/**
	 * Inserts a new pong entry into the DOM table
	 * @param {Number} number The number of the ping request
	 * @param {Number} value The value (in ms) of the ping delay
	 */

	insertNewPongEntry(number, value) {

		$("#ping-table tr:last").after('<tr><td><small><span class="glyphicon glyphicon-ok" aria-hidden="true"></span></small> '+number+'</td><td><small><span class="glyphicon glyphicon-time" aria-hidden="true"></span></small> '+Math.round(value)+' ms</td></tr>')

	}

	/**
	 * Prepares the interface
	 */
	onInterfaceLoaded() {

		$("#ping-panel-header").html('<span class="glyphicon glyphicon-globe" aria-hidden="true"></span> Ping ' + this.connection.hostNameForUid(this.host))

	}



}
