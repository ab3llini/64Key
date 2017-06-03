/**
	* Provides a standard interface for any service.
	* If you want to make your own service you must extend this class.
	* Specifically you should implement load(), unload(), onData(), but NOT sendData()
	* All this methods will be used by the controller
	* @memberof Controller
	*/
class Service {

	/**
		* The constructor.
		* @param {Connection} connection The connection used to send data to remote hosts
		* @param {Object} context The DOM context to render data in
		*/
	constructor(connection, context) {

		//Every service will have must have its own connection object & context
		this.connection = connection;
		this.context = context

	}

	/**
		* Every service must overwrite this method to load his content when requested by the controller.
		* @param {String} uid The host to interact with through the service
		*/
	load(uid) {


	}

	/**
		* Every service must overwrite this method to unload his content when requested by the controller.
		*/
	unload() {


	}

	/**
		* Every service should overwrite this method to handle incoming data.
		* @param {String} from The uid of the sender.
		*
		* @param {Object} data The parsed JSON data.
		*/
	onData(from, data) {


	}

	/**
		* No service should overwrite this method but call it to send data.
		* @param {String} to The uid of the target
		* @param {Object} data The object to be stringyfied to JSON. Note that you have to provide only the service and his relative data
		*/
	sendData(to, data) {

		//Add some valuable infromation, no matter which protocol
		data.type = 'service-data-out';
		data.to = to;

		try {

			//Send the object
			this.connection.ws.send(JSON.stringify(data))

		}
		catch(e) {

			alert("Exception raised while trying to send service data:" + e.message)

		}



	}

}
