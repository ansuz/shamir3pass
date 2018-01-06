var lib = require(".");
var ansuz = require("ansuz");
var assert = require("assert");
var util = require("tweetnacl-util");

var keys = [];
var prime;

var N_BITS = 1024;
var makeKey = function (cb) {
    console.log('=== key #%s ===\n', keys.length + 1);
    lib.generateKeyFromPrime(N_BITS, prime, function (e, key) {
        if (e) { return void cb(e); }
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

var test = function (cb) {
    if (util.decodeUTF8(text).length * 8 >= N_BITS) {
        return console.log('supported block size exceeded. Terminating');
    }

    var plaintext = lib.stringToBigInt(text);

    makeKey(function (e) {
        if (e) { return console.error(e); }
        // no problems!

        checkForDuplicates();

        // encrypt in order...
        var cypher = keys.reduce(encryptReduce, plaintext);

        var pretty = util.encodeBase64(cypher.toByteArray());

        console.log('encrypted value: [%s]\n', pretty);
        var shuffled = ansuz.shuffle(keys);

        // decrypt in any order
        var plain = shuffled.reduce(decryptReduce, cypher);

        var strung = lib.bigIntToString(plain);
        assert(strung === text);
        console.log('decrypted value: [%s]\n', lib.bigIntToString(plain));
        text += chooseRandomWord();
        cb(cb);
    });
};

lib.randomPrime(N_BITS, function (e, p) {
    if (e) { return void console.error(e); }
    prime = p;
    test(test);
});


