/**
 * Parse.com REST library
 * @singleton
 * @class Parse
 * @uses Helpers.http
 */
var http = require("http");

var Parse = {
	/**
	 * Application ID
	 * @property {String}
	 */
	applicationId: Alloy.CFG.Parse.applicationId,
	/**
	 * Rest KEY
	 * @property {String}
	 */
	restKey: Alloy.CFG.Parse.restKey,
	/**
	 * Default endpoint
	 */
	url: Alloy.CFG.Parse.url,
	/**
	 * The full user object meta data
	 * @property {Object} userObject
	 * @property {String} userObject.createdAt
	 * @property {String} userObject.email
	 * @property {String} userObject.objectId
	 * @property {Object} userObject.party LEGACY?
	 * @property {String} userObject.sessionToken
	 * @property {String} userObject.updatedAt
	 * @property {String} userObject.username
	 */
	userObject: Ti.App.Properties.getObject("userObject") || null,
	/**
	 * Currently logged in user's ID
	 * @property {String} currentUser
	 */
	currentUser: Ti.App.Properties.getString("currentUser") || null,
	/**
	 * User session token
	 * @property {String} sessionToken
	 */
	sessionToken: Ti.App.Properties.getString("sessionToken") || null,
	/**
	 * Login user
	 * @param {String} _username
	 * @param {String} _password
	 * @param {Function} _callback
	 */
	login: function(_username, _password, _callback) {
		var request = "?username=" + _username + "&password=" + _password;

		http.request({
			type: "GET",
			format: "json",
			url: Parse.url + "login" + request,
			headers: [
				{ name: "X-Parse-Application-Id", value: Parse.applicationId },
				{ name: "X-Parse-REST-API-Key", value: Parse.restKey }
			],
			success: function(_response) {
				// Cache token and user ID, etc.
				Parse.sessionToken = _response.sessionToken;
				Parse.currentUser = _response.objectId;
				Parse.userObject = _response;
				Ti.App.Properties.setObject("userObject", Parse.userObject);
				Ti.App.Properties.setString("sessionToken", Parse.sessionToken);
				Ti.App.Properties.setString("currentUser", Parse.currentUser);

				// Associate the installation ID (for push) with user ID
				Ti.API.debug("Installation Object: " + Ti.App.Properties.getString("installationObjectId") );
				if(Ti.App.Properties.getString("installationObjectId")) {
					Parse.updateInstallation(Ti.App.Properties.getString("installationObjectId"), {
						user: {
							__type: "Pointer",
							className: "_User",
							objectId: Parse.currentUser
						}
					}, function(_response) {
						Ti.API.debug( _response );
					});
				}

				// Make sure user is registered under a push channel for his user ID
				Parse.registerChannelForUser(Parse.currentUser);

				if(_callback) { _callback({ success: _response }); }
			},
			failure: function(_error) {
				if(_callback) { _callback({ failure: JSON.parse(_error) }); }
			}
		});
	},
	/**
	 * Utility function to log current user out
	 */
	logout: function() {
		Parse.sessionToken = null;
		Parse.currentUser = null;
		Parse.userObject = null;
		Ti.App.Properties.setObject("userObject", {});
		Ti.App.Properties.setString("sessionToken", "");
		Ti.App.Properties.setString("currentUser", "");
	},
	/**
	 * Password reset email address
	 * @param {String} _email
	 * @param {Function} _callback
	 */
	passwordReset: function(_email, _callback) {
		var data = {
			email: _email
		};

		http.request({
			type: "POST",
			format: "json",
			data: data,
			url: Parse.url + "requestPasswordReset",
			headers: [
				{ name: "X-Parse-Application-Id", value: Parse.applicationId },
				{ name: "X-Parse-REST-API-Key", value: Parse.restKey }
			],
			success: function(_response) {
				_callback({ success: _response });
			},
			failure: function(_error) {
				_callback({ failure: JSON.parse(_error) });
			}
		});
	},
	/**
	 * Create / register a new user
	 * @param {String} _username
	 * @param {String} _password
	 * @param {String} _email
	 * @param {Function} _callback
	 */
	createUser: function(_username, _password, _email, _callback) {
		var data = {
			username: _username,
			password: _password,
			email: _email
		};

		http.request({
			type: "POST",
			format: "json",
			data: data,
			url: Parse.url + "users",
			headers: [
				{ name: "X-Parse-Application-Id", value: Parse.applicationId },
				{ name: "X-Parse-REST-API-Key", value: Parse.restKey }
			],
			success: function(_response) {
				// Log this user in to get the full user object cache
				Parse.login(_username, _password);
				_callback({ success: _response });
			},
			failure: function(_error) {
				_callback({ failure: JSON.parse(_error) });
			}
		});
	},
	/**
	 * Update existing user
	 * @param {String} _username
	 * @param {String} _password
	 * @param {String} _email
	 * @param {Function} _callback
	 */
	updateUser: function(_username, _password, _email, _callback) {
		var data = {
			username: _username,
			password: _password,
			email: _email
		};

		http.request({
			type: "PUT",
			format: "json",
			data: data,
			url: Parse.url + "users/" + Parse.currentUser,
			headers: [
				{ name: "X-Parse-Application-Id", value: Parse.applicationId },
				{ name: "X-Parse-REST-API-Key", value: Parse.restKey },
				{ name: "X-Parse-Session-Token", value: Parse.sessionToken }
			],
			success: function(_response) {
				// Log this user in to get the full user object cache
				Parse.login(_username, _password);
				_callback({ success: _response });
			},
			failure: function(_error) {
				_callback({ failure: JSON.parse(_error) });
			}
		});
	},
	/**
	 * Update user fields
	 * @param {Object} _data
	 * @param {Function} _callback
	 */
	updateUserObject: function(_data, _callback) {
		http.request({
			type: "PUT",
			format: "json",
			data: _data,
			url: Parse.url + "users/" + Parse.currentUser,
			headers: [
				{ name: "X-Parse-Application-Id", value: Parse.applicationId },
				{ name: "X-Parse-REST-API-Key", value: Parse.restKey },
				{ name: "X-Parse-Session-Token", value: Parse.sessionToken }
			],
			success: function(_response) {
				_callback({ success: _response });
			},
			failure: function(_error) {
				_callback({ failure: JSON.parse(_error) });
			}
		});
	},
	/**
	 * Get a user by username
	 * @param {String} _username
	 * @param {Function} _callback
	 */
	getUserByUsername: function(_username, _callback) {
		var headers = [
			{ name: "X-Parse-Application-Id", value: Parse.applicationId },
			{ name: "X-Parse-REST-API-Key", value: Parse.restKey }
		];
		// If we have a session, use this
		if(Parse.sessionToken) {
			headers.push({ name: "X-Parse-Session-Token", value: Parse.sessionToken });
		}

		var query = JSON.stringify({
			username: _username
		});

		var url = Parse.url + "users?" + "&where=" + encodeURIComponent(query);

		http.request({
			type: "GET",
			format: "json",
			url: url,
			headers: headers,
			success: function(_response) {
				if(_callback) { _callback({ success: _response }); }
			},
			failure: function(_error) {
				if(_callback) { _callback({ failure: JSON.parse(_error) }); }
			}
		});
	},
	/**
	 * Get user by ID
	 * @param {String} _objectId
	 * @param {Function} _callback
	 */
	getUserById: function(_objectId, _callback) {
		var headers = [
			{ name: "X-Parse-Application-Id", value: Parse.applicationId },
			{ name: "X-Parse-REST-API-Key", value: Parse.restKey }
		];
		// If we have a session, use this
		if(Parse.sessionToken) {
			headers.push({ name: "X-Parse-Session-Token", value: Parse.sessionToken });
		}

		http.request({
			type: "GET",
			format: "json",
			url: Parse.url + "users/" + _objectId,
			headers: headers,
			success: function(_response) {
				if(_callback) { _callback({ success: _response }); }
			},
			failure: function(_error) {
				if(_callback) { _callback({ failure: JSON.parse(_error) }); }
			}
		});
	},
	/**
	 * Parse query users class
	 * @param {Object} _query
	 * @param {Function} _callback
	 */
	queryUsers: function(_query, _callback) {
		var headers = [
			{ name: "X-Parse-Application-Id", value: Parse.applicationId },
			{ name: "X-Parse-REST-API-Key", value: Parse.restKey }
		];
		// If we have a session, use this
		if(Parse.sessionToken) {
			headers.push({ name: "X-Parse-Session-Token", value: Parse.sessionToken });
		}

		var url = Parse.url + "users/?";

		if(_query.limit) {
			url = url + "limit=" + _query.limit;
			delete _query.limit;
		} else {
			url = url + "limit=300";
		}

		if(_query.include) {
			url = url + "&include=" + _query.include;
			delete _query.include
		}

		var query = JSON.stringify(_query);
		url = url + "&where=" + encodeURIComponent(query);

		// Save the record to the cloud db
		http.request({
			type: "GET",
			format: "json",
			url: url,
			headers: headers,
			success: function(_response) {
				if(_callback) { _callback({ success: _response }); }
			},
			failure: function(_error) {
				if(_callback) { _callback({ failure: JSON.parse(_error) }); }
			}
		});
	},
	/**
	 * Get an object by it's ID
	 * @param {String} _className
	 * @param {String} _id
	 * @param {Function} _callback
	 */
	getObject: function(_className, _id, _callback) {
		var headers = [
			{ name: "X-Parse-Application-Id", value: Parse.applicationId },
			{ name: "X-Parse-REST-API-Key", value: Parse.restKey }
		];
		// If we have a session, use this
		if(Parse.sessionToken) {
			headers.push({ name: "X-Parse-Session-Token", value: Parse.sessionToken });
		}

		http.request({
			type: "GET",
			format: "json",
			url: Parse.url + "classes/" + _className + "/" + _id,
			headers: headers,
			success: function(_response) {
				if(_callback) { _callback({ success: _response }); }
			},
			failure: function(_error) {
				if(_callback) { _callback({ failure: JSON.parse(_error) }); }
			}
		});
	},
	/**
	 * Save a specific object in Parse
	 * @param {String} _className Parse class name
	 * @param {Object} _data
	 * @param {Function} _callback
	 */
	saveObject: function(_className, _data, _callback) {
		var headers = [
			{ name: "X-Parse-Application-Id", value: Parse.applicationId },
			{ name: "X-Parse-REST-API-Key", value: Parse.restKey }
		];
		// If we have a session, use this
		if(Parse.sessionToken) {
			headers.push({ name: "X-Parse-Session-Token", value: Parse.sessionToken });
		}

		// Save the record to the cloud db
		http.request({
			type: "POST",
			format: "json",
			data: _data,
			url: Parse.url + "classes/" + _className,
			headers: headers,
			success: function(_response) {
				if(_callback) { _callback({ success: _response }); }
			},
			failure: function(_error) {
				if(_callback) { _callback({ failure: JSON.parse(_error) }); }
			}
		});
	},
	/**
	 * Delete a specific object in Parse
	 * @param {String} _className Parse class name
	 * @param {String} _id ID of object to delete
	 * @param {Function} _callback
	 */
	deleteObject: function(_className, _id, _callback) {
		var headers = [
			{ name: "X-Parse-Application-Id", value: Parse.applicationId },
			{ name: "X-Parse-REST-API-Key", value: Parse.restKey }
		];
		// If we have a session, use this
		if(Parse.sessionToken) {
			headers.push({ name: "X-Parse-Session-Token", value: Parse.sessionToken });
		}

		http.request({
			type: "DELETE",
			format: "json",
			url: Parse.url + "classes/" + _className + "/" + _id,
			headers: headers,
			success: function(_response) {
				if(_callback) { _callback({ success: _response }); }
			},
			failure: function(_error) {
				if(_callback) { _callback({ failure: JSON.parse(_error) }); }
			}
		});
	},
	/**
	 * Update a specific object in Parse
	 * @param {String} _className Parse class name
	 * @param {String} _id ID of object to save
	 * @param {Object} _params The params to save to the object
	 * @param {Function} _callback
	 */
	updateObject: function(_className, _id, _params, _callback) {
		var headers = [
			{ name: "X-Parse-Application-Id", value: Parse.applicationId },
			{ name: "X-Parse-REST-API-Key", value: Parse.restKey }
		];
		// If we have a session, use this
		if(Parse.sessionToken) {
			headers.push({ name: "X-Parse-Session-Token", value: Parse.sessionToken });
		}

		http.request({
			type: "PUT",
			format: "json",
			data: _params,
			url: Parse.url + "classes/" + _className + "/" + _id,
			headers: headers,
			success: function(_response) {
				if(_callback) { _callback({ success: _response }); }
			},
			failure: function(_error) {
				if(_callback) { _callback({ failure: JSON.parse(_error) }); }
			}
		});
	},
	/**
	 * Parse query
	 * @param {String} _className Parse class name
	 * @param {Object} _query
	 * @param {Function} _callback
	 */
	query: function(_className, _query, _callback) {
		var headers = [
			{ name: "X-Parse-Application-Id", value: Parse.applicationId },
			{ name: "X-Parse-REST-API-Key", value: Parse.restKey }
		];
		// If we have a session, use this
		if(Parse.sessionToken) {
			headers.push({ name: "X-Parse-Session-Token", value: Parse.sessionToken });
		}

		var url = Parse.url + "classes/" + _className + "?";

		if(_query.limit) {
			url = url + "limit=" + _query.limit;
			delete _query.limit;
		} else {
			url = url + "limit=100";
		}

		if(_query.count) {
			url = url + "&count=" + _query.count;
			delete _query.count;
		}

		if(_query.order) {
			url = url + "&order=" + _query.order;
			delete _query.order;
		}

		if(_query.include) {
			url = url + "&include=" + _query.include;
			delete _query.include
		}
		
		var query = JSON.stringify(_query);
		url = url + "&where=" + encodeURIComponent(query);
		
		// Save the record to the cloud db
		http.request({
			type: "GET",
			format: "json",
			url: url,
			headers: headers,
			success: function(_response) {
				if(_callback) { _callback({ success: _response }); }
			},
			failure: function(_error) {
				if(_callback) { _callback({ failure: JSON.parse(_error) }); }
			}
		});
	},
	/**
	 * Update a specific installation object
	 * @param {String} _id ID of object to save
	 * @param {Object} _params The params to save to the object
	 * @param {Function} _callback
	 */
	updateInstallation: function(_id, _params, _callback) {
		var headers = [
			{ name: "X-Parse-Application-Id", value: Parse.applicationId },
			{ name: "X-Parse-REST-API-Key", value: Parse.restKey }
		];
		// If we have a session, use this
		if(Parse.sessionToken) {
			headers.push({ name: "X-Parse-Session-Token", value: Parse.sessionToken });
		}

		http.request({
			type: "PUT",
			format: "json",
			data: _params,
			url: Parse.url + "installations/" + _id,
			headers: headers,
			success: function(_response) {
				if(_callback) { _callback({ success: _response }); }
			},
			failure: function(_error) {
				if(_callback) { _callback({ failure: JSON.parse(_error) }); }
			}
		});
	},
	/**
	 * Get an installation object by ID
	 * @param {String} _id
	 * @param {Function} _callback
	 */
	getInstallation: function(_id, _callback) {
		var headers = [
			{ name: "X-Parse-Application-Id", value: Parse.applicationId },
			{ name: "X-Parse-REST-API-Key", value: Parse.restKey }
		];
		// If we have a session, use this
		if(Parse.sessionToken) {
			headers.push({ name: "X-Parse-Session-Token", value: Parse.sessionToken });
		}

		http.request({
			type: "GET",
			format: "json",
			url: Parse.url + "installations/" + _id,
			headers: headers,
			success: function(_response) {
				if(_callback) { _callback({ success: _response }); }
			},
			failure: function(_error) {
				if(_callback) { _callback({ failure: JSON.parse(_error) }); }
			}
		});
	},
	/**
	 * Register device for push
	 * @param {String} _token
	 * @param {String} _device
	 * @param {Array} _channels
	 * @param {Function} _callback
	 */
	registerDeviceToken: function(_token, _device, _channels, _callback) {
		var headers = [
			{ name: "X-Parse-Application-Id", value: Parse.applicationId },
			{ name: "X-Parse-REST-API-Key", value: Parse.restKey }
		];
		// If we have a session, use this
		if(Parse.sessionToken) {
			headers.push({ name: "X-Parse-Session-Token", value: Parse.sessionToken });
		}

		var data = {
			deviceType: _device,
	        deviceToken: _token,
	        channels: _channels
		};

		// Save the record to the cloud db
		http.request({
			type: "POST",
			format: "json",
			data: data,
			url: Parse.url + "installations",
			headers: headers,
			success: function(_response) {
				Ti.API.debug( _response );
				Ti.App.Properties.setString("installationObjectId", _response.objectId);
				if(_callback) { _callback({ success: _response }); }
			},
			failure: function(_error) {
				if(_callback) { _callback({ failure: JSON.parse(_error) }); }
			}
		});
	},
	/**
	 * Register a logged in user for a specific channel
	 * @param {String} _channel
	 * @param {Function} _callback
	 */
	registerChannelForUser: function(_channel, _callback) {
		if(Ti.App.Properties.getString("installationObjectId")) {
			Parse.getInstallation(Ti.App.Properties.getString("installationObjectId"), function(_response) {
				Ti.API.debug( _response );
				Ti.API.debug( _channel );

				if(_response.success) {
					var channels = _response.success.channels;
					var exists = false;
					channels.forEach(function(_ch) {
						if(_ch === _channel) {
							exists = true;
						}
					});
					if(!exists) {
						channels.push(_channel);
					}

					Ti.API.debug( channels );

					Parse.updateInstallation(_response.success.objectId, {
						channels: channels
					}, function(_response) {
						if(_callback) { _callback(); }
						Ti.API.debug( _response );
					});
				} else {
					if(_callback) { _callback(); }
				}
			});
		} else {
			if(_callback) { _callback(); }
		}
	},
	/**
	 * Send a push notification
	 * @param {Array} _channels
	 * @param {String} _payload
	 * @param {Function} _callback
	 */
	sendPush: function(_channels, _payload, _callback) {
		var headers = [
			{ name: "X-Parse-Application-Id", value: Parse.applicationId },
			{ name: "X-Parse-REST-API-Key", value: Parse.restKey }
		];
		// If we have a session, use this
		if(Parse.sessionToken) {
			headers.push({ name: "X-Parse-Session-Token", value: Parse.sessionToken });
		}

		// Format the data
		var data = {
			channels: _channels,
			data: _payload
		};

		// Save the record to the cloud db
		http.request({
			type: "POST",
			format: "json",
			data: data,
			url: Parse.url + "push",
			headers: headers,
			success: function(_response) {
				Ti.API.debug( _response );
				if(_callback) { _callback({ success: _response }); }
			},
			failure: function(_error) {
				Ti.API.debug( _error );
				if(_callback) { _callback({ failure: JSON.parse(_error) }); }
			}
		});
	}
};

module.exports = Parse;