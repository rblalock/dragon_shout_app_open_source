/**
 * Message list screen
 * @class Controllers.Messages
 * @uses core
 * @uses Model
 */

var App = require("core");
var Model = require("model");
var moment = require("alloy/moment");

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
		rows.push($.createMessage(_message) );
	});

	$.messageList.setData( rows );
};
/**
 * Create a message row
 * @param {Object} _message
 */
$.createMessage = function(_message) {
	var row =  Ti.UI.createTableViewRow({
		objectId: _message.objectId,
		messageType: _message.messageType,
		height: Ti.UI.SIZE,
		className: "row",
		data: _message.data
	});

	var type = Ti.UI.createLabel({
		width: Ti.UI.SIZE,
		height: 15,
		text: _message.messageType + " | " + moment(_message.createdAt).format('DD MMM'),
		font: { fontSize: 10, fontWeight: "bold" },
		color: "#ccc",
		left: 10,
		top: 5
	});

	var body = Ti.UI.createLabel({
		width: Ti.UI.FILL,
		height: Ti.UI.SIZE,
		right: 10,
		left: 10,
		top: 20,
		bottom: 10,
		text: _message.message,
		font: { fontSize: 14 },
		color: "#444"
	});

	row.add( type );
	row.add( body );

	return row;
};
/**
 * Handle selecting a message
 * @param {Object} _event
 */
$.handleMessageSelect = function(_event) {
	var row = _event.row;

	if(row.objectId) {
		switch(row.messageType) {
			case "comment":
				$.openComment( row.data );
				break;
			case "request":
				$.openFriendRequest();
				break;
			case "friend":
				$.openFriendList();
				break;
		}
	}
};
/**
 * Handle deleting a message
 * @param {Object} _event
 */
$.handleMessageDelete = function(_event) {
	var row = _event.row;
	Model.deleteMessage(row.objectId);
};
/**
 * Helper to open comment
 * @param {Object} _marker
 */
$.openComment = function(_marker) {
	var commentController = Alloy.createController("comments", {
		marker: _marker
	});
	commentController.navWindow.open({
		modal: true,
		modalTransitionStyle: Titanium.UI.iPhone.MODAL_TRANSITION_STYLE_COVER_VERTICAL,
		modalStyle: Ti.UI.iPhone.MODAL_PRESENTATION_FORMSHEET
	});
};
/**
 * Helper to open friend request
 */
$.openFriendRequest= function() {
	var controller = Alloy.createController("friendRequests");
	controller.navWindow.open({
		modal: true,
		modalTransitionStyle: Titanium.UI.iPhone.MODAL_TRANSITION_STYLE_COVER_VERTICAL,
		modalStyle: Ti.UI.iPhone.MODAL_PRESENTATION_FORMSHEET
	});
};
/**
 * Open the friend list modal
 */
$.openFriendList = function() {
	var controller = Alloy.createController("friends");
	controller.navWindow.open({
		modal: true,
		modalTransitionStyle: Titanium.UI.iPhone.MODAL_TRANSITION_STYLE_COVER_VERTICAL,
		modalStyle: Ti.UI.iPhone.MODAL_PRESENTATION_FORMSHEET
	});
};

// Assign events to UI
$.closeButton.addEventListener("click", function() {
	$.navWindow.close();
});

$.messageList.addEventListener("click", $.handleMessageSelect);
$.messageList.addEventListener("delete", $.handleMessageDelete);

// Get messages for list
Model.getMessages(function(_response) {
	if(_response.success) {
		$.setMessages( _response.success );
	} else {
		$.messageList.setData([{
			title: "No messages available",
			font: { fontSize: 11 }
		}]);
	}
});