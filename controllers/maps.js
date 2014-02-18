/**
 * Map selection screen
 * @class Controllers.Maps
 * @uses core
 * @uses Model
 */

var App = require("core");
var Model = require("model");

/**
 * Init this detail screen on demand
 */
$.init = function() {
	$.close.registerCloseEvent( $.wrapper );

	// Animate areas
	$.title.show();
	$.close.show();

	// Render available map buttons
	var maps = Alloy.CFG.Map.maps;

	maps.forEach(function(_map, _index) {
		var button = Ti.UI.createButton({
			title: _map.name,
			width: Ti.UI.FILL,
			mapId: _map.id,
			mapIndex: _index,
			height: 45,
			bottom: 1,
			right: 10,
			left: 10,
			backgroundColor: "#111",
			backgroundImage: "transparent",
			font: { fontFamily: "Optima", fontWeight: "bold" }
		});

		button.addEventListener("click", $.handleMapSelection);

		$.contentArea.add(button);
	});

	$.contentArea.animate({
		duration: 200,
		opacity: 0.9
	});

	App.GlobalWindow.add( $.wrapper );
};
/**
 * Handle selecting a map
 * @param {Object} _event
 */
$.handleMapSelection = function(_event) {
	App.Map.setMapImage(_event.source.mapIndex);

	// Load initial data
	App.MapProxy.loadCurrentMarkers();

	$.close.closeAction();
};