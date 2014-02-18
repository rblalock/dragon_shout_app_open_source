/**
 * Misc Helpers / Utilities
 * @class Helpers
 * @singleton
 */
var Helpers = {
	/**
	 * Get gravatar image
	 * @param {String} _email
	 * @param {String/Number} _size
	 */
	getGravatarUrl: function(_email, _size) {
		var email = "";
		var size = _size || "45";

		if(_email) {
			email = Ti.Utils.md5HexDigest(_email).toLowerCase().trim();
		} else {
			email = "http://www.gravatar.com/avatar?s=" + size + "&r=pg";
		}

		return "http://www.gravatar.com/avatar/" + email + "?s=" + size + "&r=pg";
	}
};

module.exports = Helpers;