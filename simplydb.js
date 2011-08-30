var 
	crypto = require('crypto'),
	https = require('https');

function SimplyDB(accessKey, secret) {
	var 
		client,
		dateOffset = null;
	
	if(accessKey === undefined) {
		throw "No Access Key given";
	}
	if(secret === undefined) {
		throw "No Secret Key given";
	}
	
	this.select = function(query, nextToken /* = '' */, consistent /* = true */) {
		makeRequest({
			SelectExpression: query,
			ConsistentRead: arguments.length > 2 ? consistent : true,
			Action: 'Select'
		});
	};
	
	function datetimeISO8601(date) {
		return (date.getUTCFullYear() + '-' + (1 + date.getUTCMonth()) + '-' + (1 + date.getDate()) + 'T' + date.getUTCHours() + ':' + date.getUTCMinutes() + ':' + date.getUTCSeconds() + 'Z').replace(/\D\d\D/g, function(a, b) {	
			return a[0] + '0' + a.slice(1);
		});
	}
	
	function makeRequest(params, method /* = GET */) {
		var
			keys,
			str,
			i,
			l,
			parts = [],
			queryStr;
		
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
			if(params[keys[i]] === null) {
				continue;
			}
			parts.push(keys[i] + '=' + urlEncode(params[keys[i]]));
		}
		queryStr = parts.join('&');
		
		params.Signature = crypto
			.createHmac('SHA1', secret)
			.update(method + '\nsdb.amazonaws.com\n/\n' + queryStr)
			.digest('base64');
		
		queryStr += '&Signature=' + urlEncode(params.Signature);
		
		console.log(params.Signature);
		console.log('...');
		
		https[method.toLowerCase()]({
			host: 'sdb.amazonaws.com',
			path: '/?' + queryStr
		}, function(res) {
			console.log("statusCode: ", res.statusCode);
			console.log("headers: ", res.headers);
			
			res.on('data', function(d) {
				console.log(d.toString('utf-8'));
			});
		}).on('error', function(e) {
			console.error(e);
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