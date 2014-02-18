/**
 * Friend list screen
 * @class Controllers.Friends
 * @uses core
 * @uses Model
 * @uses Helpers
 */

var App = require("core");
var Model = require("model");
var Helpers = require("helpers");

/**
 * Params of this instance
 * @type {Object}
 */
$.params = arguments[0];
/**
 * Set the friend list data
 * @param {Array} _data
 */
$.setFriends = function(_data) {
	var rows = [];

	_data.forEach(function(_friend) {
		rows.push($.createFriend(_friend) );
	});

	$.friendList.setData( rows );
};
/**
 * Create a friend row
 * @param {Object} _friend
 */
$.createFriend = function(_friend) {
	var row =  Ti.UI.createTableViewRow({
		objectId: _friend.objectId,
		height: Ti.UI.SIZE,
		className: "row"
	});

	var gravatar = Ti.UI.createImageView({
		image: Helpers.getGravatarUrl(_friend.email, 45),
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
		text: _friend.username,
		font: { fontSize: 14 },
		color: "#444"
	});

	row.add(gravatar);
	row.add(username);

	return row;
};
/**
 * Handles when a new friend is added by the user
 */
$.handleFriend = function() {
	if($.addFriendField.value.length > 0) {
		Model.createFriendRequest($.addFriendField.value, function() {
			Ti.UI.createAlertDialog({
				title: 'Friend request sent!',
				message: 'Your friend request was sent.  You will get notified when your friend accepts.'
			}).show();
		});
	}

	$.addFriendField.value = "";
	$.addFriendField.blur();
};
/**
 * Handle deleting a friend
 * @param {Object} _event
 */
$.handleDelete = function(_event) {
	Model.deleteFriend(_event.row.objectId, function() {
		Ti.UI.createAlertDialog({
			title: 'User removed!',
			message: 'User successfully removed from your friends.'
		}).show();
	});
};
/**
 * Handle selecting a friend
 * @param {Object} _tableEvent
 */
$.handleFriendSelect = function(_tableEvent) {
	if(_tableEvent.row.objectId) {
		var dialog = Ti.UI.createOptionDialog({
			title: "Load friend's markers on the map?",
			options: ["Yes", "No"],
			cancel: 1,
			selectedIndex: 0
		});
		dialog.show();

		dialog.addEventListener("click", function(_event) {
			if(_event.index == 0) {
				Model.loadMarkersByUserId(_tableEvent.row.objectId, function(_results) {
					if(_results.success) {
						App.MapProxy.loadMarkers(_results.success, "friend");
					}
				});
			}
		});
	}
};
/**
 * Handle showing all friends' markers
 */
$.handleShowAll = function() {
	var dialog = Ti.UI.createOptionDialog({
		title: "Load all friends' markers on map?",
		options: ["Yes", "No"],
		cancel: 1,
		selectedIndex: 0
	});
	dialog.show();

	dialog.addEventListener("click", function(_event) {
		if(_event.index == 0 && $.friendList.data[0].rows.length > 0) {
			$.friendList.data[0].rows.forEach(function(_row) {
				Model.loadMarkersByUserId(_row.objectId, function(_results) {
					if(_results.success) {
						App.MapProxy.loadMarkers(_results.success, "friend");
					}
				});
			});
		}
	});
};

// Assign events to UI
$.friendList.addEventListener("delete", $.handleDelete);
$.friendList.addEventListener("click", $.handleFriendSelect);
$.addFriendField.addEventListener("return", $.handleFriend);
$.showAll.addEventListener("click", $.handleShowAll);
$.closeButton.addEventListener("click", function() {
	$.navWindow.close();
});

// Get friend list
Model.getFriends(function(_response) {
	if(_response.success) {
		$.setFriends(_response.success.results);
	} else {
		$.friendList.setData([{
			title: "No friends! Go meet some people!  Add usernames above if you know them.",
			font: { fontSize: 11 }
		}]);
	}
});