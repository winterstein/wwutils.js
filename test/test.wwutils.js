
// let Utils;
// if (typeof Utils === undefined && typeof require !== undefined) {
Utils = require('../bin/wwutils.js');
// }
// if ( ! Utils && ! blockProp) {
// 	console.error("No wwutils :(");
// }

if (typeof(assert) === 'undefined') {
    function assert(ok, msg) {
        if (ok) return;
        console.error(msg);
        throw new Error(msg);
    }
}

const blockProp = Utils.blockProp;
const yessy = Utils.yessy;


describe('utils', function() {
    this.timeout(200);

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
				let rp = Utils.randomPick(x);
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