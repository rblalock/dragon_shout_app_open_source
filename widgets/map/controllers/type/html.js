/**
 * HTML Map Type Base Controller
 */

/**
 * Initialization parameters
 * @type {Object}
 */
$.params = null;
/**
 * Current map image string
 * @type {Object}
 */
$.currentMap = {};
/**
 * Initialize this widget
 * @param {Object} _params
 */
$.init = function(_params) {
	// Assign args to the widget level param object
	$.params = _params;

	// If the map should be full screen (e.g. For apps with no Message Center)
	if($.params.fullScreen) {
		$.map.height = "100%";
	}

	// Set the current map image
	$.currentMap = $.params.config.maps[$.params.config.defaultMap];

	// Set the url for the html type
	$.map.url = WPATH("mapTypes/html/default.html");
	$.map.evalJS("(function(){}();"); // Weird workaround to get the URL to load

	// Handle anytime a web page is loaded
	$.map.addEventListener("load", $.handleMapLoad);
};
/**
 * Set the map image
 * @param {String} _image
 * @param {Number} _width
 * @param {Number} _height
 */
$.setMapImage = function(_image, _width, _height) {
	$.map.evalJS("App.setMapImage('" + _image + "', '" + _width + "', '" + _height + "');");
};
/**
 * Handle the webView load event
 * @param {Object} _event Standard TiUI event callback
 */
$.handleMapLoad = function(_event) {
	$.setMapImage( $.currentMap.image, $.currentMap.width, $.currentMap.height );
};