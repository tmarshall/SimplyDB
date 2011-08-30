var 
	crypto = require('crypto'),
	https = require('https');

function SimplyDB(accessKey, secret) {
	var 
		client,
		dateOffset = null;
	
	if(accessKey === undefined) {
		throw 'No Access Key given';
	}
	if(secret === undefined) {
		throw 'No Secret Key given';
	}
	
	this.listDomains = function(callback, max /* = 100 */, nextToken /* = '' */) {
		if(arguments.length > 1 && (+max < 1 || +max > 100)) {
			throw 'Invalid MaxNumberOfDomains given';
		}
		makeRequest({
			Action: 'ListDomains',
			MaxNumberOfDomains: max,
			NextToken: nextToken
		}, callback);
	};
	
	this.select = function(callback, query, nextToken /* = '' */, consistent /* = true */) {
		makeRequest({
			Action: 'Select',
			SelectExpression: query,
			NextToken: nextToken,
			ConsistentRead: arguments.length > 3 ? consistent : true
		}, callback);
	};
	
	function datetimeISO8601(date) {
		return (date.getUTCFullYear() + '-' + (1 + date.getUTCMonth()) + '-' + (1 + date.getDate()) + 'T' + date.getUTCHours() + ':' + date.getUTCMinutes() + ':' + date.getUTCSeconds() + 'Z').replace(/\D\d{1}\D/g, function(a) {	
			return a[0] + '0' + a.slice(1);
		});
	}
	
	function makeRequest(params, callback, method /* = GET */) {
		var
			keys,
			str,
			i,
			l,
			parts = [],
			queryStr,
			sig,
			tmp;
		
		method = method || 'GET';
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