/**
 * Parameters for this instance
 * @type {Object}
 */
$.params = arguments[0];

// Assign the params to the UI objects
$.wrapper.applyProperties({
	type: $.params.type,
	name: $.params.name
});
$.icon.image = "/images/menu/" + $.params.icon;