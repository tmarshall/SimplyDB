var 
	crypto = require('crypto'),
	https = require('https');

function SimplyDB(accessKey, secret) {
	var 
		client,
		dateOffset = null,
		reg = {
			domain: /^[a-zA-Z0-9_\-\.]+$/
		};
	
	if(accessKey === undefined) {
		throw 'No Access Key given';
	}
	if(secret === undefined) {
		throw 'No Secret Key given';
	}
	
	this.createDomain = function(domain, callback) {
		return domainRequest('CreateDomain', domain, callback);
	};
	
	this.deleteDomain = function(domain, callback) {
		return domainRequest('DeleteDomain', domain, callback);
	};
	
	this.domainMetadata = function(domain, callback) {
		return domainRequest('DomainMetadata', domain, callback);
	};
	
	this.listDomains = function(a, b, c /* callback || nextToken, callback || nextToken, max, callback */) {
		if(a === undefined) {
			throw 'No callback given';
		}
		
		var
			argLen = arguments.length,
			callback = arguments[argLen - 1],
			nextToken = argLen >= 2 ? a : '',
			max = argLen >= 3 ? +b : 100;
		
		if(max < 1 || max > 100) {
			throw 'Invalid MaxNumberOfDomains given';
		}
		makeRequest({
			Action: 'ListDomains',
			MaxNumberOfDomains: max,
			NextToken: nextToken
		}, callback);
	};
	
	this.select = function(query, b, c, d /* query, callback || query, nextToken, callback || query, nextToken, consistent, callback */) {
		if(query === undefined) {
			throw 'No query given';
		}
		else if(b === undefined) {
			throw 'No callback given';
		}
		
		var
			argLen = arguments.length,
			callback = arguments[argLen - 1],
			nextToken = argLen >= 3 ? b : '',
			consistent = argLen >= 4 ? c : true;
		
		makeRequest({
			Action: 'Select',
			SelectExpression: query,
			NextToken: nextToken,
			ConsistentRead: consistent
		}, callback);
	};
	
	function datetimeISO8601(date) {
		return (date.getUTCFullYear() + '-' + (1 + date.getUTCMonth()) + '-' + (1 + date.getDate()) + 'T' + date.getUTCHours() + ':' + date.getUTCMinutes() + ':' + date.getUTCSeconds() + 'Z').replace(/\D\d{1}\D/g, function(a) {	
			return a[0] + '0' + a.slice(1);
		});
	}
	
	function domainRequest(action, domain, callback) {
		if(domain === undefined) {
			throw 'Must provide a DomainName';
		}
		if(reg.domain.test(domain) === false) {
			throw 'Invalid DomainName provided';
		}
		makeRequest({
			Action: action,
			DomainName: domain
		}, callback);
	}
	
	function makeRequest(params, b, c /* params, callback || params, method, callback */) {
		var
			keys,
			str,
			i,
			l,
			parts = [],
			queryStr,
			sig,
			tmp,
			method = c === undefined ? 'GET' : b,
			callback = c === undefined ? b : c;
		
		params.Timestamp = datetimeISO8601(new Date());
		params.AWSAccessKeyId = accessKey;
		params.Version = '2009-04-15';
		params.SignatureVersion = 2;
		params.SignatureMethod = 'HmacSHA1';
		
		keys = Object.keys(params).sort(function(a, b) {
			return a > b;
		});
		
		for(i = 0, l = keys.length; i < l; i++) {
			if((tmp = params[keys[i]]) === undefined || tmp === null) {
				continue;
			}
			parts.push(keys[i] + '=' + urlEncode(tmp));
		}
		
		queryStr = parts.join('&');
		sig = crypto
			.createHmac('SHA1', secret)
			.update(method + '\nsdb.amazonaws.com\n/\n' + queryStr)
			.digest('base64');
		queryStr += '&Signature=' + urlEncode(sig);
		
		console.log(queryStr);
		console.log(params.Timestamp);
		console.log(sig);
		
		https[method.toLowerCase()]({
			host: 'sdb.amazonaws.com',
			path: '/?' + queryStr
		}, function(res) {
			res.on('data', function(data) {
				callback(null, data.toString('utf-8'));
			});
		}).on('error', function(err) {
			callback(err);
		});
	}
	
	function urlEncode(str) {
		return encodeURIComponent(str)
			.replace(/!/g, '%21')
			.replace(/'/g, '%27')
			.replace(/\(/g, '%28')
			.replace(/\)/g, '%29')
			.replace(/\*/g, '%2A');
	}
}

module.exports = SimplyDB;