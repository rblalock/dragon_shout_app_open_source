/**
 * Settings screen
 * @class Controllers.Settings
 * @uses core
 * @uses Model
 */

var App = require("core");
var Model = require("model");

/**
 * Init
 */
$.init = function() {
	$.close.registerCloseEvent( $.wrapper );

	// Animate areas
	$.title.show();
	$.close.show();

	$.contentArea.animate({
		duration: 200,
		opacity: 0.9
	});

	$.contentArea.addEventListener("click", $.handleSettingSelection);

	App.GlobalWindow.add( $.wrapper );
};
/**
 * Handle selecting an option
 * @param {Object} _event
 */
$.handleSettingSelection = function(_event) {
	var id = _event.source.id;

	if(!id) {
		return;
	}

	switch(id) {
		case "share":
			break;
		case "tutorial":
			$.close.closeAction();
			Alloy.createController("tutorial").window.open();
			break;
		case "feedback":
			var newWin = Ti.UI.createWindow({
				title: 'Feedback'
			});
			var cancel = Ti.UI.createButton({ title: 'Close' });
			cancel.addEventListener('click', function() {
				navWin.close();
				newWin = null;
				navWin = null;
			});
			newWin.rightNavButton = cancel;
			var webView = Ti.UI.createWebView({ url: 'http://google.com' });
			newWin.add(webView);

			var navWin = Ti.UI.iOS.createNavigationWindow({
			    modal: true,
				window: newWin
			});
			navWin.open();
			break;
		case "credits":
			var newWin = Ti.UI.createWindow({
				title: 'Credits',
				backgroundColor: "#eee"
			});
			var cancel = Ti.UI.createButton({ title: 'Close' });
			cancel.addEventListener('click', function() {
				navWin.close();
				newWin = null;
				navWin = null;
			});
			newWin.rightNavButton = cancel;
			var webView = Ti.UI.createWebView({ url: 'credits.html' });
			newWin.add(webView);

			var navWin = Ti.UI.iOS.createNavigationWindow({
			    modal: true,
				window: newWin
			});
			navWin.open();
			break;
	}
};