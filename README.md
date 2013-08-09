# vineapple

### A simple Vine API client for Node.js

*This library provides access to the undocumented official Vine API.*

* Read-only Vine API access to the following endpoints:
	* `users/authenticate` Authenticate/deauthenticate user
	* `users/me` - Account settings for the authenticated user
	* `users/$userId/pendingNotificationsCount` - Count of pending notifications (authenticated user only)
	* `timelines/graph` - Timeline of accounts followed by the authenticated user
	* `users/search/$query` - Search for users
	* `users/profiles/$userId` - User profile
	* `timelines/users/$userId` - Timeline of vines posted by a user
	* `timelines/users/$userId/likes` - Timeline of vines liked by a user
	* `users/$userId/followers` - List of users following a user
	* `users/$userId/following` - List of users followed by a user
	* `users/$userId/following/suggested/twitter` - List of suggested Twitter accounts
	* `timelines/popular` - Timeline of popular vines
	* `timelines/promoted` - Timeline of promoted vines
	* `tags/search/$query` - Search for #hashtags
	* `timelines/tags/$tag` - Timeline of vines by #hashtag
	* `timelines/venues/$venueId` - Timeline of vines by venue
* Flexible API supports Node.js-style callbacks *and* Promises/A+ (via [q](https://github.com/kriskowal/q))
* Pagination support

## Installation
----

### Using NPM

```
npm install vineapple
```
### Using Git

```
git clone https://github.com/furf/vineapple.git
```

## Getting Started
----

```
var Vineapple = require('vineapple');

// Instantiate a Vine API client
var vine = new Vineapple();

// Authenticate the Vine user
vine.login('ananas', 'c0m0$u$', function (error, client) {

	// Make an API request
	client.me(function (error, user) {

		// Handle failure
		if (error) {
    			throw new Error(error);
		 }

		// Handle success
		console.log(user);
	});
  
});
```

## Instantiation
----

A Vineapple API client can be instantiated in one of two ways:

1. Using the Vineapple constructor function.

	```
	var vine = new Vineapple();
	```
2. Using the Vineapple factory method.

	```
	var vine = Vineapple.create();
	```

Which you use is a matter of subjective choice.

## Authentication
----

Before a client can make API requests, it must be authenticated and authorized. Authentication

```
// Instantiate a Vine API client
var vine = new Vineapple();

// Authenticate the user
vine.login('ananas', 'c0m0$u$', function (error, client) {

  // Make an API request
  client.me(function (error, user) {
    // ...
  });
  
});
```

```
Vineapple.login('ananas', 'c0m0$u$', function (error, client) { /* ... */ });
```

## Authenticated Instances
----

In cases where you have cached the user's API settings, you can authorize the client immediately

```
var vine = new Vineapple({
  key: '0123456789abcdef01-23456789-abcd-ef01-2345-6789abcdef01',
  userId: '901234567890123456',
  username: 'Ananas Comosus'
});
```
	
```
var vine = Vineapple.create({
  key: '0123456789abcdef01-23456789-abcd-ef01-2345-6789abcdef01',
  userId: '901234567890123456',
  username: 'Ananas Comosus'
});
```

## Node-style Callbacks vs. Promises
----

In most cases, how you handle the response is a matter of personal preference. This is not the place for that debate. Vineapple is flexible enough to let you leverage both techniques.

### Node-style Callbacks

```
vine.searchTags('skateboarding', function (error, response) {
	
	// Handle failure
	if (error) {
		throw new Error(error);
	}
		
	// Handle success
	var tags = response.records;
	
	tags.forEach(function (t) {
		console.log(t.tag);
	});
});
```

### Promises

```
vine.searchTags('skateboarding').then(function (response) {
		
	// Handle success
	var tags = response.records;
	
	tags.forEach(function (t) {
		console.log(t.tag);
	});

}).fail(function (error) {

	// Handle failure
	if (error) {
		throw new Error(error);
	}
});
```
## API
----
### Static Properties
* #### Vineapple.API_ORIGIN
`"https://api.vineapp.com/"`
* #### Vineapple.X_VINE_CLIENT
`"ios/1.3.1"`
* #### Vineapple.ACCEPT_LANGUAGE
`"en;q=1, fr;q=0.9, de;q=0.8, ja;q=0.7, nl;q=0.6, it;q=0.5"`
* #### Vineapple.USER_AGENT
`"iphone/1.3.1 (iPhone; iOS 6.1.3; Scale/2.00)"`
* #### Vineapple.DEVICE_TOKEN
* #### Vineapple.DEVICE_TOKEN_SEED
`"Ananas comosus"`

### Static Methods

* #### new Vineapple(_client_)
#### Vineapple.create(_client_)
* #### Vineapple.login(username, password_, callback_)

### Instance Methods
* #### vineapple.request(options_, callback_)
* #### vineapple.login(username, password_, callback_)
* #### vineapple.logout(_callback_)
* #### vineapple.authorize(settings)
* #### vineapple.me(_callback_)
`users/me` - Account settings for the authenticated user
* #### vineapple.notifications(_callback_)
`users/$userId/pendingNotificationsCount` - Count of pending notifications (authenticated user only)
* #### vineapple.graph(options_, callback_)
`timelines/graph` - Timeline of accounts followed by the authenticated user
* #### vineapple.searchUsers(query_, options, callback_)
`users/search/$query` - Search for users
* #### vineapple.profile(userId_, callback_)
`users/profiles/$userId` - User profile
* #### vineapple.user(userId_, options, callback_)
`timelines/users/$userId` - Timeline of vines posted by a user
* #### vineapple.likes(userId_, options, callback_)
`timelines/users/$userId/likes` - Timeline of vines liked by a user
* #### vineapple.followers(userId_, options, callback_)
`users/$userId/followers` - List of users following a user
* #### vineapple.following(userId_, options, callback_)
`users/$userId/following` - List of users followed by a user
* #### vineapple.twitter(userId_, callback_)
`users/$userId/following/suggested/twitter` - List of suggested Twitter accounts
* #### vineapple.popular(_options, callback_)
`timelines/popular` - Timeline of popular vines
* #### vineapple.promoted(_options, callback_)
`timelines/promoted` - Timeline of promoted vines
* #### vineapple.searchTags(query_, options, callback_)
`tags/search/$query` - Search for #hashtags
* #### vineapple.tag(tag_, options, callback_)
`timelines/tags/$tag` - Timeline of vines by #hashtag
* #### vineapple.venue(venue_, options, callback_)
`timelines/venues/$venueId` - Timeline of vines by venue


## etc.
----
* Licence: MIT
* Author [Dave Furfero](https://github.com/furf)