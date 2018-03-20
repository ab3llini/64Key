class FileShare extends Service {

	constructor(connection, context) {

		//Build the super class, ALWAYS!
		super(connection, context)

		this.connection = connection;

		/*---------------------------------------------------------------ROUTER SPOOF START

		//TEMPORARY
        this.connection = new WebSocket('ws://46.101.112.120:8080');

		// Log errors
		this.connection.onerror = function (error) {
		  console.log('WebSocket Error ' + error);
		};

		// Log messages from the server
		this.connection.onmessage = function (payload) {

		//ROUTER
		_self.onData(null, JSON.parse(payload.data).data);



		};

        //---------------------------------------------------------------ROUTER SPOOF END */

		this.context = context;


		/* Windows of 1MB */
		this.settings = {

			//The frame size in Bytes
			frameSize : 1000, //10KB
			//The frame window, expressed in number of frames
			windowSize :  10,

            //The timeout, expressed in ms, to wait for the ack in the Stop & Wait protocol
            timeout : 20000

		}

        this.stream = null;
        this.isStreaming = false;
        this.receivedFile = null;

	}

	/**
	* Prepare to share file with the desired host
	* @param {String} uid the uid of the host
	*/
	load(uid) {

		this.target = uid;

	  console.log("Loading fileshare with " + uid);

		//Load the interface
		this.context.load( "services/fileshare/html/fileshare.html", () => this.onInterfaceLoaded())

	}

	/**
	* Unloads the service from the context
	*/
	unload() {

		this.context.html('')

	}

	onInterfaceLoaded() {

        this.dropzone = document.getElementById('dropzone');

        this.progressPath = document.getElementById('dropzone-progress');
        this.dropzoneStatus = document.getElementById('dropzone-status');
        this.dropzoneTick = document.getElementById('dropzone-tick');

        //Bind events
        this.dropzone.addEventListener("dragover", this.handleDrag.bind(this))
        this.dropzone.addEventListener("dragleave", this.handleDragLeave.bind(this))
        this.dropzone.addEventListener("drop", this.handleDrop.bind(this))

	}


	handleDrop(evt) {

		evt.stopPropagation();
		evt.preventDefault();

		var _file = evt.dataTransfer.files[0];

		this.share(_file);

		this.handleDragLeave();

		this.progressPath.style.strokeDashoffset = 100;
		this.progressPath.classList.add("upload")
		this.dropzoneStatus.classList.add("upload")


	}

	handleDragLeave(evt) {

		this.progressPath.classList.remove("upload")
		this.dropzoneStatus.classList.remove("upload")
		this.dropzoneStatus.innerHTML = "Drop file here"

	}

	handleDrag(evt) {

		this.progressPath.classList.add("upload")
		this.dropzoneStatus.classList.add("upload")

		this.dropzoneStatus.innerHTML = "Release to load"

		evt.stopPropagation();
		evt.preventDefault();
		evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.

	}

	setProgress(percentage) {

		this.progressPath.style.strokeDashoffset = 100 - Math.round(percentage * 100);
		this.dropzoneStatus.innerHTML = Math.round(percentage * 100) + "%";

	}
	share(file) {

		this.stream = new Stream(this.sendDataCallback.bind(this), file, this.settings, this.setProgress.bind(this), this.onFileSent.bind(this));
		this.isStreaming = true;

	}

	/**
		* Method triggered when the service receives some data.
		* @param {Object} from The uid of the sender
		* @param {Object} data The parsed JSON data
		*/
	onData(from, data) {

		/*
		if (data.type != 'data') {
			console.log("PARSING >")
			console.log(data)
			console.log("<")
		}
		*/

		switch(data.type) {

			case 'begin-stream':

				if (!this.isStreaming) {

					//Accept a new file only if nobody else is sending us another file and we are not streaming
					/*To do so, send an ack
					if (window.prompt("Accept file '" + data.name + "' ?", "Ok")) {
                        this.sendAck({description: 'begin-stream'});

                        //Prepare a temporary file
                        this.receivedFile = new FileBuffer(data, this.sendAck.bind(this), this.setProgress.bind(this), this.onFileReceived.bind(this));
                    }
					*/
                    this.sendAck({description: 'begin-stream'});

                    //Prepare a temporary file
                    this.receivedFile = new FileBuffer(data, this.sendAck.bind(this), this.setProgress.bind(this), this.onFileReceived.bind(this));
				}

			break;
			case 'synch':

				if (this.receivedFile) {
                    this.receivedFile.synchronize(data.w_id, data.w_size);
                }

			break;
			case 'ack':

				this.stream.ackReceived(data.ack)

			break;
			case 'data':

				this.receivedFile.appendFrame(data.frame)

			break;

		}

	}

	onFileReceived() {

		this.receivedFile.download();

        this.confirmAndResetUI("File received", 3000);

	}

	onFileSent() {

		this.isStreaming = false;
		this.stream = null;

		this.confirmAndResetUI("File transferred", 3000);

	}

	confirmAndResetUI(message, timeout) {

        //UI Effects
        this.dropzoneStatus.style.top = '0px';

        this.dropzoneStatus.classList.remove("upload");
        this.progressPath.classList.remove("upload");

        this.progressPath.classList.add("done");
        this.dropzoneStatus.classList.add("done");

        window.setTimeout(function () {
            //Wait for status to reach 0px top margin
            document.getElementById('dropzone-tick').classList.remove("hidden")

        }, 500);


        this.dropzoneStatus.innerHTML = message;

        setTimeout(this.resetContext.bind(this), timeout);

	}

	resetContext() {

		this.handleDragLeave();

		//UI Effects
		this.dropzoneStatus.style.top = '-225px';

		document.getElementById('dropzone-tick').classList.add("hidden")

		let _self = this;

		window.setTimeout(function () {
			//Wait for status to reach 0px top margin

			_self.progressPath.classList.remove("done")
			_self.dropzoneStatus.classList.remove("done")

		}, 500);

	}


	sendAck(ack) {

		//console.log("Sending ack:" + ack.description)
		this.sendDataCallback({ type : 'ack', ack : ack })


	}

	sendDataCallback(data) {

		this.sendData(this.target,{ service : 'fileshare', data : data });

	}

}

class FileBuffer {

	constructor(data, ackCallback, progressCallback, doneCallback) {

		this.fname = data.name;
		this.mime = data.mime;
		this.size = data.size;

		this.ackCallback = ackCallback;
		this.setProgress = progressCallback;
		this.notifyFileReceived = doneCallback;

		this.windowFrameCounter = 0;
		this.lastConfirmedWindow = -1;
		this.ignoreWindow = false;

		this.bytesReceived = 0;


		let chunks = (Math.floor(data.size / data.frameSize) + (((data.size % data.frameSize) > 0) ? 1 : 0));

		console.log("chunks = " + chunks + " / size = " + data.size + " / frame size = " + data.frameSize)

		this.buffers = new Array(chunks);
		this.bufferOffset = data.windowSize;

		this.blob = null;

        this.received = false;

		console.log ("Preparing to receive '" + data.name + "' ("+data.size+" Byte)")

	}


	download() {

        var elem = window.document.createElement('a');
        elem.href = window.URL.createObjectURL(this.blob);
        elem.download = this.fname;
        document.body.appendChild(elem);
        elem.click();
        document.body.removeChild(elem);
        window.URL.revokeObjectURL(elem.href);

	}


	assemble() {

		console.log("Assembling " + this.bytesReceived + " bytes")

		this.blob = new Blob(this.buffers, {type: this.mime, endings : "transparent"});

		this.notifyFileReceived()


	}

	base64ToArrayBuffer(base64) {

    	var binary_string =  window.atob(base64);
		var len = binary_string.length;
		var bytes = new Uint8Array( len );
		for (var i = 0; i < len; i++)        {
        	bytes[i] = binary_string.charCodeAt(i);
    	}
		return bytes.buffer;
	}

	synchronize(windowId, windowSize) {

		//Ignore everything if this file has already been received.
		if (this.received) { return }

		this.windowFrameCounter = 0;

		if (this.lastConfirmedWindow == windowId - 1) {

			this.windowToBeConfirmed = windowId;

			this.windowSize = windowSize;
			this.ignoreWindow = false;

		}
		else {

			this.ignoreWindow = true;

            console.log("Detected duplicated incoming window")

		}

	}

	appendFrame(frame) {

        //Ignore everything if this file has already been received.
        if (this.received || this.ignoreWindow) { return }

        this.buffers[(this.windowToBeConfirmed * this.bufferOffset) + this.windowFrameCounter] = this.base64ToArrayBuffer(frame.b64);
		this.bytesReceived += frame.size;
        this.windowFrameCounter++;

		if (this.windowFrameCounter == this.windowSize) {

            this.lastConfirmedWindow = this.windowToBeConfirmed;

            this.ackCallback({
				description : 'synch',
				windowId : this.lastConfirmedWindow
			})

			this.setProgress(this.bytesReceived / this.size)

			console.log("Window received");

			if (this.bytesReceived == this.size) {

				this.received = true;
				this.assemble()

			}
			else {

				console.log("File not received yet: " + this.bytesReceived + " != " + this.size)

			}

		}

	}

}

class Stream {

	constructor(connectionPipe, file, settings, progressCallback, doneCallback) {

		var _self = this;

		this.file = file;

		this.send = connectionPipe;
		this.ack = null;
		this.running = true;

		this.maxTimeouts = 5;
		this.currTimeouts = 0;

		this.frameSize = settings.frameSize;
		this.windowSize = settings.windowSize;
		this.timeout = settings.timeout;

		//Number of frames with the predefined size
		this.n_frames = Math.floor(file.size / this.frameSize);

		//Size (in bytes) of the last frame
		this.lastFrameSize = file.size % this.frameSize;

		if (this.lastFrameSize > 0) {

			this.n_frames++;

		}

		this.currentFrame = 0;
		this.currentWindow = 0;
		this.setProgress = progressCallback;
		this.notifyFileSent = doneCallback;
		this.lastWindow = null;

		var _reader = new FileReader();

		//Setup handlers
		_reader.onload = (event) => {

			_self.buffer = event.target.result;

			_self.start()

			console.log("Stream ready : total bytes = "+ file.size+" total frames (1KB) = " + this.n_frames + ", last frame size (Bytes) = " + this.lastFrameSize)

		}

		//Read the file into an ArrayBuffer
		this.buffer = _reader.readAsArrayBuffer(this.file);

	}


	//Returns an array of base64-encoded frames
	getNextWindow() {

		var window = {

			id : this.currentWindow,
			w_size : 0,
			f_size : this.frameSize,
			bytes : 0,
			frames : []

		}

		//Stop when we sent all the frames.
		if (this.currentFrame >= this.n_frames) { return null }


		//Load n frames into the current window, where n = windowSize
		for (var i = 0; i < this.windowSize && (this.currentFrame + i) < this.n_frames; i++) {

			let startIndex, endIndex;

			if ((this.currentFrame + i) != (this.n_frames - 1)) {

				startIndex = (this.windowSize * this.frameSize * this.currentWindow) + (i * this.frameSize); //(Window offset) + (Frame offset)
				endIndex = startIndex + this.frameSize;

			}

			else {

				startIndex = this.buffer.byteLength - this.lastFrameSize; // -1 not to get out of range!
				endIndex = this.buffer.byteLength; //same here

			}

			let frameBytes = this.buffer.slice(startIndex, endIndex);
			let base64encoded = btoa(String.fromCharCode.apply(null, new Uint8Array(frameBytes)));
			let len = (endIndex - startIndex);

			let frame = {

				size : len,
				b64 : base64encoded

			}

			window.frames.push(frame);

			window.bytes += len;

		}

		window.w_size = window.frames.length

		return window;

	}


	//Until this method is triggered, sendNextWindow will keep on sending the same window
	confirmLastWindow () {

		this.currentFrame += this.lastWindow.frames.length;
		this.currentWindow++;

	}


	initializeStream() {

		var _self = this;

		//Inform that we are sending a new file

		this.sendAndWaitForAck({

			type : 'begin-stream',
		    size : _self.file.size,
		    name : _self.file.name,
		    mime : _self.file.type,
			frameSize : _self.frameSize,
			windowSize : _self.windowSize
		});

	}

	sendWindow(w) {

		let _self = this;


		let _synch = {

			type : 'synch',
		    w_id : w.id,
		    w_size : w.w_size,
		    bytes : w.bytes
		}

		_self.sendWithoutAck(_synch);

		w.frames.forEach(function(frame, index) {

			let frame_obj = {
				type : 'data',
			    id : index,
			    frame : frame
			};

			if (index == w.frames.length - 1) {

				//If it is the last frame, wait for the ack
				_self.sendAndWaitForAck(frame_obj);

			}
			else {

				_self.sendWithoutAck(frame_obj);

			}

		});

	}

	ackReceived(ack) {

		clearTimeout(this.ack);


		switch(ack.description) {

			case 'synch' :

				this.confirmLastWindow();

				let percentage = this.currentFrame / this.n_frames;

				this.setProgress(percentage);

				if (percentage == 1.0) {

					this.notifyFileSent();

				}

			break;

		}

		this.lastWindow = this.getNextWindow();

		if (this.lastWindow && this.lastWindow != null) {

			this.sendWindow(this.lastWindow);

		}

	}

	sendWithoutAck(payload) {

		this.send(payload);

	}

	sendAndWaitForAck(payload) {

		var _self = this;

		this.send(payload	);

		this.ack = setTimeout(function(){

			console.log("Ack not received for window #" + _self.currentWindow + ", resending window")

			if (_self.currTimeouts == _self.maxTimeouts) {

				console.log("Unable to transfer file")

			}
			else {

				_self.sendWindow(_self.getNextWindow());

				_self.currTimeouts++;

			}

		}, this.timeout);

	}

	start() {

		this.initializeStream();

	}

}
