/**
	* Class used to perform custom rendering for chat
	* Da commentare
	* @extends Render
	* @memberof ChatService
	*/
class ChatRender extends Render {

	/**
	* Renders HTML for the chat
	* @param {String} uid the uid of the host
	* @param {ChatService} chatsv the chat service reference
	* @return {String} the html
	*/
	static chat(chat, chatsv) {

		var html = '<div class="panel panel-default chat-panel">\n';
		html += '<div class="panel-heading">\n<h4><span class="glyphicon glyphicon-user" aria-hidden="true"></span> '+chat.name+'</h4>\n</div>\n';
		html += '<div class="panel-body chat-content" onscroll="controller.services.chat.activeChat.onScroll(this)">\n'
		html += '<ul class="chat" id="chat-'+chat.uid+'">\n';

		chat.messages.forEach(function(message) {

			html += ChatRender.message(message, chat)

		})

		html += '</ul></div>\n'
		html += '<div class="panel-footer"><div class="input-group">\n';
		html += '<input type="text" class="form-control" placeholder="Type a message.." id="'+chatsv.identifiers.textField+'" onkeyup="controller.services.chat.onUserInteraction(event)">\n';
		html += '<span class="input-group-btn"><button class="btn btn-default" type="button" id="chatSendButton" onclick="controller.services.chat.onUserInteraction()">Send&nbsp;\n';
		html += '<span class="glyphicon glyphicon-send"></span></button></span>\n';
		html += '</div></div></div>\n';

		return html;

	}
	/**
	* Renders HTML for a chat message
	* @param {Object} message the message to render
	* @param {Chat} chat the chat the message belongs to
	* @return {String} the html
	*/
	static message(message, chat) {

		var html = '<li id="chat-'+chat.uid+'-'+message.id+'">\n'

		if (message.type == 'received') {


			html += '<div class="message-container received pull-left">\n'

		}
		else {

			html += '<div class="message-container sent pull-right">\n'

		}


		html += '<div class="message-header text-muted"><small><span class="glyphicon glyphicon-time"></span>&nbsp;';
		html += message.timestamp.getHours()+':'+ (message.timestamp.getMinutes() < 10 ? '0':'') + message.timestamp.getMinutes()+'</small></div>\n'
		html += '<div class="message-body">'+message.value+'</div>\n</div></li>\n'

		return html;

	}

}
