/**
 * Select Box UI fragment
 * @class Controllers.UI.SelectBox
 * @uses core
 */

var App = require("core");

/**
 * Params of this instance
 * @type {Object}
 */
$.params = arguments[0];
/**
 * The picker window
 * @type {Object} TiUIWindow
 */
$.pickerWindow = Ti.UI.createWindow({
	title: "Select an option",
	backgroundColor: "#eee",
	opacity: 0.9,
	modal: true
});
/**
 * The navigation window
 * @type {Object} Ti.UI.iOS.NavigationWindow
 */
$.pickerNavWindow = Ti.UI.iOS.createNavigationWindow({
	modal: true,
	window: $.pickerWindow
});
/**
 * The data array for this instance
 * @type {Array}
 */
$.data = [];
/**
 * The picker for this instance
 * @type {Object} TiUIPicker
 */
$.picker = Ti.UI.createPicker({
	bottom: 0,
	width: Ti.UI.FILL
});
/**
 * Set the current value for this box
 * @param {String} _value
 */
$.setCurrentSelection = function(_value) {
	$.title.text = _value;
};
/**
 * Set the data object for this instance
 * @param {Array} _data
 */
$.setData = function(_data) {
	$.data = _data;

	var data = [];

	$.data.forEach(function(_item) {
		data.push( Ti.UI.createPickerRow({ title: _item }) );
	});

	$.picker.add(data);
	$.picker.selectionIndicator = true;
};
/**
 * Show the picker
 */
$.showPicker = function() {
	$.pickerNavWindow.open({
		modal: true,
		modalTransitionStyle: Titanium.UI.iPhone.MODAL_TRANSITION_STYLE_COVER_VERTICAL,
		modalStyle: Ti.UI.iPhone.MODAL_PRESENTATION_FORMSHEET
	});
};
/**
 * Hide the picker
 */
$.hidePicker = function() {
	$.pickerNavWindow.close();
};
/**
 * Handle the picker callback
 * @param {Object} _event
 */
$.handlePickerChange = function(_event) {
	$.setCurrentSelection(_event.selectedValue[0]);
};

$.wrapper.addEventListener("click", $.showPicker);
$.picker.addEventListener("change", $.handlePickerChange);

if($.params) {
	$.setCurrentSelection($.params.title);
}

// Picker window layout for handheld
var title = Ti.UI.createLabel({
	text: "Select an option:",
	color: "#eee"
});
$.pickerWindow.add(title);
$.pickerWindow.add( $.picker );

var btn = Ti.UI.createButton({ title: "close" });
btn.addEventListener("click", function() {
	$.pickerNavWindow.close();
});

$.pickerWindow.rightNavButton = btn;