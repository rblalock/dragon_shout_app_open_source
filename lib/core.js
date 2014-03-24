/**
 * Core app behavior singleton
 * @class core
 * @singleton
 * @uses parse
 */

var Parse = require("parse");

var APP = {
	/**
	 * The Global Window
	 * @type {Object}
	 */
	GlobalWindow: null,
	/**
	 * The Map Widget
	 * @type {Object}
	 */
	Map: null,
	/**
	 * The menu proxy
	 * @type {Object}
	 */
	Menu: null,
	/**
	 * The map behavior proxy
	 * @type {Object}
	 */
	MapProxy: null,
	/**
	 * The current detail controller if available
	 * @type {Object}
	 */
	currentController: {},
	/**
	 * The message interval / loop
	 * @type {Object}
	 */
	messageCounter: null,
	/**
	 * Init the app singleton
	 */
	init: function() {
		Ti.App.addEventListener("messageReceived", APP.receiveMessage);
		Ti.App.addEventListener("pause", APP.pause);
		Ti.App.addEventListener("resumed", APP.resume);
		APP.Menu.wrapper.addEventListener("click", APP.handleNavigation);

		// The Map Proxy for controlling the map widget behavior in the app
		APP.MapProxy = Alloy.createController("mapType/" + Alloy.CFG.Map.mapType);

		// Open the app window
		APP.GlobalWindow.open();

		// Start the message timer, check every 3 minutes
		APP.checkForMessages();
		APP.messageCounter = setInterval(APP.checkForMessages, (60000 * 3));

		// Tutorial mode, if applicable
		if(!Ti.App.Properties.getBool("tutorialRead")) {
			Alloy.createController("tutorial").window.open();
		}
	},
	/**
	 * Check for messages interval
	 */
	checkForMessages: function() {
		var Model = require("model");
		Model.countUnreadMessages(function(_response) {
			if(_response.success) {
				if(_response.success.count > 0) {
					APP.toast("You have " + _response.success.count + " unread message(s)");
				}

				Ti.API.debug(_response.success.count);
			}
		});
	},
	/**
	 * Simple toast / message notification
	 * @param {String} _message
	 */
	toast: function(_message) {
		var toastWrapper = Ti.UI.createView({
			opacity: 0,
			width: Ti.UI.SIZE,
			height: 40,
			right: -50,
			bottom: 10,
			backgroundColor: "#111",
			borderRadius: 10
		});
		var toast = Ti.UI.createLabel({
			color: "#fff",
			left: 30,
			right: 20,
			width: Ti.UI.SIZE,
			height: Ti.UI.SIZE,
			text: _message,
			font: { fontFamily: "Optima", fontSize: 12 },
			touchEnabled: false
		});

		toastWrapper.addEventListener("click", function() {
			var controller = Alloy.createController("messages");
			controller.navWindow.open({
				modal: true,
				modalTransitionStyle: Titanium.UI.iPhone.MODAL_TRANSITION_STYLE_COVER_VERTICAL,
				modalStyle: Ti.UI.iPhone.MODAL_PRESENTATION_FORMSHEET
			});
		});

		toastWrapper.add( toast );
		APP.GlobalWindow.add( toastWrapper );

		toastWrapper.animate({
			duration: 200,
			opacity: 0.8,
			right: -10
		});

		setTimeout(function() {
			toastWrapper.animate({
				duration: 200,
				opacity: 0,
				right: -50
			}, function() {
				APP.GlobalWindow.remove( toastWrapper );
				toastWrapper = null;
				toast = null;
			});
		}, 2500);
	},
	/**
	 * Utility to show standard offline message
	 */
	offlineMessage: function() {
		Ti.UI.createAlertDialog({
			title: 'Internet Connection Required',
			message: 'You must have an internet connection.'
		}).show();
	},
	/**
	 * Utility to show standard must be logged in
	 */
	mustBeLoggedInMessage: function() {
		Ti.UI.createAlertDialog({
			title: 'Please Log In',
			message: 'You must log in to use the social parts of this app.'
		}).show();
	}

	,/**
	 * Handle the main menu navigation
	 * @param {Object} _event TiUI event callback
	 */
	handleNavigation: function(_event) {
		var type = _event.source.type;

		if(!Ti.Network.online && type !== "maps") {
			APP.offlineMessage();
			return;
		}

		if(type === "search" && !Parse.currentUser) {
			APP.mustBeLoggedInMessage();
			return;
		}

		// Special case for search
		if(APP.currentController.controllerName === "search") {
			return;
		}

		if(type) {
			APP.currentController = Alloy.createController(type);
			APP.currentController.controllerName = type;
			APP.currentController.init();
		}
	},
	/**
	 * Resume event
	 */
	resume: function() {
		APP.checkForMessages();
		APP.messageCounter = setInterval(APP.checkForMessages, (60000 * 3));
	},
	/**
	 * Pause event
	 */
	pause: function() {
		clearInterval(APP.messageCounter);
		APP.messageCounter = null;
	}
};

module.exports = APP;