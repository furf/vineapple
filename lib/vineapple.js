/**
  * Vineapple
  * A simple Vine API client for Node.js
  * @author Dave Furfero
  * @license MIT
  */

/**
 * Requires
 */
var pkginfo = require('pkginfo');
var _ = require('lodash');
var util = require('util');
var q = require('q');
var request = require('request');

/**
 * Construct a Vineapple client instance
 */
function Vineapple () {
  this.initialize();
}

/**
 * {String} root url for Vine API "services"
 */
Vineapple.API_ORIGIN = 'https://api.vineapp.com/';

/**
 * {String} device token (does not seem to matter)
 */
// Vineapple.DEVICE_TOKEN = 'Vine';

/**
 * {String} mobile User-Agent header
 */
Vineapple.USER_AGENT = 'com.vine.iphone/1.0.3 (unknown, iPhone OS 6.0.1, iPhone, Scale/2.000000)';

/**
 * {String} Accept-Language header
 */
Vineapple.ACCEPT_LANGUAGE = 'en, sv, fr, de, ja, nl, it, es, pt, pt-PT, da, fi, nb, ko, zh-Hans, zh-Hant, ru, pl, tr, uk, ar, hr, cs, el, he, ro, sk, th, id, ms, en-GB, ca, hu, vi, en-us;q=0.8';

/**
 * Vineapple client prototype
 */
Vineapple.prototype = {

  /**
   * @param options {Object|String}
   * @return {Object} request API promise
   */
  request: function (options) {

    var defer = q.defer();

    // Configure request options
    options = typeof options === 'string' ? { url: options } : _.clone(options);

    // Prepend API origin to path
    options.url = Vineapple.API_ORIGIN + options.url;

    // Clone headers and apply default values
    options.headers = _.defaults({}, options.headers, {
      headers: {
        'User-Agent': Vineapple.USER_AGENT,
        'Accept-Language': Vineapple.ACCEPT_LANGUAGE
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
        body = body.replace(/"userId":(\s*)(\d*)/g, '"userId":$1"$2"');

        body = JSON.parse(body);

        // API has returned an error, reject the promise
        if (body.error) {
          return defer.reject(new Error(body.error));
        }

        // Response body was parsed successfully, resolve the promise
        // with the data property
        defer.resolve(body.data);

      // body did not contain valid JSON, reject the promise
      } catch (error) {
        return defer.reject(new Error(error));
      }

    });

    return defer.promise;
  },

  /**
   * Authenticate the Vine API client
   * @param username {String}
   * @param password {String}
   * @return {Object} request API promise
   */
  login: function (username, password) {

    var request;

    // Preemptively validate username and password
    if (!username) {
      throw new Error('Invalid credentials. Missing username.');
    }

    if (!password) {
      throw new Error('Invalid credentials. Missing password.');
    }

    // Re-initialize the client
    this.initialize();

    // Execute the API request for authentication
    request = this.request({
      method: 'post',
      url: 'users/authenticate',
      form: {
        // deviceToken: Vineapple.DEVICE_TOKEN,
        username: username,
        password: password
      }
    });

    return request.then(this.authorize.bind(this));
  },

  /**
   * De-authenticate the Vine API client
   * @param username {String}
   * @param password {String}
   * @return {Object} request API promise
   */
  logout: function () {
    return this.request({
      method: 'delete',
      url: 'users/authenticate'
    }).then(this.initialize.bind(this));
  },

  /**
   * Authorize the current client
   * @param data {Object}
   * @return {Object} self
   */
  authorize: function (data) {
    this.key = data.key;
    this.userId = data.userId;
    this.username = data.username;
    return this;
  },

  /**
   * Initialize/de-authorize the current client
   * @return {Object} self
   */
  initialize: function () {
    this.key = null;
    this.userId = null;
    this.username = null;
    return this;
  },

  /**
   * Vine API
   */

  /**
   * @return {Object} request API promise
   */
  me: function () {
    return this.request('users/me');
  },

  /**
   * @param options {Object}
   *    - page {Number} 1
   *    - size {Number} 20
   * @return {Object} request API promise
   */
  graph: function (options) {
    return this.request({
      url: 'timelines/graph',
      qs: options
    });
  },

  /**
   * @return {Object} request API promise
   */
  notifications: function () {
    return this.request(util.format('users/%s/pendingNotificationsCount', this.userId));
  },

  /**
   * @param userId {Number|String}
   * @return {Object} request API promise
   */
  profile: function (userId) {
    return this.request(util.format('users/profiles/%s', userId));
  },

  /**
   * @param userId {Number|String}
   * @param options {Object}
   *    - page {Number} 1
   *    - size {Number} 20
   * @return {Object} request API promise
   */
  user: function (userId, options) {
    return this.request({
      url: util.format('timelines/users/%s', userId),
      qs: options
    });
  },

  /**
   * @param userId {Number|String}
   * @param options {Object}
   *    - page {Number} 1
   *    - size {Number} 20
   * @return {Object} request API promise
   */
  likes: function (userId, options) {
    return this.request({
      url: util.format('timelines/users/%s/likes', userId),
      qs: options
    });
  },

  /**
   * @param userId {Number|String}
   * @return {Object} request API promise
   */
  twitter: function (userId) {
    return this.request(util.format('users/%s/following/suggested/twitter', userId));
  },

  /**
   * @param userId {Number|String}
   * @param options {Object}
   *    - page {Number} 1
   *    - size {Number} 20
   * @return {Object} request API promise
   */
  followers: function (userId, options) {
    return this.request({
      url: util.format('users/%s/followers', userId),
      qs: options
    });
  },

  /**
   * @param userId {Number|String}
   * @param options {Object}
   *    - page {Number} 1
   *    - size {Number} 20
   * @return {Object} request API promise
   */
  following: function (userId, options) {
    return this.request({
      url: util.format('users/%s/following', userId),
      qs: options
    });
  },

  /**
   * @param query {String}
   * @param options {Object}
   *    - page {Number} 1
   *    - size {Number} 20
   * @return {Object} request API promise
   */
  searchTags: function (query, options) {
    return this.request({
      url: util.format('tags/search/%s', query),
      qs: options
    });
  },

  /**
   * @param query {String}
   * @param options {Object}
   *    - page {Number} 1
   * @return {Object} request API promise
   */
  searchUsers: function (query, options) {
    return this.request({
      url: util.format('users/search/%s', query),
      qs: options
    });
  },

  /**
   * @param options {Object}
   *    - page {Number} 1
   *    - size {Number} 20
   * @return {Object} request API promise
   */
  popular: function (options) {
    return this.request({
      url: 'timelines/popular',
      qs: options
    });
  },

  /**
   * @param options {Object}
   *    - page {Number} 1
   *    - size {Number} 20
   * @return {Object} request API promise
   */
  promoted: function (options) {
    return this.request({
      url: 'timelines/promoted',
      qs: options
    });
  },

  /**
   * @param query {String}
   * @param options {Object}
   *    - page {Number} 1
   *    - size {Number} 20
   * @return {Object} request API promise
   */
  tag: function (tag, options) {
    return this.request({
      url: util.format('timelines/tags/%s', tag),
      qs: options
    });
  },

  /**
   * @param query {String}
   * @param options {Object}
   *    - page {Number} 1
   *    - size {Number} 20
   * @return {Object} request API promise
   */
  venue: function (venue, options) {
    return this.request({
      url: util.format('timelines/venues/%s', venue),
      qs: options
    });
  }
};

/**
 * @param username {String}
 * @param password {String}
 * @return {Object} request API promise
 */
Vineapple.login = function (username, password) {
  var client = new Vineapple();
  return client.login(username, password);
};

module.exports = Vineapple;
pkginfo(module);