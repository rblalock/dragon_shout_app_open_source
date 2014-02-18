/**
 * Search screen
 * @class Controllers.Search
 * @uses core
 * @uses parse
 * @uses Model
 * @users Helpers
 */

var App = require("core");
var Parse = require("parse");
var Model = require("model");
var Helpers = require("helpers");

/**
 * Hide the controller
 */
$.hide = function() {
	$.wrapper.animate({
		duration: 150,
		opacity: 0
	});
};
/**
 * Show the controller
 */
$.show = function() {
	$.wrapper.animate({
		duration: 100,
		opacity: 1
	});
};
/**
 * Handle search action
 */
$.handleSearch = function() {
	if($.searchField.value) {
		var loading = Alloy.createController("ui/loading").getView();
		$.wrapper.add(loading);

		Model.searchCommunityMarkers($.searchField.value, null, function(_response) {
			if(_response.success) {
				Model.deleteAllLocalMarkers();
				App.MapProxy.loadMarkers(_response.success);
			}
			$.wrapper.remove(loading);
		});
	}
};
/**
 * Init of this controller
 */
$.init = function() {
	App.GlobalWindow.add( $.wrapper );

	// Handles closing the screen routine
	$.close.registerCloseEvent($.wrapper, function() {
		Model.deleteAllLocalMarkers();
		App.currentController = {};

		App.MapProxy.loadCurrentMarkers();
	});

	// Animate areas
	$.close.show();

	$.contentArea.animate({
		duration: 200,
		opacity: 0.9
	});

	$.searchField.focus();

	$.searchField.addEventListener("return", $.handleSearch);
};