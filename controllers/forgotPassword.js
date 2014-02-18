/**
 * User password reset form
 * @class Controllers.ForgotPassword
 * @uses Parse
 */

var Parse = require("parse");

/**
 * Handles the password reset routine
 */
$.handlePasswordReset = function() {
	if($.email.value === "") {
		Ti.UI.createAlertDialog({
		   title: 'Email required',
		    message: 'Please supply a email.'
		}).show();
	} else {
		Parse.passwordReset($.email.value, function(_results) {
			if(_results.success) {
				$.window.close();
				Ti.UI.createAlertDialog({
					title: 'Password reset',
					message: 'Please check your email for instructions on resetting your password.'
				}).show();
			} else {
				Ti.UI.createAlertDialog({
					title: 'Reset Issue',
					message: 'There was a problem with resetting your password. \n\nError Code:\n' + _results.failure.error
				}).show();
			}
		});
	}
};

$.email.addEventListener("return", $.handlePasswordReset);
$.reset.addEventListener("singletap", $.handlePasswordReset);
$.closeButton.addEventListener("click", function() {
	$.navWindow.close();
});