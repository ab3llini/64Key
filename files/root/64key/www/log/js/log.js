class Log {
	
	constructor(context) {
		
		this.context = context;
		this.logs = []
		
	}

	load(uid) {
		
		//Load the ping interface
		this.context.load( "log/html/log.html", () => this.onLogLoaded())
		
	}
	
	/*
		* @desc Every service must overwrite this method to unload his content when requested by the controller.
		*/
	unload() {
		
		this.context.html('')
	}
	
	/*
		* @desc Every service should overwrite this method
		* @from The uid of the sender
		* @param data The parsed JSON data
		*/
	onData(data) {
		
		this.logs.push(data)
		
		this.newLogEntry(data)
		
	}
	
	newLogEntry(log) {
		
		$("#log-table").append('<tr><td><span class="label label-'+log.level+'">'+log.level+'</span></td><td><small><span class="glyphicon glyphicon-time" aria-hidden="true"></span> '+new Date()+'</small></td><td><small>'+log.text+'</small></td></tr>')
		
	}
	
	onLogLoaded() {
		
		//Load all the messages
		this.logs.forEach((log) => this.newLogEntry(log))
		
	}
	
}
