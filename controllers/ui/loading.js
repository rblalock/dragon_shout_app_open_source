/**
 * Loading UI graphic
 * @class Controllers.UI.Loading
 */

var t = Ti.UI.create2DMatrix();
t = t.rotate(179);

$.loading.animate({
	transform: t,
	duration: 500,
	repeat: 100
});