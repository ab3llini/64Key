/**
	This class provides WebSocket functionality
	* @memberof Controller
	*/

class Connection {

	/**
		* Prepares the instance and initializes a websocket connection toward the server
		* The websocket events are dinamically binded in the controller
		* @param {String} host The target host
		* @param {String} port The target port
		*/
	constructor(host, port) {

		this.host = host;
		this.port = port;
		this.hosts = {}

		this.ws = new WebSocket('ws://'+this.host+':'+this.port+'/');

	}

	/**
		* Updates the current discovered hosts
		* @param {Object} hosts The hosts object
		*/
	setHosts(hosts) {

		this.hosts = hosts;

	}

	/**
		* Resolves a UID into a name
		* @param {String} uid The UID to resolve
		* @return {String} The name
		*/
	hostNameForUid(uid) {

		return this.hosts[uid].name;

	}

}
