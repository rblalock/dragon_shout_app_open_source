/**
 * The scrollView Map type app controller
 * @class Controllers.MapType.ScrollView
 * @uses core
 * @uses Model
 */

var App = require("core");
var Model = require("model");

/**
 * Load markers based on data
 * @param {Array} _markers
 * @param {String} _type
 */
$.loadMarkers = function(_markers, _type) {
	_markers.forEach(function(_marker) {
		App.Map.addMarker( _marker, _type || _marker.type );
	});
};
/**
 * Handle the marker layer touch event
 * @param {Object} _event Standard TiUI event callback
 */
$.handleMarkerTouch = function(_event) {
	if(!Ti.Network.online) {
		App.offlineMessage();
		return;
	}

	// Special case for search
	if(App.currentController.controllerName === "search") {
		App.currentController.hide();
	}

	Alloy.createController("markerDetail", {
		x: _event.x,
		y: _event.y,
		objectId: _event.source.objectId,
		userid: _event.source.userid,
		favorite: _event.source.favorite,
		markerType: _event.source.markerType
	}).init();
};
/**
 * Handle double touch on map
 * @param {Object} _event
 */
$.handleDoubleTouch = function(_event) {
	if(App.Map.wrapper.zoomScale < 1) {
		App.Map.wrapper.zoomScale = 1.0;
    } else {
		App.Map.wrapper.zoomScale = 0.3;
    }
};
/**
 * Handle the scrollView scale event
 * @param {Object} _event Standard TiUI event callback
 */
$.handleScrollScale = function(_event) {
	if (_event.scale > 1.2) {
		App.Map.zoomIn(_event.scale);
	} else if (App.Map.zoomedIn && _event.scale < 1.2) {
		App.Map.zoomOut();
	}
};
/**
 * Shortcut for loading the current user's markers and favorites (since we use this a lot)
 */
$.loadCurrentMarkers = function() {
	var loading = Alloy.createController("ui/loading").getView();
	App.Map.wrapper.add(loading);

	// Current user markers first
	Model.loadCurrentUserMakers(function(_results) {
		if(_results.success) {
			$.loadMarkers(_results.success);
		} else {
			Model.getAllMarkers(function(_results) {
				if(_results.success) {
					App.MapProxy.loadMarkers(_results.success);
				}
			});
		}

		// Then favorites
		Model.loadFavoriteMarkers(function(_results) {
			if(_results.success) {
				$.loadMarkers(_results.success, "favorite");
			}
		});

		App.Map.wrapper.remove(loading);
	});
};

// Load initial data
$.loadCurrentMarkers();

// Apply the touch events
App.Map.markerLayer.addEventListener('singletap', $.handleMarkerTouch);
App.Map.wrapper.addEventListener('scale', $.handleScrollScale);

// Not wild about the ~300ms delay this adds to the touch interaction.  Makes it feel
// slower.  Will decide if it's worth it later.
//App.Map.markerLayer.addEventListener('doubletap', $.handleDoubleTouch);