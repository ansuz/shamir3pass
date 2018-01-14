var timer = function () {
    var d = +new Date();
    return function () { return +new Date() - d; };
};

var lib = require(".");
var ansuz = require("ansuz");
var assert = require("assert");
var util = require("tweetnacl-util");
var nacl = require("tweetnacl");

var keys = [];
var N_BITS = 1024;

var bytes = nacl.randomBytes;
var prime = lib.prime.sync(bytes, N_BITS);

(function () {
    var key = lib.genkeys.sync(bytes, N_BITS, prime);
    var s_plain = '.hello? dog?';

    var u_plain = util.decodeUTF8(s_plain);

    // decrypt twice
    var u_cypher = lib.decrypt(lib.decrypt(u_plain, key), key);

    // encrypt twice
    var u_recovered = lib.encrypt(lib.encrypt(u_cypher, key), key);

    assert(s_plain === util.encodeUTF8(u_recovered));
    console.log(util.encodeUTF8(u_recovered));
}());

(function () {
    var key = lib.genkeys.sync(bytes, N_BITS, prime);
    var s_plain = '.yes hello this is dog';

    var u_plain = util.decodeUTF8(s_plain);

    // encrypt twice
    var u_cypher = lib.encrypt(lib.encrypt(u_plain, key), key);

    // decrypt twice
    var u_recovered = lib.decrypt(lib.decrypt(u_cypher, key), key);

    assert(s_plain === util.encodeUTF8(u_recovered));
    console.log(util.encodeUTF8(u_recovered));
}());


(function () {
    var names = "abc".split("");
    var keys = {};
    names.forEach(function (n) {
        keys[n] = lib.genkeys.sync(bytes, N_BITS, prime);
    });


    var token = 'xxx';
    var plain = util.decodeUTF8(token);

    // chuck encrypts
    var c = lib.encrypt(plain, keys.c);

    // bob encrypts chuck's cyphertext
    var bc = lib.encrypt(c, keys.b);

    // alice encrypts chuck's cyphertext
    var ac = lib.encrypt(c, keys.a);

    // bob encrypts alice and chuck's cyphertext
    var bac = lib.encrypt(ac, keys.b);

    // alice encrypts bob and chuck's cyphertext
    var abc = lib.encrypt(bc, keys.a);

    // chuck decrypts both triply encryped cyphertexts
    var to64 = util.encodeBase64;

    var ab = lib.decrypt(abc, keys.c);
    var ba = lib.decrypt(bac, keys.c);
    assert(to64(ab) === to64(ba));

    var a1 = lib.decrypt(ab, keys.b);
    var a2 = lib.decrypt(ba, keys.b);
    assert(to64(a1) === to64(a2));

    var b1 = lib.decrypt(ab, keys.a);
    var b2 = lib.decrypt(ba, keys.a);
    assert(to64(b1) === to64(b2));

    var _a = lib.decrypt(a1, keys.a);
    [
        lib.decrypt(a1, keys.a),
        lib.decrypt(a2, keys.a),
        lib.decrypt(b1, keys.b),
        lib.decrypt(b2, keys.b),
        lib.decrypt(c, keys.c),
    ].forEach(function (plain) {
        assert(util.encodeUTF8(plain) === token);
    });

    console.log("successfully commutated keys\n");
}());

var makeKey = function (cb) {
    console.log('=== key #%s ===\n', keys.length + 1);
    var stop = timer();

    if (ansuz.die(2)) {
        keys.push(lib.genkeys.sync(bytes, N_BITS, prime));
        console.log("key generated in: %sms", stop());
        return cb();
    }

    lib.genkeys(bytes, N_BITS, prime, function (e, key) {
        if (e) { return void cb(e); }
        console.log("key generated in: %sms", stop());
        keys.push(key);
        cb();
    });
};

var words = [ 'eep', 'blap', 'dorp', 'beep', 'boop', 'blomp' ];
var chooseRandomWord = function () {
    return ' ' + ansuz.choose(words);
};
var checkForDuplicates = function () {
    var serialized = keys.map(function (k) {
        return k.Decryption.toString();
    });
    assert(ansuz.every(serialized, function (s, i) {
        return serialized.lastIndexOf(s) === i;
    }));
};

var text = "boom";

var encryptReduce = function (input, key) { return lib.encrypt(input, key); };
var decryptReduce = function (input, key) { return lib.decrypt(input, key); };

var stop = timer();
var test = function (cb) {
    if (util.decodeUTF8(text).length * 8 >= N_BITS) {
        console.log('supported block size exceeded. Terminating');
        console.log("All tests completed in: %sms", stop());
        return;
    }

    var plaintext = util.decodeUTF8(text);

    makeKey(function (e) {
        if (e) { return console.error(e); }
        // no problems!

        checkForDuplicates();

        // encrypt in order...
        var cypher = keys.reduce(encryptReduce, plaintext);

        console.log('encrypted value: [%s]\n', util.encodeBase64(cypher));
        var shuffled = ansuz.shuffle(keys.slice());

        // decrypt in any order
        var plain = shuffled.reduce(decryptReduce, cypher);

        var strung = util.encodeUTF8(plain);
        assert(strung === text);
        console.log('decrypted value: [%s]\n', strung);
        text += chooseRandomWord();
        cb(cb);
    });
};


test(test);

