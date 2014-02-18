/**
 * Marker detail screen
 * @class Controllers.MarkerDetail
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
 * Params of this instance
 * @type {Object}
 */
$.params = arguments[0] || {};
/**
 * Marker data
 * @type {Object}
 */
$.data = {};
/**
 * Handle saving the marker form
 */
$.handleSave = function() {
	var data = {
		objectId: $.params.objectId,
		markerType: $.markerType.title.text,
		share: $.share.title.text,
		notes: $.notes.value
	};

	// x/y only applicable when it's a new marker
	if(!$.params.objectId) {
		data.x = $.params.x;
		data.y = $.params.y;
	}

	Model.saveMarker(data, function(_modelResults) {
		if(_modelResults.success) {
			if(App.Map.markers[data.objectId]) {
				App.Map.editMarker( data );
			} else {
				data.objectId = _modelResults.success.objectId;
				App.Map.addMarker( data );
			}

			$.close.closeAction();
		} else {
			// TODO handle error saving
		}
	});
};
/**
 * Handle delete
 */
$.handleDelete = function() {
	Model.deleteMarker($.params.objectId);
	App.Map.removeMarker( $.params.objectId );
	$.close.closeAction();
};
/**
 * Handle opening comments
 */
$.handleCommentOpen = function() {
	var commentController = Alloy.createController("comments", {
		marker: $.data
	});
	commentController.navWindow.open({
		modal: true,
		modalTransitionStyle: Titanium.UI.iPhone.MODAL_TRANSITION_STYLE_COVER_VERTICAL,
		modalStyle: Ti.UI.iPhone.MODAL_PRESENTATION_FORMSHEET
	});
};
/**
 * Set data for this form (if applicable)
 * @param {Object} _results
 */
$.setData = function(_results) {
	if(_results) {
		var data = $.data = _results;

		$.markerType.setCurrentSelection( data.markerType );
		$.share.setCurrentSelection( data.share );
		$.notes.value = data.notes;
	}
};
/**
 * Handles click on profile image
 */
$.handleProfileSelect = function() {
	// Make sure not already a friend
	if(!Model.getFriend($.data.userid.objectId)) {
		var dialog = Ti.UI.createOptionDialog({
			title: "Send " + $.data.userid.username + " a friend request?",
			options: ["Yes", "No"],
			cancel: 1,
			selectedIndex: 0
		});
		dialog.show();

		dialog.addEventListener("click", function(_event) {
			if(_event.index == 0) {
				Model.createFriendRequest($.data.userid.username, function() {
					Ti.UI.createAlertDialog({
						title: 'Friend request sent!',
						message: 'Your friend request was sent.  You will get notified when your friend accepts.'
					}).show();
				});
			}
		});
	}
};
/**
 * Handle favorite selection button
 */
$.handleFavorite = function() {
	if($.params.favorite) {
		Model.unFavoriteMarker($.data.objectId);
		$.unSetFavorite();
		Model.deleteLocalMarker( $.params.objectId );

		App.Map.editMarker({
			favorite: false,
			objectId: $.data.objectId,
			markerType: $.params.markerType
		});
	} else {
		Model.favoriteMarker($.data.objectId);
		$.setFavorite();

		App.Map.editMarker({
			favorite: true,
			objectId: $.data.objectId,
			markerType: $.params.markerType
		});
	}
};
/**
 * Set favorite color / UI
 */
$.setFavorite = function() {
	$.params.favorite = true;
	$.favoriteWrapper.backgroundColor = "#0A5E92";
};
/**
 * Unset favorite UI
 */
$.unSetFavorite = function() {
	$.params.favorite = false;
	$.favoriteWrapper.backgroundColor = "#111";
};
/**
 * Handle when marker is closed
 */
$.handleMarkerClose = function() {
	if(App.currentController.controllerName === "search") {
		App.currentController.show();
	}
};
/**
 * Open the detail screen
 */
$.open = function() {
	App.GlobalWindow.add( $.wrapper );
	
	// Set data for select lists / pickers
	$.markerType.setData( Alloy.CFG.markerTypes );
	$.share.setData(["Public", "Private"]);

	// Handles closing the screen routine
	$.close.registerCloseEvent($.wrapper, $.handleMarkerClose);

	// Action button events
	$.cancel.addEventListener("click", $.close.closeAction);
	$.save.addEventListener("click", $.handleSave);

	// Set the select box widths
	$.markerType.wrapper.width = "49%";
	$.share.wrapper.width = "49%";

	// Set the toolbar for the note area
	var done = Ti.UI.createButton({
		title: "done",
		style: Ti.UI.iPhone.SystemButtonStyle.DONE
	});
	done.addEventListener("click", function() {
		$.notes.blur();
	});
	$.notes.keyboardToolbar = [
		Ti.UI.createButton({
		    systemButton : Ti.UI.iPhone.SystemButton.FLEXIBLE_SPACE
		}),
		done
	];

	// UX fix for scrollview + textarea
	$.notes.addEventListener("blur", function() {
		$.contentArea.contentHeight = "auto";
		$.contentArea.contentWidth = "auto";

		if($.notes.value == "") {
			$.notes.value = $.notes.hintText;
		}
	});

	// Manual handling of note textarea since we can't do hint text (yes this is a little hacky)
	$.notes.addEventListener("focus", function() {
		if($.notes.value === $.notes.hintText) {
			$.notes.value = "";
		}
	});

	// Animate areas
	$.title.show();
	$.close.show();

	$.contentArea.animate({
		duration: 200,
		opacity: 0.9
	});
	$.buttonWrapper.animate({
		duration: 350,
		opacity: 1,
		bottom: 0
	});

	// Existing marker UI
	if($.params.objectId) {
		$.iconWrapper.animate({
			duration: 150,
			opacity: 1,
			left: 90
		});

		// Special case for non-account user
		if(!Parse.currentUser) {
			$.iconWrapper.remove( $.commentWrapper );
			$.iconWrapper.remove( $.favoriteWrapper );
		}

		// Owner gets special stuff
		if($.params.userid.objectId === Parse.currentUser) {
			$.iconWrapper.remove( $.favoriteWrapper );
			$.iconWrapper.remove( $.profileWrapper );
			$.deleteWrapper.addEventListener("click", $.handleDelete);
		} else {
			// Guest view is slightly different
			$.iconWrapper.remove( $.deleteWrapper );
			$.buttonWrapper.remove( $.save );
			$.cancel.width = "100%";
			$.selectWrapper.touchEnabled = false;
			$.notes.editable = false;

			// Marker owner profile
			$.profileWrapper.addEventListener("click", $.handleProfileSelect);
			
			// Local / remote logic for image
			$.profileImage.image = Helpers.getGravatarUrl($.data.userid.email, 40);
		}
	}

	if($.params.favorite) {
		$.setFavorite();
	}

	$.favoriteWrapper.addEventListener("click", $.handleFavorite);
	$.commentWrapper.addEventListener("click", $.handleCommentOpen);
};
/**
 * Init this detail screen on demand
 */
$.init = function() {
	// Set data if we have an objectId
	if($.params.objectId) {
		var loading = Alloy.createController("ui/loading").getView();
		App.GlobalWindow.add(loading);

		Model.getMarker($.params.objectId, function(_results) {
			if(_results.success) {
				$.setData(_results.success);
				$.open();
			} else {
				Ti.API.error("TODO handle marker missing data error");
				$.close.closeAction();
			}

			App.GlobalWindow.remove(loading);
		});
	} else {
		$.open();
	}
};