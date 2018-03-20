
/**
	* The GUI Controller.
	* It handles user interaction with the various services.
	* More specifically it provides an easy navigation system between the services.
	* When initialized, it establishes a connection with the Python Router via a WebSocket.
	* Since then every data frame received gets parsed and forwarded to the proper service instance.
	* @namespace
	*/
class Controller {

	/**
		* Controller contructor.
		* Receives pointers to DOM objects in the view in order to know where to perform UI updates on.
		* Every service implemented must be initialized here with a reference to it
		* @param {Object} hostsCtx The JQUERY object container for the hosts
		* @param {Object} servicesCtx The JQUERY object container for the services
		*/
	constructor(hostsCtx, servicesCtx) {

		let _self = this;

		//Connection instance
		this.connection = new Connection(Server.address, Server.port);

		//Server log
		this.log = new Log(servicesCtx)

		//Hosts
		this.hostsCtx = hostsCtx

		//Services on this machine
		this.services = {

			running 	: null,
			context 	: servicesCtx,
			chat 		: new ChatService(this.connection, servicesCtx),
			ping 		: new PingService(this.connection, servicesCtx),
			fileshare : new FileShare(this.connection, servicesCtx)

		}


		//Remember the label that activated the last service in order to change its color
		this.selectedServiceLabel = null;

		this.bindConnectionEvents()

	}

	/**
		*  Binds connection websocekt events to the controller handlers
		*/
	bindConnectionEvents() {


		this.connection.ws.addEventListener(WebSocketEvent.Open, () => {

			this.services.context.html(Render.dialogBox(DialogBox.Connected))

		});

		this.connection.ws.addEventListener(WebSocketEvent.Close, () => {

			this.services.context.html(Render.dialogBox(DialogBox.Disconnected))

		});

		this.connection.ws.addEventListener(WebSocketEvent.Message, (event) => this.parseConnectionFrame(JSON.parse(event.data)));

	}

	/**
		* Parses the frames received via the websocket.
		* This method routes the parsed data to the right srervice.
		* If new services will be later developed they must be properly implemented here.
		* @param {Object} frame The frame object decoded from JSON.
		*/
	parseConnectionFrame(frame) {

		console.log(frame)

		//Begin by parsing the frame data type
		switch(frame.type) {

			case Protocol.DataType.Self:

				//Update our current data or do whatever we need

			break;

			case Protocol.DataType.Hosts:

				//We have been given the hosts list
				//Let's update the connection hosts holder
				this.connection.setHosts(frame["hosts"]);


				//Call a static method to render them in the right DOM element.
				this.hostsCtx.html(Render.hosts(frame["hosts"]))

			break;

			case Protocol.DataType.Log:

				//Some data for the chat service.
				this.log.onData(frame.data)

			break;

			case Protocol.DataType.DataIn:

				//The frame contains some valuable data for a specific service
				switch(frame.service) {

					case AvailableServices.Chat:

						//Some data for the chat service.
						this.services.chat.onData(frame.from, frame.data)
						break;

					case AvailableServices.Ping:

						//Some data for the ping service.
						this.services.ping.onData(frame.from, frame.data)
						break;

					case AvailableServices.Fileshare:

						//Some data for the ping service.
						this.services.fileshare.onData(frame.from, frame.data)
						break;

					default:

						this.services.context.html(Render.dialogBox(DialogBox.ServiceDataUnknown))

				}

				break;

			default :
				this.services.context.html(Render.dialogBox(DialogBox.DataTypeUnknown))
				break;


		}

	}

	/**
		* Loads a service in the right context.
		* This method is usually fired by a chain of events that originate from the UI interaction.
		* When attempting to load a new service, remember first to unload the active one.
		* @param {Object} sender The HTML label inside the hosts list
		* @param {String} uid The target UID to interact with, With proper server handling could even be a broadcast host
		* @param {String} service The service identifier used to load the service
		*/
	startService(sender, uid, service) {

		//Unload currently active service first!
		if(this.services.running != null) {

			this.services.running.unload();

		}

		switch(service) {

			case AvailableServices.Chat:

				//Load chat service
				this.services.chat.load(uid);

				//Register the service as running
				this.services.running = this.services.chat;

			break;

			case AvailableServices.Ping:

				//Load ping service
				this.services.ping.load(uid);

				//Register the service as running
				this.services.running = this.services.ping;

			break;

			case AvailableServices.Fileshare:

				//Load ping service
				this.services.fileshare.load(uid);

				//Register the service as running
				this.services.running = this.services.fileshare;

			break;

			default:

				this.services.context.html(Render.dialogBox(DialogBox.UnknownService))
				break;
		}

		//Update last label and set it to active
		this.updateLastServiceSender(sender);

	}

	/**
		* Handles DOM clicks to load services.
		* This method is injected into an onclick attribute in the index DOM, 'this' is the argument.
		* @param {Object} object The object that was clicked (usually a label)
		*/
	serviceClick(object) {

		this.startService(object, $(object).attr("uid"), $(object).attr("service"))

	}

	/**
		* Method triggered whenever the user clicks onto a service in the sidebar to load it
		* To give some feedback, we change the background color but also remember the selected label.
		* This way the next time a service is loaded we will revert the previous sender bg
		* @param {Object} label The label
		*/
	updateLastServiceSender(sender) {

		if (this.selectedServiceLabel != null) {

			$(this.selectedServiceLabel).toggleClass('label-primary label-success');

		}

		this.selectedServiceLabel = sender;

		$(this.selectedServiceLabel).toggleClass('label-success label-primary');

	}


}

/** Create an instance of the controller */
let controller = new Controller($("#host-container"), $("#service-container"))
