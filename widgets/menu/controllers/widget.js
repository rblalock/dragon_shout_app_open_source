/**
 * Menu widget
 */

/**
 * Params for this instance
 * @type {Object}
 */
$.params = null;
/**
 * Primary menu item UI object reference
 * @type {Object}
 */
$.primaryMenuItems = {};
/**
 * Secondary menu item UI object reference
 * @type {Object}
 */
$.secondaryMenuItems = {};
/**
 * Init the menu
 * @param {Object} _params
 */
$.init = function(_params) {
	$.params = _params;

	// Add the main menu items
	$.params.primaryItems.forEach(function(_item, _index) {
		$.primaryMenuItems[_item.name] = Alloy.createWidget("menu", "menuItem", _item);
		if(_index === ($.params.primaryItems.length -1)) {
			$.primaryMenuItems[_item.name].wrapper.bottom = $.primaryMenuItems[_item.name].wrapper.top;
		}
		$.primaryMenu.add($.primaryMenuItems[_item.name].wrapper);
	});

	// Add the secondary menu items
	$.params.secondaryItems.forEach(function(_item, _index) {
		$.secondaryMenuItems[_item.name] = Alloy.createWidget("menu", "menuItem", _item);
		if(_index === ($.params.secondaryItems.length -1)) {
			$.secondaryMenuItems[_item.name].wrapper.bottom = $.secondaryMenuItems[_item.name].wrapper.top;
		}
		$.secondaryMenu.add($.secondaryMenuItems[_item.name].wrapper);
	});
};