/**
 * The html Map type app controller
 */

/**
 * App singleton
 * @type {Object}
 */
var APP = require("core");

/**
 * Handle the marker layer touch event
 * @param {Object} _event Standard TiUI event callback
 */
$.handleMarkerTouch = function(_event) {
	Ti.API.debug( JSON.stringify(_event) );

//	App.Map.addMarker({
//		x: _event.x,
//		y: _event.y
//	});
};

// Apply the touch events
Ti.App.addEventListener("handleMarkerTouch", $.handleMarkerTouch);