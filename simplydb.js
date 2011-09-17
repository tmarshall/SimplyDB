var 
	crypto = require('crypto'),
	https = require('https');

function SimplyDB(accessKey, secret) {
	var 
		client,
		dateOffset = null,
		reg = {
			domain: /^[a-zA-Z0-9_\-\.]+$/,
			datetime: /\D\d(?!\d)/g,
			uri: /(!|'|\(|\)|\*)/g
		},
		uriReplacements = {
			'!': '%21',
			'\'': '%27',
			'(': '%28',
			')': '%29',
			'*': '%2A'
		};
	
	if(accessKey === undefined) {
		throw 'No Access Key given';
	}
	if(secret === undefined) {
		throw 'No Secret Key given';
	}
	
	this.batchDeleteAttributes = function(domain, data, callback) {
		callback = callback || function() {};
		return batchAttributesRequest('BatchDeleteAttributes', domain, data, callback);
	};
	
	this.batchPutAttributes = function(domain, data, callback) {
		callback = callback || function() {};
		return batchAttributesRequest('BatchPutAttributes', domain, data, callback);
	};
	
	this.createDomain = function(domain, callback) {
		callback = callback || function() {};
		return domainRequest('CreateDomain', domain, callback);
	};
	
	this.deleteAttributes = function(domain, itemName, c, d) {
		var 
			attributes = typeof c === 'object' ? c : {},
			callback = typeof c === 'function' ? c :
				typeof d === 'function' ? d :
				function() {};
					
		return attributesRequest('DeleteAttributes', domain, itemName, attributes, callback);
	};
	
	this.deleteDomain = function(domain, callback) {
		callback = callback || function() {};
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
		
		return makeRequest({
			Action: 'ListDomains',
			MaxNumberOfDomains: max,
			NextToken: nextToken
		}, callback);
	};
	
	this.putAttributes = function(domain, itemName, attributes, callback) {
		callback = callback || function() {};
		return attributesRequest('PutAttributes', domain, itemName, attributes, callback);
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
		
		return makeRequest({
			Action: 'Select',
			SelectExpression: query,
			NextToken: nextToken,
			ConsistentRead: consistent
		}, callback);
	};
	
	function attributesRequest(action, domain, itemName, attributes, callback) {
		var 
			requestObj = {
				Action: action,
				DomainName: domain,
				ItemName: itemName
			},
			key,
			i = 0,
			q,
			w,
			expectedi = 0,
			attr,
			isArr;
			
		if(callback === undefined) {
			throw 'Missing parameters';
		}
				
		for(key in attributes) {
			for(q = 0, w = (isArr = typeof (attr = attributes[key]).Value === 'object' && typeof attr.Value.length === 'number') ? attr.Value.length : 1; q < w; q++) {
				i++;
				requestObj['Attribute.' + i + '.Name'] = key;
				requestObj['Attribute.' + i + '.Value'] = isArr ? attr.Value[q] : attr.Value;
				if(attr.Replace !== undefined) {
					requestObj['Attribute.' + i + '.Replace'] = attr.Replace;
				}
				if(attr.Expected !== undefined) {
					expectedi++;
					requestObj['Expected.' + expectedi + '.Name'] = key;
					if(attr.Expected.Value !== undefined && (attr.Expected.Exists === undefined || attr.Expected.Exists === true)) {
						requestObj['Attribute.' + expectedi + '.Value'] = attr.Expected.Value;
					}
					if(attr.Expected.Exists !== undefined) {
						requestObj['Attribute.' + expectedi + '.Exists'] = attr.Expected.Exists;
					}
				}
			}
		}
		
		return makeRequest(requestObj, 'POST', callback);
	}
	
	function batchAttributesRequest(action, domain, data, callback) {
		var
			requestObj = {
				Action: action,
				DomainName: domain
			},
			itemName,
			key,
			i = 0,
			j,
			q,
			w,
			prefix,
			attr,
			isArr;
			
		if(callback === undefined) {
			throw 'Missing parameters';
		}
		
		for(itemName in data) {
			i++;
			requestObj[(prefix = 'Item.' + i) + '.ItemName'] = itemName;
			j = 0;
			for(key in data[itemName]) {
				for(q = 0, w = (isArr = typeof (attr = data[itemName][key]).Value === 'object' && typeof attr.Value.length === 'number') ? attr.Value.length : 1; q < w; q++) {
					j++;
					requestObj[prefix + '.Attribute.' + j + '.Name'] = key;
					requestObj[prefix + '.Attribute.' + j + '.Value'] = isArr ? attr.Value[q] : attr.Value;
					if(attr.Replace !== undefined) {
						requestObj[prefix + '.Attribute.' + j + '.Replace'] = attr.Replace;
					}
				}
			}
		}
		
		return makeRequest(requestObj, 'POST', callback);
	}
	
	function datetimeISO8601(date) {
		return (date.getUTCFullYear() + '-' + (1 + date.getUTCMonth()) + '-' + (1 + date.getDate()) + 'T' + date.getUTCHours() + ':' + date.getUTCMinutes() + ':' + date.getUTCSeconds() + 'Z').replace(reg.datetime, function(a, b) {	
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
		
		return makeRequest({
			Action: action,
			DomainName: domain
		}, callback);
	}
	
	function makeRequest(params, b, c /* params, callback || params, method, callback */) {
		var
			req,
			keys,
			str,
			i,
			l,
			parts = [],
			queryStr,
			sig,
			tmp,
			method = c === undefined ? 'GET' : b,
			callback = c === undefined ? b : c,
			chunks = [];
		
		params.Timestamp = datetimeISO8601(new Date());
		params.AWSAccessKeyId = accessKey;
		params.Version = '2009-04-15';
		params.SignatureVersion = 2;
		params.SignatureMethod = 'HmacSHA1';
		
		keys = Object.keys(params).sort(function(a, b) {
			return (a = a.toLowerCase()) === (b = b.toLowerCase()) ? 0 : 
				a > b ? 1 : 
				-1;
 		});
		
		for(i = 0, l = keys.length; i < l; i++) {
			if(keys[i] == 'AWSAccessKeyId' || (tmp = params[keys[i]]) === undefined || tmp === null) {
				continue;
			}
			parts.push(keys[i] + '=' + urlEncode(tmp));
		}
		parts.unshift('AWSAccessKeyId=' + urlEncode(params['AWSAccessKeyId']));
		
		queryStr = parts.join('&');
		
		sig = crypto
			.createHmac('SHA1', secret)
			.update(method + '\nsdb.amazonaws.com\n/\n' + queryStr)
			.digest('base64');
		queryStr += '&Signature=' + urlEncode(sig);
		
		req = https.request({
			host: 'sdb.amazonaws.com',
			port: 443,
			path: '/?' + queryStr,
			method: method
		}, function(res) {
			res.on('data', function(data) {
				chunks.push(data.toString('utf-8'));
			});
			
			res.on('end', function() {
				callback(null, chunks.join(''));
			});
			
			res.on('close', function() {
				res.emit('end');
			});
		});
		req.end();
		
		req.on('error', function(err) {
			callback(err);
		});
		
		return req;
	}
	
	function urlEncode(str) {
		return encodeURIComponent(str).replace(reg.uri, function(chr) {
			return uriReplacements[chr];
		});
	}
}

module.exports = SimplyDB;