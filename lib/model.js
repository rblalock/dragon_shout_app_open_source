/**
 * A simplistic "model" that manages all data interaction in the app.  Note "model" is in quotes for a reason.  :-)
 * @class Model
 * @singleton
 * @uses core
 * @uses Parse
 */

var App = require("core");
var Parse = require("parse");
var _ = require("alloy/underscore")._;

var Model = {
	/**
	 * This is a utility for legacy support where the 'map' field does not exist
	 * @param {Object} _query
	 */
	legacyQuery: function(_query) {
		if(App.Map.currentMap.id === "skyrim") {
			_query.$or = [
				{ map: App.Map.currentMap.id },
				{ map: { $exists: false } }
			];
		} else {
			_query.map = App.Map.currentMap.id;
		}

		return _query;
	},
	/**
	 * Get all local markers
	 * @param {Function} _callback
	 */
	getAllMarkers: function(_callback) {
		var markersData = Ti.App.Properties.getObject("markers");
		var markers = [];
		
		for(var prop in markersData) {
			// Make sure we only return the markers of the current map.  The second check
			// Is for legacy support of old markers of DS 1.0
			if(markersData[prop].map === App.Map.currentMap.id ||
				markersData[prop].map == undefined && App.Map.currentMap.id === "skyrim") {

				// If user ID is null then it was created when not logged in so we'll respect that
				if(markersData[prop].userid.objectId) {
					markersData[prop].userid.objectId = Parse.userObject.objectId
				}

				markers.push(markersData[prop]);
			}
		}
		
		_callback({
			success: markers
		});
	},
	/**
	 * Get a marker
	 * @param {String} _objectId
	 * @param {Function} _callback
	 * @param {Number} _callback.x
	 * @param {Number} _callback.y
	 * @param {String} _callback.markerType
	 * @param {String} _callback.notes
	 * @param {String} _callback.objectId
	 * @param {String} _callback.share
	 * @param {String} _callback.map
	 * @param {Object} _callback.userid
	 */
	getMarker: function(_objectId, _callback) {
		var markersData = Ti.App.Properties.getObject("markers");

		if(markersData[_objectId]) {
			_callback({
				success: markersData[_objectId]
			});
		} else {
			Parse.query("marker", {
				include: "userid",
				objectId: _objectId
			}, function(_response) {
				Ti.API.debug(_response);
				if(_response.success && _response.success.results && _response.success.results.length > 0) {
					// Cache marker for next time
					var type = (_response.success.results[0].userid.objectId === Parse.currentUser) ? "user" : "friend";
					Model.cacheMarkers([_response.success.results[0]], type);

					_callback({
						success: _response.success.results[0]
					});
				} else {
					_callback({
						failed: true
					});
				}
			});
		}
	},
	/**
	 * Save marker locally and remote
	 * @param {Object} _data
	 * @param {Number} _data.x
	 * @param {Number} _data.y
	 * @param {String} _data.markerType
	 * @param {String} _data.notes
	 * @param {String} _data.objectId
	 * @param {String} _data.share
	 * @param {Function} _callback
	 * @param {Object} _callback.success
	 */
	saveMarker: function(_data, _callback) {
		var markersData = Ti.App.Properties.getObject("markers");

		_data.userid = {
			__type: "Pointer",
			className: "_User",
			objectId: Parse.currentUser
		};
		_data.map = App.Map.currentMap.id;

		_data.ACL = {};
		_data.ACL[Parse.currentUser] = {
			read: true,
			write: true
		};

		if(_data.share === "Public") {
			_data.ACL["*"] = { read: true };
		}

		Ti.API.debug(_data);

		// We're editing if we have an existing ID
		if(_data.objectId) {
			if(Parse.currentUser) {
				Parse.updateObject("marker", _data.objectId, _data, function(_response) {
					if(_response.success) {
						_.extend(markersData[_data.objectId], _data);
						Ti.App.Properties.setObject("markers", markersData);
						_callback({ success: _response.success });
					} else {
						_callback({ failure: _response });
					}
				});
			} else {
				_.extend(markersData[_data.objectId], _data);
				Ti.App.Properties.setObject("markers", markersData);
				_callback({ success: _data });
			}
		} else {
			if(Parse.currentUser) {
				Parse.saveObject("marker", _data, function(_response) {
					if(_response.success) {
						_data.objectId = _response.success.objectId;
						markersData[_data.objectId] = _data;
						Ti.App.Properties.setObject("markers", markersData);
						_callback({ success: _response.success });
					} else {
						_callback({ failure: _response });
					}
				});
			} else {
				_data.objectId = _.random(0,10000);
				markersData[_data.objectId] = _data;
				Ti.App.Properties.setObject("markers", markersData);
				_callback({ success: _data });
			}
		}
	},
	/**
	 * Another way to save marker ONLY LOCAL.  Used for remote calls to Parse.
	 * @param {Array} _data
	 * @param {String} _markerType
	 * @param {Function} _callback
	 * @param {Object} _callback.success
	 */
	cacheMarkers: function(_data, _markerType, _callback) {
		var markersData = Ti.App.Properties.getObject("markers");

		_data.forEach(function(_marker) {
			_marker.type = _markerType;
			markersData[_marker.objectId] = _marker;
		});

		Ti.App.Properties.setObject("markers", markersData);

		if(_callback) {
			_callback({ success: markersData });
		}
	},
	/**
	 * Delete a location marker
	 * @param {String} _objectId
	 * @param {Function} _callback
	 */
	deleteMarker: function(_objectId, _callback) {
		Parse.deleteObject("marker", _objectId, function(_response) {
			if(_response.success) {
				if(_callback) { _callback({ success: true }); }
			} else {
				if(_callback) { _callback({ failed: true }); }
			}

			// We're deleting it, either way, from the local store.
			Model.deleteLocalMarker(_objectId);
		});
	},
	/**
	 * Utility to remove marker only from local store
	 * @param {String} _objectId
	 */
	deleteLocalMarker: function(_objectId) {
		var markersData = Ti.App.Properties.getObject("markers");
		delete markersData[_objectId];
		Ti.App.Properties.setObject("markers", markersData);
	},
	/**
	 * Load markers for specific user
	 * @param {String} _userId
	 * @param {Function} _callback
	 */
	loadMarkersByUserId: function(_userId, _callback) {
		var query = {
			include: "userid",
			share: "Public",
			userid: {
				__type: "Pointer",
				className: "_User",
				objectId: _userId
			},
			limit: 300
		};

		// Legacy check
		query = Model.legacyQuery(query);

		Parse.query("marker", query, function(_response) {
			if(_response.success) {
				// Cache response
				Model.cacheMarkers( _response.success.results, "friend");
				_callback({
					success: _response.success.results
				});
			} else {
				_callback( null );
			}
		});
	},
	/**
	 * Load the current user's markers
	 * @param {Function} _callback
	 */
	loadCurrentUserMakers: function(_callback) {
		var query = {
			userid: {
				__type: "Pointer",
				className: "_User",
				objectId: Parse.currentUser
			},
			limit: 1000
		};

		// Legacy check
		query = Model.legacyQuery(query);

		Parse.query("marker", query, function(_response) {
			if(_response.success && _response.success.results.length > 0) {
				// Cache response
				Model.cacheMarkers( _response.success.results, "user");

				_callback({
					success: _response.success.results
				});
			} else {
				_callback({ failed: true });
			}
		});
	},
	/**
	 * Get all favorite markers
	 * @param {Function} _callback
	 */
	loadFavoriteMarkers: function(_callback) {
		var query = {
			limit: 500,
			include: "userid",
			$relatedTo: {
				object: {
					__type: "Pointer",
					className: "_User",
					objectId: Parse.currentUser
				},
				key: "favorites"
			}
		};

		// Legacy check
		query = Model.legacyQuery(query);

		Parse.query("marker", query, function(_response) {
			if(_response.success && _response.success.results.length > 0) {
				// Cache response
				Model.cacheMarkers( _response.success.results, "favorite");

				_callback({
					success: _response.success.results
				});
			} else {
				_callback({ failed: true });
			}
		});
	},
	/**
	 * Utility method to delete local marker storage
	 */
	deleteAllLocalMarkers: function() {
		App.Map.removeAllMarkers();
		Ti.App.Properties.setObject("markers", {});
	},
	/**
	 * Delete markers by user ID
	 * @param {String} _userId
	 */
	deleteMarkersByUserId: function(_userId) {
		// Delete UI markers
		App.Map.removeAllMarkersByUserId(_userId);

		// Delete cached markers
		var markersData = Ti.App.Properties.getObject("markers");

		for(var prop in markersData) {
			if(markersData[prop].userid.objectId === _userId) {
				delete markersData[prop]
			}
		}

		Ti.App.Properties.setObject("markers", markersData);
	},
	/**
	 * Search all community markers
	 * @param  {String} _value
	 * @param  {String} _markerType Quest|Battle|Commerce etc.
	 * @param  {Function} _callback
	 */
	searchCommunityMarkers: function(_value, _markerType, _callback) {
		var data = {
			share: "Public",
			notes: { "$regex": _value },
			limit: 100
		};

		// Legacy check
		data = Model.legacyQuery(data);

		if(_markerType) {
			data.markerType = _markerType;
		}

		Parse.query("marker", data, function(_response) {
			if(_response.success) {
				// Cache response
				Model.cacheMarkers( _response.success.results, "community");

				_callback({
					success: _response.success.results
				});
			} else {
				_callback( null );
			}
		});
	},
	/**
	 * Create a friend request
	 * @param {String} _username
	 * @param {Function} _callback
	 */
	createFriendRequest: function(_username, _callback) {
		// First check if the user exists
		Parse.getUserByUsername(_username, function(_response) {
			if(_response.success.results.length > 0) {
				var user = _response.success.results[0];

				// ACL permissions
				var ACL = {};
				ACL[user.objectId] = {
					read: true,
					write: true
				};
				ACL[Parse.userObject.objectId] = {
					read: true,
					write: true
				};

				// Grant permission to friend
				Model.allowAccessToFriendObject( user.objectId );

				// Create the friend request record
				Parse.saveObject("friendRequest", {
					toUser: {
						__type: "Pointer",
						className: "_User",
						objectId: user.objectId
					},
					fromUser: {
						__type: "Pointer",
						className: "_User",
						objectId: Parse.userObject.objectId
					},
					status: "Pending"
				}, function(_friendRequestResponse) {
					if(_friendRequestResponse.success) {
						if(_callback) { _callback(); }

						Model.createMessage({
							toUser: user.objectId,
							fromUser: Parse.currentUser,
							messageType: "request",
							data: _friendRequestResponse.success,
							message: Parse.userObject.username + " sent you a friend request."
						});
					} else {
						// TODO handle error
						Ti.API.error("Error creating friend request " + _friendRequestResponse);
					}
				});
			} else {
				Ti.API.error("No user found " + _response);
				Ti.UI.createAlertDialog({
					title: 'No User Exists',
					message: 'Sorry but it looks like that user does not exist.'
				}).show();
			}
		});
	},
	/**
	 * Retrieve all friend requests for current user
	 * @param {Function} _callback
	 */
	getFriendRequests: function(_callback) {
		Parse.query("friendRequest", {
			include: "fromUser,toUser",
			toUser: {
				__type: "Pointer",
				className: "_User",
				objectId: Parse.currentUser
			}
		}, function(_response) {
			if(_response.success) {
				_callback({
					success: _response.success
				});
			} else {
				_callback({
					failed: _response
				});
			}
		});
	},
	/**
	 * Handle accepting a friend request
	 * @param {String} _friendId ObjectId of the friend
	 * @param {String} _friendRequestId ObjectId of the friend request object
	 * @param {Function} _callback
	 */
	acceptFriendRequest: function(_friendId, _friendRequestId, _callback) {		
		// Several requests could be made so this is utility
		function buildRequest(_fromUser, _toUser, _existingObject, _reqCallback) {
			// Existing object for friend
			Parse.updateObject("friends", _existingObject.objectId, {
				friends: {
					__op: "AddRelation",
					objects: [{
						__type: "Pointer",
						className: "_User",
						objectId: _toUser
					}]
				}
			}, function(_req) {
				if(_req.success) {
					_reqCallback({
						success: _req.success
					});
				} else {
					_reqCallback({
						failed: true
					});
				}
			});

			// Delete old friend request record
			Parse.deleteObject("friendRequest", _friendRequestId);
		}

		var existingObject = null;

		// Check if current user object exists and save friend to him
		Parse.query("friends", {
			user: {
				__type: "Pointer",
				className: "_User",
				objectId: Parse.currentUser
			}
		}, function(_response) {
			Ti.API.debug(_response);

			if(_response.success && _response.success.results.length > 0) {
				existingObject = _response.success.results[0];

				// Check if friend object exists and save current user to him
				Parse.query("friends", {
					user: {
						__type: "Pointer",
						className: "_User",
						objectId: _friendId
					}
				}, function(_res) {
					Ti.API.debug(_res);

					if(_res.success && _res.success.results.length > 0) {
						// Create the friend relations if successful (this should be done in cloud code, but we're keeping it all client side for now
						buildRequest(Parse.currentUser, _friendId, existingObject, function(_buildReq) {
							if(_buildReq.success) {
								buildRequest(_friendId, Parse.currentUser, _res.success.results[0], function(_buildTwoReq) {
									if(_buildTwoReq.success) {
										// Send push message about acceptation
										Model.createMessage({
											toUser: _friendId,
											fromUser: Parse.currentUser,
											messageType: "friend",
											message: Parse.userObject.username + " accepted your friend request."
										});

										_callback({
											success: true
										});
									} else {
										_callback({ success: false });
									}
								});
							} else {
								_callback({ success: false });
							}
						});
					} else {
						// If, for some reason the friend object doesn't exist for the other user, create it.
						if(_res.success.results.length == 0) {
							Model.createFriendsObject();
							Model.createFriendsObject(_friendId);
						}

						_callback({ success: false });
					}
				});
			} else {
				// If, for some reason the user friend object doesn't exist for this user, create it.
				if(_response.success.results.length == 0) {
					Model.createFriendsObject();
					Model.createFriendsObject(_friendId);
				}

				_callback({
					success: false,
					why: "missingFriendObject"
				});
			}
		});
	},
	/**
	 * Utility to grant permission to the user's friend object
	 * @param {String} _friendId
	 */
	allowAccessToFriendObject: function(_friendId) {
		Parse.query("friends", {
			user: {
				__type: "Pointer",
				className: "_User",
				objectId: Parse.currentUser
			}
		}, function(_response) {
			if(_response.success && _response.success.results.length > 0) {
				var data = _response.success.results[0];

				data.ACL[_friendId] = {
					read: true,
					write: true
				};

				Parse.updateObject("friends", data.objectId, {
					ACL: data.ACL
				}, function(_res) {
					Ti.API.debug(_res);
				});
			} else {
				// If, for some reason the friend object doesn't exist for this user, create it.
				if(_response.success.results.length == 0) {
					Model.createFriendsObject();
				}
			}
		});
	},
	/**
	 * Utility to create a blank friends object
	 * @param {String} _friendId Optional If you specify a user ID, it will target that user, other wise the current user
	 */
	createFriendsObject: function(_friendId) {
		// First check to see if it exists
		Parse.query("friends", {
			user: {
				__type: "Pointer",
				className: "_User",
				objectId: _friendId || Parse.currentUser
			}
		}, function(_response) {
			Ti.API.debug("Checking Friends Object: ", _response);
			// If it doesn't, create it
			if(_response.success && _response.success.results.length == 0) {
				var ACL = {};
				ACL[Parse.currentUser] = {
					read: true,
					write: true
				};

				if(_friendId) {
					ACL[_friendId] = {
						read: true,
						write: true
					};
				}

				Parse.saveObject("friends", {
					ACL: ACL,
					user: {
						__type: "Pointer",
						className: "_User",
						objectId: _friendId || Parse.currentUser
					}
				}, function(_res) {
					Ti.API.debug("Saving Friends Object: ", _res);
				});
			}
		});
	},
	/**
	 * Get friends
	 * @param {Function} _callback
	 */
	getFriends: function(_callback) {
		Parse.query("friends", {
			user: {
				__type: "Pointer",
				className: "_User",
				objectId: Parse.currentUser
			}
		}, function(_response) {
			Ti.API.debug(_response);
			if(_response.success && _response.success.results.length > 0) {
				Model.getFriendsByFriendClassObjectId(
					_response.success.results[0].objectId,
					_callback || null
				);
			} else {
				// If, for some reason the friend object doesn't exist for this user, create it.
				if(_response.success.results.length == 0) {
					Model.createFriendsObject();
				}

				if(_callback) {
					_callback({ failed: true });
				}
			}
		});
	},
	/**
	 * Get / check if user is friend (based on cached data)
	 * @param {String} _objectId
	 */
	getFriend: function(_objectId) {
		var friendsData = Ti.App.Properties.getObject("friends");
		return friendsData[_objectId];
	},
	/**
	 * Cache friends utility
	 * @param {Array} _data
	 */
	cacheFriends: function(_data) {
		var friendsData = Ti.App.Properties.getObject("friends");

		_data.forEach(function(_friend) {
			friendsData[_friend.objectId] = _friend;
		});

		Ti.App.Properties.setObject("friends", friendsData);
	},
	/**
	 * Utility for getFriends().  Will get the friend relationship column filled out.
	 * @param {String} _objectId ID from the friends class -> object
	 * @param {Function} _callback
	 */
	getFriendsByFriendClassObjectId: function(_objectId, _callback) {
		Parse.queryUsers({
			$relatedTo: {
				object: {
					__type: "Pointer",
					className: "friends",
					objectId: _objectId
				},
				key: "friends"
			}
		}, function(_response) {
			if(_response.success) {
				// Cache friend list
				Model.cacheFriends( _response.success.results );

				if(_callback) {
					_callback({
						success: _response.success
					});
				}
			} else {
				if(_callback) {
					_callback({
						failed: _response
					});
				}
			}
		});
	},
	/**
	 * Delete a friend
	 * @param {String} _friendId
	 * @param {Function} _callback
	 */
	deleteFriend: function(_friendId, _callback) {
		function removeRelation(_objectId, _userId) {
			Parse.updateObject("friends", _objectId, {
				friends: {
					__op: "RemoveRelation",
					objects: [{
						__type: "Pointer",
						className: "_User",
						objectId: _userId
					}]
				}
			});
		}

		// Remove friend from cache
		var friendsData = Ti.App.Properties.getObject("friends");
		delete friendsData[_friendId];
		Ti.App.Properties.setObject("friends", friendsData);

		// Remove friend markers
		Model.deleteMarkersByUserId( _friendId );

		// Check if current user has record and use to delete relation
		Parse.query("friends", {
			user: {
				__type: "Pointer",
				className: "_User",
				objectId: Parse.currentUser
			}
		}, function(_response) {
			if(_response.success.results.length > 0) {
				removeRelation(_response.success.results[0].objectId, _friendId);
			}

			if(_callback) { _callback(); }
		});

		// Check if friend has record and use to delete relation
		Parse.query("friends", {
			user: {
				__type: "Pointer",
				className: "_User",
				objectId: _friendId
			}
		}, function(_response) {
			if(_response.success.results.length > 0) {
				removeRelation(_response.success.results[0].objectId, Parse.currentUser);
			}
		});
	},
	/**
	 * Utility to clean friends from cache
	 */
	clearCachedFriends: function() {
		Ti.App.Properties.setObject("friends", {});
	},
	/**
	 * Get comments by marker ID
	 * @param {String} _markerId
	 * @param {Function} _callback
	 */
	getCommentsByMarkerId: function(_markerId, _callback) {
		Parse.query("comments", {
			include: "user",
			order: "-createdAt",
			marker: {
				__type: "Pointer",
				className: "marker",
				objectId: _markerId
			}
		}, function(_response) {
			if(_response.success && _response.success.results.length > 0) {
				_callback( _response );
			} else {
				if(_callback) {
					_callback({ failed: true });
				}
			}
		});
	},
	/**
	 * Create a comment for a marker
	 * @param {Object} _marker
	 * @param {String} _comment
	 * @param {Function} _callback
	 */
	createComment: function(_marker, _comment, _callback) {
		var _data = {
			user: {
				__type: "Pointer",
				className: "_User",
				objectId: Parse.currentUser
			},
			marker: {
				__type: "Pointer",
				className: "marker",
				objectId: _marker.objectId
			},
			text: _comment
		};

		_data.ACL = {};
		_data.ACL[Parse.currentUser] = {
			read: true,
			write: true
		};
		// Make sure the owner has ability to manage this comment
		_data.ACL[_marker.userid.objectId] = {
			read: true,
			write: true
		};
		_data.ACL["*"] = { read: true };

		Parse.saveObject("comments", _data, function(_response) {
			_callback(_response);

			if(_response.success) {
				// Create a message for this comment
				if(Parse.currentUser !== _marker.userid.objectId) {
					// Register to the comment channel
					Parse.registerChannelForUser(_marker.objectId);

					// Create a message to the owner
					Model.createMessage({
						toUser: _marker.userid.objectId,
						fromUser: Parse.currentUser,
						messageType: "comment",
						data: _marker,
						message: Parse.userObject.username + " posted a new comment"
					});
				} else {
					// Otherwise send a push to subscribers
					Parse.sendPush([_marker.objectId], {
						alert: Parse.userObject.username + " posted a new comment",
						type: "marker",
						content: _marker.objectId
					});
				}
			}
		});
	},
	/**
	 * Delete a marker comment
	 * @param {String} _commentId
	 * @param {Function} _callback
	 */
	deleteComment: function(_commentId, _callback) {
		Parse.deleteObject("comments", _commentId, function(_response) {
			if(_callback) {
				_callback(_response);
			}
		});
	},
	/**
	 * Get all messages for a user
	 * @param {Function} _callback
	 */
	getMessages: function(_callback) {
		Parse.query("messages", {
			toUser: {
				__type: "Pointer",
				className: "_User",
				objectId: Parse.currentUser
			}
		}, function(_response) {
			if(_response.success && _response.success.results && _response.success.results.length > 0) {
				_callback({
					success: _response.success.results
				});

				// Set messages as read (should this go here or in a controller?)
				Model.readMessages(_response.success.results);
			} else {
				_callback({ failed: true });
			}
		});
	},
	/**
	 * Message count
	 * @param {Function} _callback
	 */
	countUnreadMessages: function(_callback) {
		Parse.query("messages", {
			toUser: {
				__type: "Pointer",
				className: "_User",
				objectId: Parse.currentUser
			},
			count: 1,
			limit: 1,
			read: false
		}, function(_response) {
			_callback(_response);
		});
	},
	/**
	 * Create a new message & notification
	 * @param {Object} _payload
	 * @param {Function} _callback
	 */
	createMessage: function(_payload, _callback) {
		Parse.saveObject("messages", {
			toUser: {
				__type: "Pointer",
				className: "_User",
				objectId: _payload.toUser
			},
			fromUser: {
				__type: "Pointer",
				className: "_User",
				objectId: _payload.fromUser
			},
			messageType: _payload.messageType,
			data: _payload.data,
			message: _payload.message,
			read: false
		}, function(_response) {
			Ti.API.debug(_response);

			if(_response.success) {
				var channels = [_payload.toUser];
				if(_payload.channel) {
					channels.push(_payload.channel);
				}

				Parse.sendPush(channels, {
					alert: _payload.message,
					type: _payload.messageType
				});
			}

			if(_callback) {
				_callback(_response);
			}
		});
	},
	/**
	 * Delete a message
	 * @param {String} _messageId
	 * @param {Function} _callback
	 */
	deleteMessage: function(_messageId, _callback) {
		Parse.deleteObject("messages", _messageId, function(_response) {
			if(_callback) {
				_callback(_response);
			}
		});
	},
	/**
	 * Set all messages to read
	 * @param {Array} _messages
	 */
	readMessages: function(_messages) {
		if(_messages) {
			_messages.forEach(function(_message) {
				Parse.updateObject("messages", _message.objectId, {
					read: true
				});
			});
		}
	},
	/**
	 * Handle favoriting a marker
	 * @param {String} _objectId
	 * @param {Function} _callback
	 */
	favoriteMarker: function(_objectId, _callback) {
		Parse.updateUserObject({
			favorites: {
				__op: "AddRelation",
				objects: [{
					__type: "Pointer",
					className: "marker",
					objectId: _objectId
				}]
			}
		}, function(_response) {
			if(_callback) { _callback( _response ); }
		});
	},
	/**
	 * Handle un-favoriting a marker
	 * @param {String} _objectId
	 * @param {Function} _callback
	 */
	unFavoriteMarker: function(_objectId, _callback) {
		Parse.updateUserObject({
			favorites: {
				__op: "RemoveRelation",
				objects: [{
					__type: "Pointer",
					className: "marker",
					objectId: _objectId
				}]
			}
		}, function(_response) {
			if(_callback) { _callback( _response ); }
		});
	},
	/**
	 * Get all community markers for current map
	 * @param {Function} _callback
	 */
	communityFeed: function(_callback) {
		var query = {
			limit: 50,
			order: "-createdAt",
			include: "userid",
			share: "Public"
		};

		query = Model.legacyQuery(query);

		Parse.query("marker", query, function(_response) {
			if(_response.success) {
				if(_callback) {
					_callback({ success: _response.success });
				}
			}
		});
	},
	/**
	 * Get all community comments
	 * @param {Function} _callback
	 */
	communityComments: function(_callback) {
		var query = {
			limit: 50,
			order: "-createdAt",
			include: "user,marker"
		};

		Parse.query("comments", query, function(_response) {
			if(_response.success) {
				if(_callback) {
					_callback({ success: _response.success });
				}
			}
		});
	}
};

module.exports = Model;