var App = require("core");

// Setup local storage if it hasn't been
if(!Ti.App.Properties.hasProperty("markers")) {
	Ti.App.Properties.setObject("markers", {});
}
if(!Ti.App.Properties.hasProperty("friends")) {
	Ti.App.Properties.setObject("friends", {});
}

// Make sure we always have a reference to the global window
App.GlobalWindow = $.GlobalWindow;

/**
 * Map widget setup
 */
App.Map = $.Map = Alloy.createWidget("map", "type/" + Alloy.CFG.Map.mapType);
App.Map.init({
	config: Alloy.CFG.Map
});
App.GlobalWindow.add( App.Map.wrapper );

/**
 * Menu widget setup
 */
App.Menu = $.Menu = Alloy.createWidget("menu");
App.Menu.init({
	primaryItems: Alloy.CFG.Menu.primaryItems,
	secondaryItems: Alloy.CFG.Menu.secondaryItems
});
App.GlobalWindow.add( App.Menu.wrapper );

// Start off the app logic
App.init();

// Register device for push notifications
Ti.Network.registerForPushNotifications({
	types:[
		Ti.Network.NOTIFICATION_TYPE_BADGE,
		Ti.Network.NOTIFICATION_TYPE_ALERT,
		Ti.Network.NOTIFICATION_TYPE_SOUND
	],
	success: function(e) {
		var parse = require("parse");
		var token = e.deviceToken;
		var device = (OS_IOS) ? "ios" : "android";

		if(!Ti.App.Properties.getString("deviceToken")) {
			Ti.API.debug( token );

			Ti.App.Properties.setString("deviceToken", token);

			// Register device with Parse and global channel
			parse.registerDeviceToken(token, device, [""]);
		}
	},
	error: function(e) {
		Ti.API.debug("Register For Push Notifications Error: " + e.error);
	},
	callback: function(e) {
		var data = e.data;
		var type = (data.type) ? data.type : "message";
		var content = (data.content) ? data.content : "";

		// TODO this should be handled elsewhere
		if(type === "marker" && content) {
			var Model = require("model");
			Model.getMarker(content, function(_results) {
				if(_results.success) {
					var marker = _results.success;

					if(marker.map !== App.Map.currentMap.id) {
						App.Map.setMapImageByName(marker.map);
					}

					App.Map.wrapper.zoomScale = 1.0;

					App.Map.wrapper.scrollTo(
						marker.x - (Ti.Platform.displayCaps.platformWidth / 2),
						marker.y - (Ti.Platform.displayCaps.platformHeight / 2)
					);

					App.MapProxy.loadMarkers([marker], "community");
				}
			});
		}

		setTimeout(function() {
			APP.checkForMessages();
		}, 1000);

        Ti.API.debug( data );
	}
});