/**
 * ScrollView Map Type Base Controller
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
 * The marker UIViews tracked on screen
 * @type {Object}
 */
$.markers = {};
/**
 * Zoomed flag
 * @type {Boolean}
 */
$.zoomedIn = false;
/**
 * Initialize this widget
 * @param {Object} _params
 */
$.init = function(_params) {
	// Assign args to the widget level param object
	$.params = _params;

	// Set the initial map image
	$.setMapImage($.params.config.defaultMap);
};
/**
 * Set map image based on name
 * @param {String} _name
 */
$.setMapImageByName = function(_name) {
	var isset = false;

	$.params.config.maps.forEach(function(_map, _index) {
		if(_map.id === _name && !isset) {
			isset = true;
			$.setMapImage(_index);
		}
	});
};
/**
 * Set the map image
 * @param {Number} _index
 */
$.setMapImage = function(_index) {
	// Remove any and all markers
	$.removeAllMarkers();

	// Set the current map image
	$.currentMap = $.params.config.maps[_index];

	// Assign the map properties
	$.map.applyProperties({
		width: $.currentMap.width,
		height: $.currentMap.height,
		image: "/images/maps/" + $.currentMap.image
	});
	$.markerLayer.applyProperties({
		width: $.currentMap.width,
		height: $.currentMap.height
	});
	$.wrapper.applyProperties({
		contentWidth: $.currentMap.width,
		contentHeight: $.currentMap.height
	});

	Ti.API.debug( $.currentMap );
};
/**
 * Zoomed in state -> scale markers
 * @param {Number} _scale
 */
$.zoomIn = function(_scale) {
	$.zoomedIn = true;
	var scale = 0.4;

	if(_scale > 2) {
		scale = 0.2;
	}

	for (prop in $.markers) {
		if ($.markers[prop]) {
			$.markers[prop].transform = Ti.UI.create2DMatrix({ scale: scale });
		}
	}
};
/**
 * Zoomed out state -> scale markers
 */
$.zoomOut = function() {
	$.zoomedIn = false;
	for (prop in $.markers) {
		if ($.markers[prop]) {
			$.markers[prop].transform = Ti.UI.create2DMatrix({ scale: 1 });
		}
	}
};
/**
 * Add a marker
 * @param {Object} _data
 * @param {Number} _data.x
 * @param {Number} _data.y
 * @param {String} _data.objectId
 * @param {Object} _data.userid
 * @param {String} _data.markerType
 * @param {String} _data.map
 * @param {String} _type The type of marker
 */
$.addMarker = function(_data, _type) {
	// Make sure we're not adding on top of the same marker
	if($.markers[_data.objectId]) {
		$.markerLayer.remove( $.markers[_data.objectId] );
		delete $.markers[_data.objectId];
	}

	var view = Ti.UI.createView({
		backgroundColor: Alloy.CFG.markerColors[_type] || "#111",
		width: 35,
		height: 35,
		top: _data.y - 17.5,
		left: _data.x - 17.5,
		transform: Ti.UI.create2DMatrix({ scale: 0.1 }),
		opacity: 0,
		objectId: _data.objectId,
		userid: _data.userid,
		markerType: _data.markerType,
		colorType: _type,
		favorite: (_type === "favorite") ? true : false
	});

	var icon = Ti.UI.createView({
		backgroundImage: "/images/icons/" + Alloy.CFG.icons[_data.markerType.toLowerCase()],
		touchEnabled: false,
		width: 25,
		height: 25,
		top: 5,
		right: 5,
		bottom: 5,
		left: 5
	});
	view.add(icon);

	$.markerLayer.add( view );

	view.animate({
		duration: 200,
		opacity: 1,
		curve: Ti.UI.ANIMATION_CURVE_EASE_IN_OUT,
		transform: Ti.UI.create2DMatrix({ scale: 1 })
	});

	// Add reference to tracking object
	$.markers[_data.objectId] = view;
};
/**
 * Remove the marker from the map
 * @param {String} _objectId
 */
$.removeMarker = function(_objectId) {
	$.markerLayer.remove( $.markers[_objectId] );
	delete $.markers[_objectId];
};
/**
 * Remove all markers based on same key / value
 * @param {String} _userId
 */
$.removeAllMarkersByUserId = function(_userId) {
	for(var prop in $.markers) {
		if($.markers[prop].userid.objectId === _userId) {
			$.markerLayer.remove( $.markers[prop] );
			delete $.markers[prop];
		}
	}
};
/**
 * Utility to remove all markers on map
 */
$.removeAllMarkers = function() {
	for(var prop in $.markers) {
		$.markerLayer.remove( $.markers[prop] );
		delete $.markers[prop];
	}
};
/**
 * Edit a marker
 * @param {Object} _data
 * @param {Number} _data.x
 * @param {Number} _data.y
 * @param {String} _data.objectId
 * @param {String} _data.markerType
 * @param {String} _data.map
 * @param {String} _data.favorite
 */
$.editMarker = function(_data) {
	if(_data.favorite == true) {
		$.markers[_data.objectId].backgroundColor = Alloy.CFG.markerColors.favorite;
		$.markers[_data.objectId].favorite = true;
	} else if(_data.favorite == false) {
		$.markers[_data.objectId].backgroundColor = Alloy.CFG.markerColors[$.markers[_data.objectId].colorType] || "#111";
		$.markers[_data.objectId].favorite = false;
	}

	if(_data.markerType) {
		$.markers[_data.objectId].children[0].backgroundImage = "/images/icons/" + Alloy.CFG.icons[_data.markerType.toLowerCase()];
	}
};