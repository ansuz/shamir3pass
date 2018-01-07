var timer = function () {
    var d = +new Date();
    return function () { return +new Date() - d; };
};

var lib = require(".");
var ansuz = require("ansuz");
var assert = require("assert");
var util = require("tweetnacl-util");

var keys = [];
var prime;

var N_BITS = 1024;
var makeKey = function (cb) {
    console.log('=== key #%s ===\n', keys.length + 1);
    var stop = timer();
    lib.generateKeyFromPrime(N_BITS, prime, function (e, key) {
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

    var plaintext = lib.UTF8ToBigInt(text);

    makeKey(function (e) {
        if (e) { return console.error(e); }
        // no problems!

        checkForDuplicates();

        // encrypt in order...
        var cypher = keys.reduce(encryptReduce, plaintext);

        console.log('encrypted value: [%s]\n', lib.bigIntToBase64(cypher));
        var shuffled = ansuz.shuffle(keys.slice());

        // decrypt in any order
        var plain = shuffled.reduce(decryptReduce, cypher);

        var strung = lib.bigIntToUTF8(plain);
        assert(strung === text);
        console.log('decrypted value: [%s]\n', lib.bigIntToUTF8(plain));
        text += chooseRandomWord();
        cb(cb);
    });
};

lib.randomPrime(N_BITS, function (e, p) {
    if (e) { return void console.error(e); }
    prime = p;
    test(test);
});

