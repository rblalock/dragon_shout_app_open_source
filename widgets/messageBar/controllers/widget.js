/**
 * Message Bar Widget
 */
/**
 * The notification counter
 * @type {Number}
 */
$.notificationCount = 0;
/**
 * Update bar with message
 * @param {Object} _object
 */
$.updateMessage = function(_object) {
	$.notificationCount++;
	$.barTitle.text = _object.title;
	$.barMessage.text = _object.text;
	$.barBadgeCount.text = String($.notificationCount);
};
/**
 * Show the loading indicator
 */
$.showSpinner = function() {
	$.barBadge.animate({
		right: -10,
		duration: 250,
		opacity: 0
	});
	$.barSpinner.animate({
		right: 10,
		duration: 250,
		opacity: 1
	});
	$.barSpinner.show();
};
/**
 * Hide the loading indicator
 */
$.hideSpinner = function() {
	$.barBadge.animate({
		right: 10,
		duration: 250,
		opacity: 1
	});
	$.barSpinner.animate({
		right: -10,
		duration: 250,
		opacity: 0
	}, function() {
		$.barSpinner.hide();
	});
};