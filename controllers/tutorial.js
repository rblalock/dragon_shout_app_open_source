/**
 * Tutorial screen
 * @class Controllers.Tutorial
 * @uses core
 */

var App = require("core");

// Handle close
$.close.registerCloseEvent($.window, function() {
	$.window.close();
	$ = null;
	Ti.App.Properties.setBool("tutorialRead", true);
});

// Add tutorial screens
for(var i = 1; i < Alloy.CFG.tutorial.steps; i++) {
	var view = Ti.UI.createView();
	var image = Ti.UI.createImageView({
		image: "images/tutorial/step" + i + ".png",
		width: 320,
		height: 480
	});

	view.add( image );
	$.tutorial.addView( view );
}

// Animate areas
$.close.show();