SimplyDB 0.0.1
============

## What's SimplyDB?

SimplyDB is an Amazon [SimpleDB](http://aws.amazon.com/simpledb/) module for Node.js.

## Dependencies

SimplyDB requires two modules. Those being crypto and https.

## Connecting to SimpleDB

Connecting to SimpleDB takes place when initializing a new instance of the module.

```javascript
var SimplyDB = require('simplydb');
var sdbClient = new SimplyDB('yourAWSAccessKey', 'yourAWSSecret');
```
## Creating Domains

.createDomain takes two arguments. The name of the domain to create and a callback function.

```javascript
sdbClient.createDomain('MyDomain', function(err, response) {
	// err and response will be in xml, as given by Amazon
});
```

## Deleting Domains

.deleteDomain takes two arguments, just like .createDomain. A name of a domain to be deleted and a callback function.

```javascript
sdbClient.deleteDomain('MyDomain', function(err, response) {});
```

## Domain Metadata

You can get domain metadata using .domainMetadata, taking the same arguments as .createDomain.

```javascript
sdbClient.domainMetadata('MyDomain', function(err, response) {});
```

## Listing Domains

Listing domains has a few different ways to pass arguments.

```javascript
// using just a callback
sdbClient.listDomains(function(err, response) {});

// with a next token and callback
sdbClient.listDomains('abcd', function(err, response) {});

// with a next token, max number of domains to return and callback
sdbClient.listDomains('abcd', 10, function(err, response) {});
```

The next token defaults to ''

The max number of domains defaults to 100

## Putting Attributes

You can use .putAttributes for single items or .batchPutAttributes for multiple items from the same domain (limited, by Amazon, to 25 items per batch).

When batching you can only put to a single domain.

```javascript
// a typical put
sdbClient.putAttributes('TV_Shows', 'Dexter', {
	Genre: {
		Value: 'Drama'
	},
	Season: {
		Value: 6,
		Replace: true
	}
}, function(err, response) {});

// a bit more specific
sdbClient.putAttributes('TV_Shows', 'Misfits', {
	Genre: {
		Value: ['Drama', 'Comedy'],
		Replace: true,
		Exists: true
	},
	Season: {
		Value: 2,
		Replace: true,
		Expected: 1
	}
});

// batching your puts
sdbClient.batchPutAttributes('TV_Shows', {
	'How I Met Your Mother': {
		Season: {
			Value: 7
		}
	},
	Community: {
		Season: {
			Value: 3
		}
	},
	'Parks and Recreation: {
		Season: {
			Value: 4,
			Replace: true
		}
	}
});
```

Note that you can't use Exists and Expected in batched puts.

## Deleting Attributes

As with putting, there are two ways in which you can delete attributes. Using .deleteAttributes and .batchDeleteAttributes.

```javascript
// a typical delete
sdbClient.deleteAttributes('TV_Shows', 'Lost', {
	Network: {
		Value: 'ABC'
	}
}, function(err, response) {});

// deleting all attributes for an item, which will effectively remove the item
sdbClient.deleteAttributes('TV_Shows', 'Lost', function(err, response) {});

// a bit more specific
sdbClient.deleteAttributes('TV_Shows', 'Lost', {
	Smoke: {
		Expected: 'Monster'
	},
	Cast: {
		Values: ['Michelle Rodriguez', 'Cynthia Watros'],
		Exists: true
	}
}, function(err, response) {});

// batching your deletes
sdbClient.batchDeleteAttributes('TV_Shows', {
	'Arrested Development': {},
	'The IT Crowd: {
		Cast: {
			Value: ['Noel Fielding', 'Chris Morris']
		}
	},
	Dexter: {
		Cast: {
			Value: 'Erik King'
		}
	}
}, function(err, response) {});
```

## Selecting

Selecting from a domain also has a few different ways to pass arguments.

```javascript
// using a query and callback
sdbClient.select('SELECT * FROM MyDomain', function(err, response) {});

// with a query, next token and callback
sdbClient.select('SELECT * FROM MyDomain', 'abcd', function(err, response) {});

// with a query, next token, consistency and callback
sdbClient.select('SELECT * FROM MyDomain', 'abcd', true, function(err, response) {});
```

The next token defaults to ''

The consistency defaults to true

***Important!*** The consistency defaults to true, meaning that queries ensure that the data returned is up-to-date. If consistency is set to false there is a chance that a query will return stale data from a server that has yet to be updated. Ensuring consistency does add a bit of overhead to each query. If you are worried about speed and cost, and are okay with the chance of encountering stale data then you might want to set consistency to false.