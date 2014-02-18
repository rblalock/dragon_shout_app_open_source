/**
 * Close UI fragment
 * @class Controllers.UI.Close
 * @uses core
 */

var App = require("core");

/**
 * Params of this instance
 * @type {Object}
 */
$.params = arguments[0];
/**
 * The parent wrapper attached ot the window this close button will eliminate
 * @type {Object}
 */
$.parentWrapper = null;
/**
 * Registers what happens when the close button is clicked
 * @param {Object} _parent TiUI Object
 * @param {Function} _callback Optional callback after close happens
 */
$.registerCloseEvent = function(_parent, _callback) {
	$.parentWrapper = _parent;
	$.params.callback = _callback;
};
/**
 * Close event handler
 */
$.closeAction = function() {
	$.parentWrapper.animate({
		opacity: 0,
		duration: 250
	}, function() {
		App.GlobalWindow.remove( $.parentWrapper );
		if($.params.callback) {
			$.params.callback();
		}
	});
};
/**
 * Show
 */
$.show = function() {
	$.wrapper.animate({
		duration: 200,
		opacity: 0.8,
		curve: Ti.UI.ANIMATION_CURVE_EASE_IN_OUT
	});
};

$.wrapper.addEventListener("click", $.closeAction);