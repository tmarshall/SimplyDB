SimplyDB 0.0.1

It's a WIP
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