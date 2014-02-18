/**
 * User profile screen
 * @class Controllers.UserProfile
 * @uses core
 * @uses parse
 * @uses Model
 * @uses Helpers
 */

var App = require("core");
var Parse = require("parse");
var Model = require("model");
var Helpers = require("helpers");

/**
 * Params of this instance
 * @type {Object}
 */
$.params = arguments[0];
/**
 * Helper to hide / show proper UI
 */
$.hideAuthenticationUI = function() {
	// Remove authentication wrapper
	$.authenticationWrapper.animate({
		opacity: 0,
		duration: 150
	}, function() {
		$.contentArea.remove( $.authenticationWrapper );

		// Add profile wrapper
		$.contentArea.add( $.profileWrapper );
		$.profileWrapper.animate({
			opacity: 1,
			duration: 150
		});
		$.setProfile();
	});

	$.iconWrapper.animate({
		duration: 150,
		opacity: 1,
		left: 90
	});
};
/**
 * Helper to hide / show proper UI
 */
$.hideProfileUI = function() {
	$.profileWrapper.animate({
		opacity: 0,
		duration: 150
	}, function() {
		$.contentArea.remove( $.profileWrapper );

		$.contentArea.add( $.authenticationWrapper );
		$.authenticationWrapper.animate({
			opacity: 1,
			duration: 150
		});
	});

	$.iconWrapper.animate({
		duration: 150,
		opacity: 0,
		left: 70
	});
};
/**
 * Set the profile screen
 */
$.setProfile = function() {
	$.profilePic.image = Helpers.getGravatarUrl(Parse.userObject.email, 100);
	$.profileUsername.text = Parse.userObject.username;
};
/**
 * Handle the login form
 */
$.handleLogin = function() {
	$.password.blur();
	$.username.blur();

	if($.username.value === "" || $.password.value === "") {
		Ti.UI.createAlertDialog({
		   title: 'Username and password required',
		    message: 'Please supply a username and password to login.'
		}).show();
	} else {
		Parse.login($.username.value, $.password.value, function(_response) {
			if(_response.success) {
				$.hideAuthenticationUI();

				$.username.value = "";
				$.password.value = "";
				
				Ti.API.debug(Parse.userObject);

				// Utility to make sure a friends object is created for the current user
				Model.createFriendsObject();

				// Make sure we always have up to date friend list cached (probably not optimal way to do this)
				Model.getFriends();

				// Always load the current user's markers, if applicable
				App.MapProxy.loadCurrentMarkers();
			} else {
				Ti.UI.createAlertDialog({
					title: 'Login Issue',
					message: 'There was a problem with your login. \n\nError Code:\n' + _response.failure.error
				}).show();
			}
		});
	}
};
/**
 * Handle logout routine
 */
$.handleLogout = function() {
	Model.clearCachedFriends();
	Parse.logout();
	$.hideProfileUI();
	Model.deleteAllLocalMarkers();
};
/**
 * Handle the sign-up window
 */
$.handleSignUpWindow = function() {
	var controller = Alloy.createController("userSignUp", {
		callback: function() {
			$.close.closeAction();
		}
	});
	controller.navWindow.open({
		modal: true,
		modalTransitionStyle: Titanium.UI.iPhone.MODAL_TRANSITION_STYLE_COVER_VERTICAL,
		modalStyle: Ti.UI.iPhone.MODAL_PRESENTATION_FORMSHEET
	});
};
/**
 * Forgot password window
 */
$.forgotPassword = function() {
	var controller = Alloy.createController("forgotPassword");
	controller.navWindow.open({
		modal: true,
		modalTransitionStyle: Titanium.UI.iPhone.MODAL_TRANSITION_STYLE_COVER_VERTICAL,
		modalStyle: Ti.UI.iPhone.MODAL_PRESENTATION_FORMSHEET
	});
};
/**
 * Handle the friends window
 */
$.handleFriendsWindow = function() {
	var controller = Alloy.createController("friends");
	controller.navWindow.open({
		modal: true,
		modalTransitionStyle: Titanium.UI.iPhone.MODAL_TRANSITION_STYLE_COVER_VERTICAL,
		modalStyle: Ti.UI.iPhone.MODAL_PRESENTATION_FORMSHEET
	});
};
/**
 * Handle the messages window
 */
$.handleMessagesWindow = function() {
	var controller = Alloy.createController("messages");
	controller.navWindow.open({
		modal: true,
		modalTransitionStyle: Titanium.UI.iPhone.MODAL_TRANSITION_STYLE_COVER_VERTICAL,
		modalStyle: Ti.UI.iPhone.MODAL_PRESENTATION_FORMSHEET
	});
};
/**
 * Handle edit profile window (almost the same as forgot password for now)
 */
$.handleEditProfile = function() {
	var controller = Alloy.createController("userSignUp", {
		edit: true,
		callback: function() {
			$.close.closeAction();
		}
	});
	controller.navWindow.open({
		modal: true,
		modalTransitionStyle: Titanium.UI.iPhone.MODAL_TRANSITION_STYLE_COVER_VERTICAL,
		modalStyle: Ti.UI.iPhone.MODAL_PRESENTATION_FORMSHEET
	});
};
/**
 * Handle the wall
 */
$.handleWall = function() {
	$.close.closeAction();
	var controller = Alloy.createController("feed");
	controller.navWindow.open({
		modal: true,
		modalTransitionStyle: Titanium.UI.iPhone.MODAL_TRANSITION_STYLE_COVER_VERTICAL,
		modalStyle: Ti.UI.iPhone.MODAL_PRESENTATION_FORMSHEET
	});
};
/**
 * Init this detail screen on demand
 */
$.init = function() {
	$.close.registerCloseEvent( $.wrapper );

	// Show the right UI based on log in
	if(Parse.currentUser) {
		$.contentArea.remove( $.authenticationWrapper );
		$.setProfile();
		$.iconWrapper.animate({
			duration: 150,
			opacity: 1,
			left: 90
		});
	} else {
		$.contentArea.remove( $.profileWrapper );
	}

	// Animate areas
	$.title.show();
	$.close.show();

	$.contentArea.animate({
		duration: 200,
		opacity: 0.9
	});

	// Assign events
	$.password.addEventListener("return", $.handleLogin);
	$.login.addEventListener("click", $.handleLogin);
	$.forgotPasswordButton.addEventListener("singletap", $.forgotPassword);
	$.signUp.addEventListener("click", $.handleSignUpWindow);
	$.logout.addEventListener("click", $.handleLogout);
	$.friends.addEventListener("click", $.handleFriendsWindow);
	$.messages.addEventListener("click", $.handleMessagesWindow);
	$.editProfile.addEventListener("click", $.handleEditProfile);
	$.wall.addEventListener("click", $.handleWall);
	$.username.addEventListener("return", function() {
		$.password.focus();
	});
	$.requestWrapper.addEventListener("click", function() {
		var controller = Alloy.createController("friendRequests");
		controller.navWindow.open({
			modal: true,
			modalTransitionStyle: Titanium.UI.iPhone.MODAL_TRANSITION_STYLE_COVER_VERTICAL,
			modalStyle: Ti.UI.iPhone.MODAL_PRESENTATION_FORMSHEET
		});
	});

	App.GlobalWindow.add( $.wrapper );
};