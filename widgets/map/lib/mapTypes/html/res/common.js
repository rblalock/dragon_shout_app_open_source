function AppController() {
	// Standard reference for closures
	var that = this;
	/**
	 * Sets the map image in the html
	 * @param {String} _image
	 * @param {Number} _width
	 * @param {Number} _height
	 */
	this.setMapImage = function(_image, _width, _height) {
		Ti.API.debug( "Applying image: " + _image );
		var mapEl = document.getElementById("Map");
		mapEl.src = "../../../images/maps/" + _image;
		mapEl.width = _width;
		mapEl.height = _height;
    };

	// test
	var mapEl = document.getElementById("Map");
	mapEl.addEventListener("click", function(e) {
		console.log( e );
//		Ti.App.fireEvent("handleMarkerTouch", {
//			data: e
//		});
	});
}