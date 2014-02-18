/**
 * Marker comment screen
 * @class Controllers.Comments
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
 * Params of this instance
 * @type {Object}
 */
$.params = arguments[0];
/**
 * Set the comment list data
 * @param {Array} _data
 */
$.setComments = function(_data) {
	var rows = [];

	_data.forEach(function(_comment) {
		rows.push(
			$.createComment({
				objectId: _comment.objectId,
				email: _comment.user.email,
				username: _comment.user.username,
				comment: _comment.text,
				date: _comment.createdAt
			})
		);
	});

	$.commentList.setData( rows );
};
/**
 * Create a comment row
 * @param {Object} _comment
 */
$.createComment = function(_comment) {
	var row =  Ti.UI.createTableViewRow({
		objectId: _comment.objectId,
		height: Ti.UI.SIZE,
		className: "row"
	});

	var gravatar = Ti.UI.createImageView({
		image: Helpers.getGravatarUrl(_comment.email, 45),
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
		text: _comment.username,
		font: { fontSize: 10 },
		color: "#999"
	});

	var date = Ti.UI.createLabel({
		width: Ti.UI.SIZE,
		height: 15,
		right: 10,
		top: 5,
		text: moment(_comment.createdAt).format('DD MMM'),
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
		text: _comment.comment,
		font: { fontSize: 14 },
		color: "#444"
	});

	row.add(gravatar);
	row.add(username);
	row.add(date);
	row.add(comment);

	return row;
};
/**
 * Handles when a new comment is created by the user
 */
$.handleComment = function() {
	if($.commentArea.value.length > 0) {
		Model.createComment($.params.marker, $.commentArea.value, function(_response) {
			if(_response.success) {
				var commentRow = $.createComment({
					objectId: _response.success.objectId,
					email: Parse.userObject.email,
					username: Parse.userObject.username,
					comment: $.commentArea.value
				});

				if($.commentList.data.length > 0) {
					$.commentList.insertRowBefore(0, commentRow);
				} else {
					$.commentList.appendRow([commentRow]);
				}
			}

			$.commentArea.value = "";
		});
	}

	$.commentArea.blur();
};
/**
 * Handle deleting a row
 * @param {Object} _event
 */
$.handleDelete = function(_event) {
	if(_event.row.objectId) {
		Model.deleteComment( _event.row.objectId );
	}
};

// Assign events to UI
$.commentArea.addEventListener("return", $.handleComment);
$.closeButton.addEventListener("click", function() {
	$.navWindow.close();
});

// Check if marker is owned by current user
if($.params.marker.userid.objectId !== Parse.currentUser) {
	if(Model.getFriend($.params.marker.userid.objectId)) {
		$.commentArea.show();
	} else {
		$.wrapper.remove( $.commentArea );
	}
} else {
	// Owners allowed to edit
	$.commentList.editable = true;
	$.commentArea.show();
	$.commentList.addEventListener("delete", $.handleDelete);
}

// Download comments
Model.getCommentsByMarkerId($.params.marker.objectId, function(_response) {
	if(_response.success) {
		$.setComments(_response.success.results);
	}
});