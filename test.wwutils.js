// import {yessy,blockProp} from './wwutils.js';
const Utils = require('./wwutils.js');

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

		assert( ! yessy(false));
		assert( ! yessy(undefined));
		assert( ! yessy(null));
    	assert( ! yessy([]));
    	assert( ! yessy(['']));
    	assert( ! yessy(''));
        assert( ! yessy({}));
    }); // ./yessy


    it('blockProp', function() {
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