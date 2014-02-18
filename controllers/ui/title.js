/**
 * Title UI fragment
 * @class Controllers.UI.Title
 */

/**
 * Params of this instance
 * @type {Object}
 */
$.params = arguments[0];
/**
 * Shows the title
 */
$.show = function() {
	$.wrapper.animate({
		duration: 250,
		opacity: 0.8,
		left: (Alloy.isTablet) ? 0 : -10
	});
};

$.title.text = $.params.title;