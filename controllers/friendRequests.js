/**
 * Friend request list screen
 * @class Controllers.FriendRequets
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
 * Set the message list data
 * @param {Array} _data
 */
$.setMessages = function(_data) {
	var rows = [];

	_data.forEach(function(_message) {
		rows.push( $.createMessage(_message.fromUser, _message.objectId) );
	});

	$.messageList.setData( rows );
};
/**
 * Create a message row
 * @param {Object} _message
 * @param {String} _friendRequestId
 */
$.createMessage = function(_message, _friendRequestId) {
	var row =  Ti.UI.createTableViewRow({
		objectId: _message.objectId,
		friendRequestId: _friendRequestId,
		height: Ti.UI.SIZE,
		backgroundColor: "#eee"
	});

	var gravatar = Ti.UI.createImageView({
		image: Helpers.getGravatarUrl(_message.email, 45),
		width: 45,
		height: 45,
		left: 5,
		top: 5,
		bottom: 5
	});

	var username = Ti.UI.createLabel({
		width: Ti.UI.SIZE,
		height: 45,
		left: 60,
		text: _message.username,
		font: { fontSize: 10 },
		color: "#111"
	});

	var addFriend = Ti.UI.createButton({
		id: "addFriendButton",
		title: "Add",
		backgroundImage: "transparent",
		backgroundColor: "#1B8913",
		width: 75,
		height: 35,
		right: 10,
		font: { fontSize: 11 }
	});

	row.add(gravatar);
	row.add(username);
	row.add(addFriend);

	return row;
};
/**
 * Handle add button click / approve friend request
 * @param {Object} _event
 */
$.handleAddButton = function(_event) {
	function acceptFriendRequestCallback(_row) {
		$.messageList.deleteRow(_row);
		Ti.UI.createAlertDialog({
			title: 'Success!',
			message: 'You added a friend!  Now you can send messages, converse, and more!'
		}).show();
	}

	if(_event.source.id === "addFriendButton") {
		Model.acceptFriendRequest(_event.row.objectId, _event.row.friendRequestId, function(_response) {
			if(_response.success) {
				acceptFriendRequestCallback( _event.row );
			} else {
				// For legacy support
				if(_response.why === "missingFriendObject") {
					// We'll try one more time after waiting 1 second (no, not an exact science)
					Model.acceptFriendRequest(_event.row.objectId, _event.row.friendRequestId, function(_response) {
						if(_response.success) {
							acceptFriendRequestCallback( _event.row );
						} else {
							Ti.UI.createAlertDialog({
								title: 'Whoops!',
								message: 'There was an error accepting the friend request.  Try again please.'
							}).show();
						}
					});
				}
			}
		});
	}
};

// Assign events to UI
$.closeButton.addEventListener("click", function() {
	$.navWindow.close();

	// Make sure we always have up to date friend list cached (probably not optimal way to do this)
	Model.getFriends();
});
$.messageList.addEventListener("click", $.handleAddButton);

// Get friend request data
Model.getFriendRequests(function(_response) {
	if(_response.success) {
		$.setMessages( _response.success.results );
	}
});