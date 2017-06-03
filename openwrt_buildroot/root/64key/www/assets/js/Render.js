/**
	Provides static methods to accomplish custom renderings. Subclass it to implement your own ones in your custom services
	* @static
	* @memberof Controller

	*/
class Render {


	/**
		* Produces HTML for a bootstrap dialog box
		* @param {Object} dialogBox The dialog box object to render
		* @return {String} The dialog box HTML
		*/
	static dialogBox(dialogBox) {

		return '<div class="alert alert-'+dialogBox.type+'" role="alert"><strong>'+dialogBox.header+'</strong> '+dialogBox.body+'</div>';

	}

	/**
		* Provides HTML for the hosts list
		* @param {Object} hosts The hosts object
		* @return {String} The host list HTML
		*/
	static hosts(hosts) {

		var html = '';

		Object.keys(hosts).forEach(function(key,index) {

			let host = hosts[key];
			let uid = key;

			html += '<li><div class="host"><div class="name"><span class="glyphicon glyphicon-user" aria-hidden="true"></span>&nbsp;';
			html += '<strong>'+host.name+'</strong></div>';
			html += '<div class="services"><ul>';

			Object.keys(host.services).forEach(function(key,index) {

				html += '<li><span class="label label-success" uid="'+uid+'" service="'+key+'" onclick="controller.serviceClick(this)">'+host.services[key].name+'</span></li>';

			});

			html += '</ul></div></div></li>'

		});

		return html;

	}

}
