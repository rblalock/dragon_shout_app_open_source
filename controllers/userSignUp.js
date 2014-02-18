/**
 * User sign-up form
 * @class Controllers.UserSignUp
 * @uses Parse
 */

var Parse = require("parse");

/**
 * Params for this instance
 * @property {Object} params
 * @property {Function} params.callback
 */
$.params = arguments[0];
/**
 * Handle the sign-up process
 */
$.handleSignUp = function() {
	// Make sure we have values
	if ($.username.value === "" || $.password.value === "" || $.email.value === "") {
		Ti.UI.createAlertDialog({
			title: 'Username, Email, and Password Required',
			message: 'Please supply the required information to create an account.'
		}).show();
		return;
	}

	// Make sure the username is formatted correctly
	if(!$.username.value.match(/^[a-zA-Z0-9_-]{3,25}$/)) {
		Ti.UI.createAlertDialog({
			title: 'Your Username Needs Tweaking',
			message: 'Usernames should have no spaces, no special characters, be at least 3 characters long, and no more than 16 characters'
		}).show();
		return;
	}

	// Make sure the password is formatted correctly
	if(!$.password.value.match(/^[a-zA-Z0-9_-]{6,28}$/)) {
		Ti.UI.createAlertDialog({
			title: 'Your Password Needs Tweaking',
			message: 'Passwords should have no spaces, no special characters, be at least 6 characters long, and no more than 18 characters'
		}).show();
		return;
	}

	if($.passwordCheck.value !== $.password.value) {
		Ti.UI.createAlertDialog({
			title: 'Passwords do not match',
			message: 'Please make sure your password matches in the fields.'
		}).show();
		return;
	}

	// Make sure the email is formatted correctly
	if(!$.email.value.match(/^([a-zA-Z0-9_\.-]+)@([\da-z\.-]+)\.([a-z\.]{2,6})$/)) {
		Ti.UI.createAlertDialog({
			title: 'Your Email Needs Tweaking',
			message: 'Your email address does not appear to be a valid email address.  Please check and try again.'
		}).show();
		return;
	}

	// If all goes well, handle the registration / profile change
	if($.params.edit && Parse.currentUser) {
		Parse.updateUser($.username.value, $.password.value, $.email.value, function(_response) {
			Ti.API.debug( _response );
			if (_response.success) {
				$.window.close();
				$.params.callback();
				Ti.UI.createAlertDialog({
					title: 'Success!',
					message: 'Your account is updated.'
				}).show();
			} else {
				Ti.UI.createAlertDialog({
					title: 'There was a mistake with changing your profile.',
					message: 'Whoops!  Something happened:\n\n' + _response.failure.error
				}).show();
			}
		});
	} else {
		Parse.createUser($.username.value, $.password.value, $.email.value, function(_response) {
			Ti.API.debug( _response );
			if (_response.success) {
				$.window.close();
				$.params.callback();
				Ti.UI.createAlertDialog({
					title: 'Success!',
					message: 'Welcome to the Dragon Shout community!  Your account is now active.'
				}).show();
			} else {
				Ti.UI.createAlertDialog({
					title: 'There was a mistake with your registration',
					message: 'Whoops!  Something happened:\n\n' + _response.failure.error
				}).show();
			}
		});
	}
};

if($.params.edit && Parse.currentUser) {
	$.window.title = "Edit Account";
	$.signUp.title = "Edit Account";
	$.content.remove( $.accountExplanation );
	$.content.remove( $.accountTitle );
	$.username.value = Parse.userObject.username;
	$.email.value = Parse.userObject.email;
}

$.signUp.addEventListener("singletap", $.handleSignUp);
$.closeButton.addEventListener("click", function() {
	$.navWindow.close();
});