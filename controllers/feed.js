/**
 * Marker comment screen
 * @class Controllers.Feed
 * @uses core
 * @users parse
 * @uses Model
 * @uses Helpers
 */

var App = require("core");
var Parse = require("parse");
var Model = require("model");
var Helpers = require("helpers");
var moment = require("alloy/moment");

/**
 * Data reference
 * @type {Object}
 */
$.data = {
	comments: [],
	markers: []
};
/**
 * Set the list data
 * @param {Array} _data
 * @param {String} _type
 */
$.setData = function(_data, _type) {
	var rows = [];
	var type = "";
	switch(_type) {
		case "markers":
			type = "createMarkerRow";
			break;
		case "comments":
			type = "createCommentRow";
			break;
	}

	_data.forEach(function(_item) {
		rows.push( $[type](_item) );
	});
	
	$.list.setData( rows );
};
/**
 * Create a marker row
 * @param {Object} _item
 */
$.createMarkerRow = function(_item) {
	if(_item.userid && _item.notes.length > 0) {
		var row =  Ti.UI.createTableViewRow({
			objectId: _item.objectId,
			coords: { x: _item.x, y: _item.y },
			marker: _item,
			type: "marker",
			height: Ti.UI.SIZE,
			className: "markerRow"
		});

		var gravatar = Ti.UI.createImageView({
			image: Helpers.getGravatarUrl(_item.userid.email, 45),
			width: 45,
			height: 45,
			left: 5,
			top: 5,
			bottom: 5
		});

		var username = Ti.UI.createLabel({
			width: Ti.UI.SIZE,
			height: 15,
			left: 60,
			top: 5,
			text: _item.userid.username,
			font: { fontSize: 10 },
			color: "#999"
		});

		var date = Ti.UI.createLabel({
			width: Ti.UI.SIZE,
			height: 15,
			right: 10,
			top: 5,
			text: moment(_item.createdAt).format('DD MMM'),
			font: { fontSize: 10 },
			color: "#999"
		});

		var comment = Ti.UI.createLabel({
			width: Ti.UI.FILL,
			height: Ti.UI.SIZE,
			left: 60,
			right: 5,
			top: 20,
			bottom: 5,
			text: _item.notes,
			font: { fontSize: 14 },
			color: "#444"
		});

		row.add(gravatar);
		row.add(username);
		row.add(date);
		row.add(comment);
	}

	return row;
};
/**
 * Create a comment row
 * @param {Object} _item
 */
$.createCommentRow = function(_item) {
	if(_item.user && _item.marker) {
		var row =  Ti.UI.createTableViewRow({
			objectId: _item.objectId,
			coords: { x: _item.marker.x, y: _item.marker.y },
			marker: _item.marker,
			type: "comment",
			height: Ti.UI.SIZE,
			className: "commentRow"
		});

		var gravatar = Ti.UI.createImageView({
			image: Helpers.getGravatarUrl(_item.user.email, 45),
			width: 45,
			height: 45,
			left: 5,
			top: 5,
			bottom: 5
		});

		var username = Ti.UI.createLabel({
			width: Ti.UI.SIZE,
			height: 15,
			left: 60,
			top: 5,
			text: _item.user.username,
			font: { fontSize: 10 },
			color: "#999"
		});

		var date = Ti.UI.createLabel({
			width: Ti.UI.SIZE,
			height: 15,
			right: 10,
			top: 5,
			text: moment(_item.createdAt).format('DD MMM'),
			font: { fontSize: 10 },
			color: "#999"
		});

		var comment = Ti.UI.createLabel({
			width: Ti.UI.FILL,
			height: Ti.UI.SIZE,
			left: 60,
			right: 5,
			top: 20,
			bottom: 5,
			text: _item.text,
			font: { fontSize: 14 },
			color: "#444"
		});

		row.add(gravatar);
		row.add(username);
		row.add(date);
		row.add(comment);
	}

	return row;
};
/**
 * Handles when a new comment is created by the user
 * @param {Object} _event
 */
$.handleRowSelect = function(_event) {
	var row = _event.row;
	var type = row.type;
	var id = "";

	$.navWindow.close();

	switch(type) {
		case "marker":
			App.MapProxy.loadMarkers([row.marker], "community");
			break;
		case "comment":
			if(row.marker.map !== App.Map.currentMap.id) {
				App.Map.setMapImageByName(row.marker.map);
			}

			App.MapProxy.loadMarkers([row.marker], "community");
			var commentController = Alloy.createController("comments", {
				marker: row.marker
			});
			// Make sure there isn't an animation conflict on the UI thread (yeh this is slightly lame)
			setTimeout(function() {
				commentController.navWindow.open({
					modal: true,
					modalTransitionStyle: Titanium.UI.iPhone.MODAL_TRANSITION_STYLE_COVER_VERTICAL,
					modalStyle: Ti.UI.iPhone.MODAL_PRESENTATION_FORMSHEET
				});
			}, 500);
			break;
	}

	App.Map.wrapper.zoomScale = 1.0;

	App.Map.wrapper.scrollTo(
		row.coords.x - (Ti.Platform.displayCaps.platformWidth / 2),
		row.coords.y - (Ti.Platform.displayCaps.platformHeight / 2)
	);
};
/**
 * Handle tab bar select
 * @param {Object} _event
 */
$.handleTabbedBarSelect = function(_event) {
	switch(_event.index) {
		case 0:
			Model.communityFeed(function(_response) {
				if(_response.success) {
					$.data.markers = _response.success.results;
					$.setData($.data.markers, "markers");
				}
			});
			break;
		case 1:
			Model.communityComments(function(_response) {
				if(_response.success) {
					$.data.comments = _response.success.results;
					$.setData($.data.comments, "comments");
				}
			});
			break;
	}
};

// Assign events to UI
$.closeButton.addEventListener("click", function() {
	$.navWindow.close();
});
$.list.addEventListener("click", $.handleRowSelect);
$.tabbedBar.addEventListener("click", $.handleTabbedBarSelect);

// Initially set data for first tab
$.handleTabbedBarSelect({ index: 0 });