/**
	* Represents a chat object.
	* The chat service will have multiple instances of chats, one for each host.
	* @memberof ChatService
	*/
class Chat {

	/**
		* @param {String} uid The uid of the user
		* @param {String} name The name of the user
		* @param {String} context_id The DOM id of the chat HTML container
		*/
	constructor(uid, name, context_id) {

		this.uid = uid;
		this.name = name;
		this.messages = [];
		this.context_id = context_id;
		this.autoscroll = true;
		this.messageIncrementalUID = 0;
		this.settings = {

			messagesAmountLimit : 50

		}

	}

	/**
		* Gets the JQuery contex of the chat from the DOM id
		* @return {Object} The Jquery object
		*/
	context() {

		let ctx = $(document.getElementById(this.context_id));

		return ((ctx.length) ? ctx : null);

	}

	/**
		* Event called when a message is received
		* @param {Object} message The message
		*/
	onMessageReceive(message) {

		this.storeMessageObject(message, MessageType.Received);

	}

	/**
		* Event called when a message is sent
		* @param {Object} message The message
		*/
	onMessageSend(message) {

		this.storeMessageObject(message, MessageType.Sent);

	}

	/**
		* Stores the message into an array
		* @param {Object} message The message
		* @param {MessageType} the type of the message
		*/
	storeMessageObject(message, msgType) {

		let obj = {
			id : this.messageIncrementalUID,
			type: msgType,
			timestamp: new Date(),
			value: message
		}

		//Increment message UID but keep it between [0, amountLimit-1]


		if (this.messageIncrementalUID++ == (this.settings.messagesAmountLimit - 1)) {

			this.messageIncrementalUID = 0;

		}

		//Add the new object to the messages
		this.messages.push(obj);

		//Check whether the messages amount is over the limit
		//Implement this check for memory performance boost
		if (this.messages.length > this.settings.messagesAmountLimit) {

			//Remove the DOM element
			$(document.getElementById('chat-' + this.uid + '-' + this.messages[0].id)).remove()

						//Remove the first object
			this.messages.splice(0, 1)

		}

		this.appendMessageToContainer(obj);

	}

	/** Removes all the messages in the array */
	deleteAllMessages() {

		this.messages = [];
		this.cleanMessagesInContainer();

	}

	/** Adds a message to the HTML container */
	appendMessageToContainer(message) {

		let ctx = this.context();

		//If the chat context is visible:
		if (ctx) {

			ctx.append(ChatRender.message(message, this))

			//If the message was sent then we want to scroll to the bottom
			if (this.autoscroll == true) {

				this.scrollToBottom()

			}
		}

	}

	/** Detects user scroll into the chat and stops/reactivates auto scroll */
	onScroll(container) {


		let ctx = this.context();

		let scroll = ctx.parent().scrollTop();
		let height = ctx.parent()[0].scrollHeight - ctx.parent()[0].clientHeight

		//The user scrolled inside the chat:
		//If he scrolled up than we need to stop autoscrolling
		//If he scrolled to the bottom we need to enable it
		if (scroll < height) {

			this.autoscroll = false;

		}
		else {

			this.autoscroll = true
		}


	}

	/** Scrolls the chat to the bottom */
	scrollToBottom() {

		let ctx = this.context()

		ctx.parent().scrollTop(ctx.parent()[0].scrollHeight);

	}

	/** Removes all the messages in the chat HTML container */
	cleanMessagesInContainer() {

		this.context().html('')

	}

}
