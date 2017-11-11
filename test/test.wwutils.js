
let Utils;
if (typeof Utils === undefined && typeof require !== undefined) {
Utils = require('../bin/wwutils.js');
}
if ( ! Utils ) {
	console.error("No wwutils :(");
}

if (typeof(assert) === 'undefined') {
    function assert(ok, msg) {
        if (ok) return;
        console.error(msg);
        throw new Error(msg);
    }
}

// const blockProp = Utils.blockProp;
// const yessy = Utils.yessy;


describe('utils', function() {
    this.timeout(2000);

	it('should encode decode unicode', function() {		
		{
			let eh = wwutils.encURI("“hello”");
			assert(eh[0]==="%", eh);
			let dh = wwutils.decURI(eh);
			assert(dh === "“hello”", dh);
		}
    }); // ./enc dec


	it('parseHash', function() {		
		{	// unicode
			// %uxxx encoding is NOT a standard (although it is what escape() produces!)
			let ph = wwutils.parseHash('#?q='+encodeURIComponent("“hello”"));
			assert(ph.path.length === 0);
			assert(ph.params.q === "“hello”");
		}
		{
			let ph = wwutils.parseHash('#?a=');
			assert(ph.path.length === 0, JSON.stringify(ph));			
			assert( ! ph.params.a, JSON.stringify(ph));
			assert(ph.params.a === "", JSON.stringify(ph));
		}
		{
			let ph = wwutils.parseHash('#foo?a=1');
			assert(ph.path[0] === 'foo', JSON.stringify(ph));			
			assert(ph.params.a === "1", JSON.stringify(ph));
		}
		{
			let ph = wwutils.parseHash('#foo/bar?a=2&b=2');
			assert(ph.path[0] === 'foo', JSON.stringify(ph));
			assert(ph.params.a === "2", JSON.stringify(ph));
		}
    }); // ./parseHash


	it('modifyHash', function() {		
		let obj = {a: 1, b:2};
		window.location.hash = '#foo?a=1';
		wwutils.modifyHash(['path1', 'path2']);
		assert(window.location.hash.indexOf('path1/path2') !== -1, window.location.hash);
		
		wwutils.modifyHash(null, {a: 2, b: "Bee:=)"});
		
		assert(window.location.hash.indexOf('path1/path2') !== -1, window.location.hash);
		assert(window.location.hash.indexOf('a=2') !== -1, window.location.hash);

		let {path, params} = wwutils.parseHash();
		assert(path[0] === 'path1', path);
		assert(path[1] === 'path2', path);
		assert(params.a === "2", JSON.stringify(params));
		assert(params.b === "Bee:=)", JSON.stringify(params));
    }); // ./modifyHash
	
	it('modifyHash null', function() {		
		window.location.hash = '#foo?a=1';
		wwutils.modifyHash([], {a:null, b:''});
		assert(window.location.hash === '#?a=&b=', window.location.hash);
		let {path, params} = wwutils.parseHash();
		assert(path.length===0, "path"+JSON.stringify(path));
		assert( ! params.a, params.a);
    }); // ./modifyHash-null

    it('mapkv', function() {
		let obj = {a: 1, b:2};
		let kvs = wwutils.mapkv(obj, (k,v) => k+"="+v);
    	assert(kvs.length === 2);
		assert(kvs[0] === 'a=1');
		let joined = kvs.join('&');
		assert(joined === 'a=1&b=2');
    }); // ./mapkv

    it('yessy', function() {
    	assert(yessy(1), 1);
    	assert(yessy('hello'), 'hello');
    	assert(yessy({a:1}), {a:1});
    	assert(yessy(true), true);
		assert(yessy(['', 'a']));
		assert(yessy(['a']));
        assert(yessy(-1));
		assert( yessy(new Error("foo")), new Error("foo") );

		assert( ! yessy(0));	
		assert( ! yessy(false));
		assert( ! yessy(undefined));
		assert( ! yessy(null));
    	assert( ! yessy([]));
    	assert( ! yessy(['']));
    	assert( ! yessy(''));
        assert( ! yessy({}));
    }); // ./yessy

	it('randomPick', function() {
		{	// test fairness
			let x = ['a','b'];
			let cnta=0, cntb=0;
			for(let i=0; i<100; i++) {
				let rp = wwutils.randomPick(x);
				if (rp==='a') cnta++;
				else if (rp==='b') cntb++;
				else throw new Error("odd pick "+rp);
			}
			assert(cnta > 20 && cntb > 20);
			console.log("cnta",cnta,"cntb",cntb);
		}
	});

    it('blockPropx2', function() {
		let obj = {a:1}
		blockProp(obj, 'b');	
		blockProp(obj, 'b');	
	});

    it('blockProp', function() {
		{	// frozen object
			let obj = {a:1}
			Object.freeze(obj);
			blockProp(obj, 'b');	
		}
		{	// sealed object
			let obj = {a:1}
			Object.seal(obj);
			blockProp(obj, 'b');	
		}
		const obj = {};
		blockProp(obj, 'a');
		let ok = true;
		try {
			let a = obj.a;
			ok = false;
		} catch(err) {
			// :)
		}
		assert(ok);

		try {
			obj.a = 'apple';
			ok = false;
		} catch(err) {
			console.log(err);
			// :)
		}
		assert(ok);

		const prior = {a:'apple'};
		try {
			blockProp(prior, 'a');
			ok = false;
		} catch(err) {
			console.log(err);
			// :)
		}
		assert(ok);

		blockProp(obj, 'b');
		blockProp(obj, 'c');
		try {
			let c = obj.c;
			ok = false;
		} catch(err) {
			console.log(err);
			// :)
		}
		assert(ok);
    }); // ./blockProp

});    