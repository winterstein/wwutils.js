/** wwutils.js: Javascript Utility Functions, common to several Winterwell projects
 */

const wwutils = {};
if (typeof module !== 'undefined') {
  module.exports = wwutils;
}


// hopefully we have from SJTest but if not define assert
if (typeof assert === 'undefined') {
	var assert = function(ok, msg) {
        if (ok) return;
        console.error(msg);
        throw new Error(msg);
    }
}

/**
 * @param unescapedHash e.g. "foo=bar"
 * This must be the whole post-hash state.
 */
wwutils.setHash = function(unescapedHash) {
	assert(unescapedHash[0] !== '#', "No leading # please on "+unescapedHash);	
	if (history && history.pushState) {
		let oldURL = ""+window.location;
		history.pushState(null, null, '#'+encURI(unescapedHash));
		fireHashChangeEvent({oldURL});
	} else {
		// fallback for old browsers
		location.hash = '#'+encURI(unescapedHash);
	}
};
/**
 * Note: params are always string valued, e.g. "1" not 1
 * No path will return as []
 * @return {path: String[], params}
 */
wwutils.parseHash = function(hash = window.location.hash) {
	let params = wwutils.getUrlVars(hash);
	// Pop the # and peel off eg publisher/myblog NB: this works whether or not "?"" is present
	let page = hash.substring(1).split('?')[0];
	const path = page.length? page.split('/') : [];
	return {path, params};
}

/**
 * @param {?String[]} newpath Can be null for no-change
 * @param {?Object} newparams Can be null for no-change
 * @param {?Boolean} returnOnly If true, do not modify the hash -- just return what the new value would be (starting with #)
 */
wwutils.modifyHash = function(newpath, newparams, returnOnly) {
	const {path, params} = wwutils.parseHash();
	let allparams = (params || {});
	allparams = Object.assign(allparams, newparams);
	if ( ! newpath) newpath = path || [];
	let hash = encURI(newpath.join('/'));
	if (wwutils.yessy(allparams)) {
		let kvs = wwutils.mapkv(allparams, (k,v) => encURI(k)+"="+(v===null||v===undefined? '' : encURI(v)) );
		hash += "?" + kvs.join('&');
	}	
	if (returnOnly) {
		return '#'+hash;
	}
	if (history && history.pushState) {
		let oldURL = ""+window.location;
		history.pushState(null, null, '#'+hash);
		// generate the hashchange event
		fireHashChangeEvent({oldURL});
	} else {
		// fallback for old browsers
		location.hash = '#'+hash;
	}	
};

let fireHashChangeEvent = function({oldURL}) {
	// NB IE9+ on mobile
	// https://developer.mozilla.org/en-US/docs/Web/API/HashChangeEvent
	let e = new HashChangeEvent('hashchange', {
		newURL: ""+window.location,
		oldURL: oldURL
	});	
  	window.dispatchEvent(e);
};

/**
 * Map fn across the (key, value) properties of obj.
 * ??Is there a native way to do this??
 */
wwutils.mapkv = function(obj, fn) {
	return Object.keys(obj).map(k => fn(k, obj[k]));
};

/**
 * @param src {!String} url for the script
 * @param onLoad {?Function} called on-load and on-error
 * 
 * NB: copy-pasta of Good-Loop's unit.js addScript()
 */
wwutils.addScript = function(src, {async, onload, onerror}) {
	let script = document.createElement('script');
	script.setAttribute( 'src', src);
	if (onerror) script.addEventListener('error', onerror); 
	if (onload) script.addEventListener('load', onload);
	script.async = async;
	script.type = 'text/javascript';
	// c.f. https://stackoverflow.com/questions/538745/how-to-tell-if-a-script-tag-failed-to-load
	// c.f. https://stackoverflow.com/questions/6348494/addeventlistener-vs-onclick
	var head = document.getElementsByTagName("head")[0];
	(head || document.body).appendChild( script );	
	document.body.appendChild(script);
};


const XId = {};
wwutils.XId = XId;

/**
 * @param xid
 * @returns the id part of the XId, e.g. "winterstein" from "winterstein@twitter"
 */
XId.id = function(xid) {
	if ( ! xid) {
		throw new Error("XId.id - no input "+xid);
	}
	var i = xid.lastIndexOf('@');
	assert(i!=-1, "orla-utils.js - id: No @ in xid "+xid);
	return xid.substring(0, i);
};

/**
 * Convenience for nice display. Almost equivalent to XId.id() -- except this dewarts the XId.
 * So it's better for public display but cannot be used in ajax requests.
 * @param xid Does not have to be a valid XId! You can pass in just a name, or null.
 * @returns the id part of the XId, e.g. "winterstein" from "winterstein@twitter", "bob" from "p_bob@youtube"
 */
XId.dewart = function(xid) {
	if ( ! xid) return "";
	assert(_.isString(xid), "orla-utils.js - dewart: xid is not a string! " + xid);
	// NB: handle invalid XId (where its just a name fragment)
	var id = xid.indexOf('@') == -1? xid : XId.id(xid);
	if (id.length < 3) return id;
	if (id.charAt(1) != '_') return id;
	var c0 = id.charAt(0);
	if (c0 != 'p' && c0 != 'v' && c0 != 'g' && c0 != 'c') return id;
	// so there (probably) is a wart...
	var s = xid.indexOf('@') == -1? '' : XId.service(xid);
	if (s !== 'twitter' && s !== 'facebook') {
		return id.substring(2);
	}
	return id;
};

/**
 * @param xid {!String}
 * @returns the service part of the XId, e.g. "twitter"
 */
XId.service = function(xid) {
	assert(_.isString(xid), "orla-utils.js service(): xid is not a string! " + xid);
	var i = xid.lastIndexOf('@');
	assert(i != -1, "orla-utils.js dewart(): No @ in xid: " + xid);
	return xid.substring(i + 1);
};

/**
 * @param xid Can be null (returns "") or not an XId (returns itself)
 * @returns the first chunk of the XId, e.g. "daniel" from "daniel@winterwell.com@soda.sh"
 * Also dewarts. Will put a leading @ on Twitter handles.
 */
XId.prettyName = function(xid) {
	var id = XId.dewart(xid);
	var i = id.indexOf('@');
	if (i != -1) {
		id = id.substring(0, i);
	}
	// @alice for Twitter
	const service = XId.service(xid);
	if (xid.indexOf('@') !== -1 && service === 'twitter') {
		id = '@' + id;
	}
	// Web? shorten the url
	if (service==='Web') {
		// TODO how to shorten a url? crib from SoDash
	}
	return id;
};

/**
 * @param id
 * @param service
 * @returns An xid string in the form 'id@service'
 */
 XId.xid = function(id, service) {
 	assert(_.isString(id), "orla-utils.js xid(): id is not a string! " + id);
 	assert(_.isString(service), "orla-utils.js xid(): service is not a string! " + service);
 	return id + '@' + service;
 }



/** Parse url arguments
 * @param [url] Optional, the string to be parsed, will default to window.location when not provided.
 * @returns a map */
wwutils.getUrlVars = function getUrlVars(url) {
	url = url || window.location.href;
	// url = url.replace(/#.*/, ''); Why was this here?! DW
	var s = url.indexOf("?");

	if (s == -1 || s == url.length - 1) return {};

	var varstr = url.substring(s + 1);
	var kvs = varstr.split("&");
	var urlVars = {};

	for(var i = 0; i < kvs.length; i++) {
		var kv = kvs[i];
		if ( ! kv) continue; // ignore trailing &
		var e = kv.indexOf("=");

		if (e != -1) {
			let k = kv.substring(0, e);
			k = wwutils.decURI(k.replace(/\+/g, ' '));
			let v = '';
			if (e !== kv.length - 1) {
				v = kv.substring(e + 1);
				v = wwutils.decURI(v.replace(/\+/g, ' '));
			}
			urlVars[k] = v;
		} else {
			urlVars[kv] = '';
		}
	}

	return urlVars;
};

const emailRegex = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
/**
	Validate email addresses using what http://emailregex.com/ assures me is the
	standard regex prescribed by the W3C for <input type="email"> validation.
	https://www.w3.org/TR/html-markup/input.email.html#input.email.attrs.value.single
	NB this is more lax
	@param string A string which may or may not be an email address
	@returns True if the input is a string & a (probably) legitimate email address.
*/
function isEmail(string) {
	return !!("string" == typeof(string).toLowerCase() && string.match(emailRegex));
}
wwutils.isEmail = isEmail;



/**
Like truthy, but {}, [] amd [''] are also false alongside '', 0 and false.
*/
const yessy = function(val) {
	if ( ! val) return false;
	if (typeof(val) === 'number' || typeof(val) === 'boolean') {
		return true;
	}
	if (typeof(val) === 'object' && val.length === undefined) {
		assert(typeof(val) !== 'function', "yessy(function) indicates a mistake: "+val);
		val = Object.getOwnPropertyNames(val);
	}
	if (val.length === 0) {
		return false;
	}
	if (val.length) {
		for (var i = 0; i < val.length; i++) {
			if (val[i]) return true;
		}
		return false;
	}
	return true;
}
wwutils.yessy = yessy;

/**
 * convenience for not-null not-undefined (but can be false, 0, or "")
 */
wwutils.is = function(x) {
	return x !== undefined && x !== null;
};


wwutils.getStackTrace = function() {
	try {
		const stack = new Error().stack;
		// stacktrace, chop leading "Error at Object." bit
		let stacktrace = (""+stack).replace(/\s+/g,' ').substr(16);
		return stacktrace;
	} catch(error) {
		// oh well
		return "";
	}
}

/**
 * @return {string} a unique ID
 */
const uid = function() {
    // A Type 4 RFC 4122 UUID, via http://stackoverflow.com/a/873856/346629
    var s = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";
    var uuid = s.join("");
    return uuid;
};
wwutils.uid = uid;

//** String related functions */

wwutils.endsWith = function(s, ending) {
	assert(typeof(s) === 'string');
	assert(typeof(ending) === 'string');
	if (s.length < ending.length) return false;
	const end = s.substring(s.length-ending.length, s.length);
	return end === ending;
}

/** Uppercase the first letter, lowercase the rest -- e.g. "dan" to "Daniel" */
wwutils.toTitleCase = function(s) {
	if ( ! s) return s;
	return s[0].toUpperCase() + s.substr(1).toLowerCase();
}

/**
 * Truncate text length.
 */
wwutils.ellipsize = function(s, maxLength) {
	if ( ! s) return s;
	if ( ! maxLength) maxLength = 140;
	if (s.length <= maxLength) return s;
	return s.substr(0, maxLength - 2)+' &hellip;';
};

/**
 * Try to avoid this! It is much better to not have mixed types.
 * E.g. a consistent string[] is better than string|string[]
 */
wwutils.asArray = function(x) {
	return _.isArray(x)? x : [x];
}

const isPromise = function(x) {
	return x && x.then && _.isFunction(x.then);
};
wwutils.isPromise = isPromise;
/**
 * @returns wrap the input as a resolved promise -- if it isn't already a promise.
 */
const asPromise = function(x) {	
	if (isPromise(x)) return x;	
	return Promise.resolve(x);
};
wwutils.asPromise = asPromise;

let bphush = false;
/**
 * Rig obj so that any use of obj.propName will trigger an Error.
 * @param {!String} propName
 * @param {?String} message Optional helpful message, like "use foo() instead."
 * @returns obj (allows for chaining)
 */
const blockProp = function(obj, propName, message) {	
	assert(typeof(propName) === 'string');
	if ( ! message) message = "Using this property indicates old/broken code.";
	// already blocked?	
	bphush = true;
	try {
		let v = obj[propName];
	} catch (err) {
		return obj;
	}
	bphush = false;
	if (obj[propName] !== undefined) {
		// already set to a value :(
		const ex = new Error("Having "+propName+" is blocked! "+message);
		if ( ! bphush) console.error(ex, this); // react can swallow stuff
		throw ex;
	}
	if ( ! Object.isExtensible(obj)) {	
		// no need -- frozen or sealed	
		return;
	}
	Object.defineProperty(obj, propName, { 
		get: function () { 
			const ex = new Error(propName+" is blocked! "+message); 
			if ( ! bphush) console.error(ex, this); // react can swallow stuff
			throw ex;					
		},
		set: function () { 
			const ex = new Error("Set "+propName+" is blocked! "+message);
			if ( ! bphush) console.error(ex, this); // react can swallow stuff
			throw ex;		
		} 
	});
	return obj;
} // ./blockProp
wwutils.blockProp = blockProp;

/**
 * Wrap a function to make sure errors are heard! Catch errors, send them to console, and rethrow.
 */
wwutils.noisy = function(fn) {
	try {
		fn();
	} catch(err) {
		console.error(err);
		throw err;
	}
};

/**
 * @param list {?Object[]}
 * @returns random item from list, or null if list is empty/null.
 */
wwutils.randomPick = function(list) {
	if ( ! list) return null;
	var i = Math.floor( Math.random() * list.length);
	return list[i];
}

/**
 * e.g. winterwell.com from http://www.winterwell.com/stuff
 */
wwutils.getHost = function(url) {
    var a = document.createElement('a');
    a.href = url;
    var host = a.hostname;
	if (host.startsWith("www.")) host = host.substr(4);
	return host;
}

// /**
//  * TODO Rig obj so that any use of obj.propName must assertMatch matchme.
//  */
// const typeProp = function(obj, propName, matchme) {	
// 	if (obj[propName] !== undefined) {
// 		assertMatch(obj[propName], matchme);
// 	}
// 	Object.defineProperty(obj, propName, { 
// 		get: function () { 
// 			let v = this[propName];
// 			if (v !== undefined) assertMatch(v, matchme);
// 			return v;
// 		},
// 		set: function (v) { 
// 			if (v !== undefined) assertMatch(v, matchme);
// 			this[propName] = v;
// 			// return v; // what does a set return??
// 		} 
// 	});
// } // ./blockProp
// wwutils.typeProp = typeProp;



/** encoding.js  */
/* file: encoding.js Convenient String encoding functions for common cases.
 * These should ALWAYS be used when making html from json data.
 * 
 * There is also CSS.escape() in the file css.escape.js for css selectors, 
 * which we get from https://developer.mozilla.org/en-US/docs/Web/API/CSS.escape
 * and may become a standard.
 * 
 * @author Daniel  
 */

/** Url-encoding: e.g. encode a parameter value so you can append it onto a url.
 * 
 * Why? When there are 2 built in functions:
 * escape(), and encodeURIComponent() has better unicode handling -- however it doesn't
 escape 's which makes it dangerous, and it does unhelpfully encode /s and other legitimate url characters.
 This is a convenient best-of-both.
*/
const encURI = function(urlPart) {
	urlPart = encodeURIComponent(urlPart);
	urlPart = urlPart.replace("'","%27");
	// Keep some chars which are url safe
	urlPart = urlPart.replace("%2F","/");
	return urlPart;
}
wwutils.encURI = encURI;

wwutils.decURI = function(urlPart) {
	let decoded = decodeURIComponent(urlPart);
	return decoded;
}

/** Quote-encoding: Encode for use as an html attribute value (i.e. encode quotes).
 * This does _not_ add enclosing quotes.
 * E.g. <a title="<%= attr(name) %>">
 * @param text {?String} If null/undefined, returns ''
*/
wwutils.attr = function(text) {
	//this must be of type String for the attr function not to fail
	text = (text || '')+"";
	return text
		.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

/** Plain text for use in html: tags are removed with clean, and entities are encoded */
function plain(str) {
	return encodeEntities(clean(str));
}

/**  
 * @param s String to encode
 */
function encodeEntities(s){
	var encodedText = $("<div>").text(s).html();
	encodedText = encodedText.replace(/"/g, '&quot;');
	return encodedText;
};

function decodeEntities(s){
	return $("<div>").html(s).text();
};

function clean2(text, permittedTags, removeTags) {
	if ( ! text) return '';
	if (typeof(text) !== 'string') text = ''+text; // probably a number -- convert to a string
	permittedTags = permittedTags || [];
	
	// make &s safe -- ??and disable any html entities??
	text = (text || '').replace(/&/g, '&amp;');
	
	return text.replace(/<(\/?(\w+)(?:[^>]*))>/g, function (all, content, tag) {
		if (permittedTags.indexOf(tag) > -1) {
			return all;
		}
		if (remove) return '';
		return '&lt;' + content + '&gt;';		
	});
}
/** A strong anti-hacking defence: strips out all html tags 
 * @param html {?string|number} return "" if falsy. */
wwutils.clean = (html, permittedTags) => clean2(html, permittedTags, true);

/**
 * Escapes html tags, so they can be displayed in the DOM of a page, with the
 * exception of any tags that are declared as permitted.
 * 
 * This is different from clean(), which will remove the tags to give plain text.
 * 
 * @param {String} text - The text to santise. Can be null (which will return '').
 * @param {String[]} permittedTags - Any tags that should not be escaped.
 * @returns {String} The sanitised text.
**/
wwutils.sanitiseHtml = (html, permittedTags) => clean2(html, permittedTags, false);

/**
 * preventDefault + stopPropagation
 * @param e {?Event|Object} a non-event is a no-op 
 * @returns true (so it can be chained with &&)
 */
wwutils.stopEvent = (e) => {
	if ( ! e) return true;
	if (e.preventDefault) {
		e.preventDefault();
		e.stopPropagation();
	}
	return true;
};
