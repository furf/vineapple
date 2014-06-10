/**
  * Vineapple
  * A simple Vine API client for Node.js
  * @author Dave Furfero
  * @license MIT
  */

/**
 * Dependencies
 */
var pkginfo = require('pkginfo');   // https://github.com/indexzero/node-pkginfo
var _ = require('lodash');          // https://github.com/bestiejs/lodash
var util = require('util');         // http://nodejs.org/api/util.html
var crypto = require('crypto');     // http://nodejs.org/api/crypto.html
var q = require('q');               // https://github.com/kriskowal/q
var request = require('request');   // https://github.com/mikeal/request

/**
 * {Object} Regular expression to search Vine IDs
 */
var VINE_ID_SEARCH = /("(?:(?:(?:comment|like|post|tag|user|venue)I)|i)d":\s*)(\d*)(,)?/g;

/**
 * {Object} Regular expression to search Vine IDs
 */
var VINE_ID_REPLACE = '$1"$2"$3';

/**
 * @param settings {Object} [optional]
 *    - key {String}
 *    - userId {String}
 *    - username {String}
 * @return {Object} a Vineapple instance
 */
function Vineapple (settings) {
  this.authorize(settings);
}

/**
 * {String} root url for Vine API
 */
Vineapple.API_ORIGIN = 'https://api.vineapp.com/';

/**
 * {String} Accept-Language header
 */
Vineapple.ACCEPT_LANGUAGE = 'en;q=1, fr;q=0.9, de;q=0.8, ja;q=0.7, nl;q=0.6, it;q=0.5';

/**
 * {String} User-Agent header
 */
Vineapple.USER_AGENT = 'iphone/1.3.1 (iPhone; iOS 6.1.3; Scale/2.00)';

/**
 * {String} X-Vine-Client header
 */
Vineapple.X_VINE_CLIENT = 'ios/1.3.1';

/**
 * {String} deviceToken parameter
 */
Vineapple.DEVICE_TOKEN = '';

/**
 * {String} SHA256 seed for generated deviceToken
 */
Vineapple.DEVICE_TOKEN_SEED = 'Ananas comosus';

/**
 * Vineapple client prototype
 */
Vineapple.prototype = {

  /**
   * @param options {Object|String}
   * @return {Object} request API promise
   */
  request: function (options, callback) {

    var defer = q.defer();
    var promise = defer.promise;

    // Configure request options
    options = typeof options === 'string' ? { url: options } : _.clone(options);

    // Prepend API origin to path
    options.url = Vineapple.API_ORIGIN + options.url;

    // Clone headers and apply default values
    options.headers = _.defaults({}, options.headers, {
      headers: {
        'X-Vine-Client': Vineapple.X_VINE_CLIENT,
        'Accept-Language': Vineapple.ACCEPT_LANGUAGE,
        'User-Agent': Vineapple.USER_AGENT
      }
    });

    // Valid sessions require a vine-session-id header
    if (this.key) {
      options.headers['vine-session-id'] = this.key;
    }

    // Execute request
    request(options, function (error, response, body) {

      var data;

      // request has returned an error, reject the promise
      if (error) {
        return defer.reject(new Error(error));
      }

      // Attempt to parse the response body as JSON
      try {

        // @important Vine user IDs are stored as numbers
        // that exceed JavaScript's Number.MAX_VALUE and
        // do not parse properly. Therefore, we wrap them
        // in quotes so they can be parsed as strings.
        // Note: this is probably true for other IDs.
        body = body.replace(VINE_ID_SEARCH, VINE_ID_REPLACE);

        data = JSON.parse(body);

        // API has returned an error, reject the promise
        if (data.error) {
          return defer.reject(new Error(data.error));
        }

        // Response body was parsed successfully, resolve the promise
        // with the data property
        defer.resolve(data.data);

      // body did not contain valid JSON, reject the promise
      } catch (error) {
        return defer.reject(new Error(error));
      }

    });

    if (callback) {
      promise.then(callback.bind(null, null)).fail(callback);
    }

    return promise;
  },

  /**
   * Authenticate the Vine API client
   * @param username {String}
   * @param password {String}
   * @param callback {Function} [optional]
   * @return {Object} request API promise
   */
  login: function (username, password, callback) {

    var request;
    var promise;

    // Preemptively validate username and password
    if (!username) {
      throw new Error('Invalid credentials. Missing username.');
    }

    if (!password) {
      throw new Error('Invalid credentials. Missing password.');
    }

    // Execute the API request for authentication
    request = this.request({
      method: 'post',
      url: 'users/authenticate',
      form: {
        deviceToken: Vineapple.DEVICE_TOKEN || createDeviceToken([
          Vineapple.DEVICE_TOKEN_SEED,
          username,
          password
        ].join(':')),
        username: username,
        password: password
      }
    });

    promise = request.then(this.authorize.bind(this));

    if (callback) {
      promise.then(callback.bind(null, null)).fail(callback);
    }

    return promise;
  },

  /**
   * De-authenticate the Vine API client
   * @param username {String}
   * @param password {String}
   * @param callback {Function} [optional]
   * @return {Object} request API promise
   */
  logout: function (callback) {

    var promise = this.request({
      method: 'delete',
      url: 'users/authenticate'
    }).then(this.authorize.bind(this));

    if (callback) {
      promise.then(callback.bind(null, null)).fail(callback);
    }

    return promise;
  },

  /**
   * Authorize the current client
   * @param settings {Object}
   * @return {Object} self
   */
  authorize: function (settings) {
    this.key = settings && settings.key;
    this.userId = settings && settings.userId;
    this.username = settings && settings.username;
    return this;
  },

  /**
   * Vine API
   */

  /**
   * @param callback {Function} [optional]
   * @return {Object} request API promise
   */
  me: function (callback) {
    return this.request('users/me', callback);
  },

  /**
   * @param options {Object}
   *    - page {Number} 1
   *    - size {Number} 20
   * @param callback {Function} [optional]
   * @return {Object} request API promise
   */
  graph: function (options, callback) {

    if (typeof options === 'function') {
      callback = options;
      options = {};
    }

    return this.request({
      url: 'timelines/graph',
      qs: options
    }, callback);
  },

  /**
   * @param callback {Function} [optional]
   * @return {Object} request API promise
   */
  notifications: function (callback) {
    return this.request(util.format('users/%s/pendingNotificationsCount', this.userId), callback);
  },

  /**
   * @param userId {Number|String}
   * @param callback {Function} [optional]
   * @return {Object} request API promise
   */
  profile: function (userId, callback) {
    return this.request(util.format('users/profiles/%s', userId), callback);
  },

  /**
   * @param userId {Number|String}
   * @param options {Object}
   *    - page {Number} 1
   *    - size {Number} 20
   * @param callback {Function} [optional]
   * @return {Object} request API promise
   */
  user: function (userId, options, callback) {

    if (typeof options === 'function') {
      callback = options;
      options = {};
    }

    return this.request({
      url: util.format('timelines/users/%s', userId),
      qs: options
    }, callback);
  },

  /**
   * @param userId {Number|String}
   * @param options {Object}
   *    - page {Number} 1
   *    - size {Number} 20
   * @param callback {Function} [optional]
   * @return {Object} request API promise
   */
  likes: function (userId, options, callback) {

    if (typeof options === 'function') {
      callback = options;
      options = {};
    }

    return this.request({
      url: util.format('timelines/users/%s/likes', userId),
      qs: options
    }, callback);
  },

  /**
   * @param postId {Number|String}
   * @param callback {Function} [optional]
   * @return {Object} request API promise
   */
  like: function (postId, callback) {
    return this.request({
      method: 'post',
      url: util.format('posts/%s/likes', postId)
    }, callback);
  },

  /**
   * @param postId {Number|String}
   * @param callback {Function} [optional]
   * @return {Object} request API promise
   */
  unlike: function (postId, callback) {
    return this.request({
      method: 'delete',
      url: util.format('posts/%s/likes', postId)
    }, callback);
  },

  /**
   * @param userId {Number|String}
   * @param callback {Function} [optional]
   * @return {Object} request API promise
   */
  twitter: function (userId, callback) {
    return this.request(util.format('users/%s/following/suggested/twitter', userId), callback);
  },

  /**
   * @param userId {Number|String}
   * @param options {Object}
   *    - page {Number} 1
   *    - size {Number} 20
   * @param callback {Function} [optional]
   * @return {Object} request API promise
   */
  followers: function (userId, options, callback) {

    if (typeof options === 'function') {
      callback = options;
      options = {};
    }

    return this.request({
      url: util.format('users/%s/followers', userId),
      qs: options
    }, callback);
  },

  /**
   * @param userId {Number|String}
   * @param options {Object}
   *    - page {Number} 1
   *    - size {Number} 20
   * @param callback {Function} [optional]
   * @return {Object} request API promise
   */
  following: function (userId, options, callback) {

    if (typeof options === 'function') {
      callback = options;
      options = {};
    }

    return this.request({
      url: util.format('users/%s/following', userId),
      qs: options
    }, callback);
  },

  /**
   * @param query {String}
   * @param options {Object}
   *    - page {Number} 1
   *    - size {Number} 20
   * @param callback {Function} [optional]
   * @return {Object} request API promise
   */
  searchTags: function (query, options, callback) {

    if (typeof options === 'function') {
      callback = options;
      options = {};
    }

    return this.request({
      url: util.format('tags/search/%s', query),
      qs: options
    }, callback);
  },

  /**
   * @param query {String}
   * @param options {Object}
   *    - page {Number} 1
   * @param callback {Function} [optional]
   * @return {Object} request API promise
   */
  searchUsers: function (query, options, callback) {

    if (typeof options === 'function') {
      callback = options;
      options = {};
    }

    return this.request({
      url: util.format('users/search/%s', query),
      qs: options
    }, callback);
  },

  /**
   * @param options {Object}
   *    - page {Number} 1
   *    - size {Number} 20
   * @param callback {Function} [optional]
   * @return {Object} request API promise
   */
  popular: function (options, callback) {

    if (typeof options === 'function') {
      callback = options;
      options = {};
    }

    return this.request({
      url: 'timelines/popular',
      qs: options
    }, callback);
  },

  /**
   * @param options {Object}
   *    - page {Number} 1
   *    - size {Number} 20
   * @param callback {Function} [optional]
   * @return {Object} request API promise
   */
  promoted: function (options, callback) {

    if (typeof options === 'function') {
      callback = options;
      options = {};
    }

    return this.request({
      url: 'timelines/promoted',
      qs: options
    }, callback);
  },

  /**
   * @param query {String}
   * @param options {Object}
   *    - page {Number} 1
   *    - size {Number} 20
   * @param callback {Function} [optional]
   * @return {Object} request API promise
   */
  tag: function (tag, options, callback) {

    if (typeof options === 'function') {
      callback = options;
      options = {};
    }

    return this.request({
      url: util.format('timelines/tags/%s', tag),
      qs: options
    }, callback);
  },

  /**
   * @param query {String}
   * @param options {Object}
   *    - page {Number} 1
   *    - size {Number} 20
   * @param callback {Function} [optional]
   * @return {Object} request API promise
   */
  venue: function (venue, options, callback) {

    if (typeof options === 'function') {
      callback = options;
      options = {};
    }

    return this.request({
      url: util.format('timelines/venues/%s', venue),
      qs: options
    }, callback);
  }
};

/**
 * @param settings {Object} [optional]
 *    - key {String}
 *    - userId {String}
 *    - username {String}
 * @return {Object} a Vineapple instance
 */
Vineapple.create = function (settings) {
  return new Vineapple(settings);
};

/**
 * @param username {String}
 * @param password {String}
 * @param callback {Function} [optional]
 * @return {Object} request API promise
 */
Vineapple.login = function (username, password, callback) {
  var client = new Vineapple();
  return client.login(username, password, callback);
};

/**
 * @param token {String}
 * @return {String} 64-character device token
 */
function createDeviceToken (token) {
  var sha256 = crypto.createHash('sha256');
  sha256.update(token);
  return sha256.digest('hex');
}

module.exports = Vineapple;
pkginfo(module);
