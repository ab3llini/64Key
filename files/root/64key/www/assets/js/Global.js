/**
	* @readonly
	* @enum {String}
	* Defines the websocket event names in a clean way
	* @memberof Controller
	*/
let WebSocketEvent = {

	/** On open */
	Open 	: 'open',
	/** On close */
	Close	: 'close',
	/** On message */
	Message : 'message'

}

/**
	* @readonly
	* @enum
	* Defines server information for the connection
	* @memberof Controller

	*/
let Server = {

	/**
		* The server address
		* @type {String}
		*/
	address : window.location.hostname,

	/**
		* The server port
		*@type {Number}
		*/
	port 	: 8081

}

/**
	* Defines some useful infromation about the protocol.
	* Full specification of the protocol is defined in a separate file as wiki
	* @memberof Controller

	*/
let Protocol = {

	/**
		* The data type of the frame
		*/
	DataType : {

		/** Data for the controller */
		Self 	: 'self-data',
		/** Data containing the discovered hosts */
		Hosts 	: 'hosts-list',
		/** Data that will be forwarded to a service */
		DataIn	: 'service-data-in',
		/** Data containing some log */
		Log 	: 'log',

	}

}
/**
	* @readonly
	* @enum {String}
	* List of installed services
	*/
let AvailableServices = {

	Chat : 'chat',
	Ping : 'ping',
	Fileshare : 'fileshare'

}

/**
	* @readonly
	* @enum {Object}
	* List pre-defined dialog boxes
	* @memberof Controller
	*/
let DialogBox = {

	/** You are now connected. Select a service on the sidebar to load it. */
	Connected : {

		type	: 'success',
		header 	: 'Connected',
		body	: 'You are now connected. Select a service on the sidebar to load it.'

	},
	/** You are disconnected from the server. */
	Disconnected : {

		type	: 'warning',
		header 	: 'Disconnected',
		body	: 'You are disconnected from the server.'

	},
	/** The controller can\'t determine the meaning of the data type received */
	DataTypeUnknown : {

		type	: 'danger',
		header 	: 'Unknown data received',
		body	: 'The controller can\'t determine the meaning of the data type received'

	},
	/** The controller can\'t determine the target service of the data received */
	ServiceDataUnknown : {

		type	: 'danger',
		header 	: 'Data for unknown service received',
		body	: 'The controller can\'t determine the target service of the data received'

	},
	/** There is no such service available on this machine */
	UnknownService : {

		type	: 'warning',
		header 	: 'Unknown service',
		body	: 'There is no such service available on this machine'

	}
}
