var lib = require(".");
var ansuz = require("ansuz");
var assert = require("assert");
var util = require("tweetnacl-util");

var keys = [];
var prime;

var makeKey = ansuz.forget(function (i) {
    console.log('=== key #%s ===\n', i + 1);
    if (i === 0) {
        keys.push(lib.genkey());
        prime = keys[0].Prime;
        return;
    }
    keys.push(lib.generateKeyFromPrime(prime));
});

var checkForDuplicates = function () {
    var serialized = keys.map(function (k) {
        return k.Decryption.toString();
    });
    assert(ansuz.every(serialized, function (s, i) {
        return serialized.lastIndexOf(s) === i;
    }));
};

var words = [ 'eep', 'blap', 'dorp', 'beep', 'boop', 'blomp' ];
var chooseRandomWord = function () {
    return ' ' + ansuz.choose(words);
};

var text = "boom";

var encryptReduce = function (input, key) { return lib.encrypt(input, key); };
var decryptReduce = function (input, key) { return lib.decrypt(input, key); };

var runTest = function () {
    var plaintext = lib.stringToBigInt(text);
    makeKey();
    checkForDuplicates();

    // encrypt in order...
    var cypher = keys.reduce(encryptReduce, plaintext);

    console.log('encrypted value: [%s]\n', cypher.toString());
    var shuffled = ansuz.shuffle(keys);

    // decrypt in any order
    var plain = shuffled.reduce(decryptReduce, cypher);

    var strung = lib.bigIntToString(plain);
    assert(strung === text);
    console.log('decrypted value: [%s]\n', lib.bigIntToString(plain));
    text += chooseRandomWord();
};

// block cypher maxes out at 1024 bits
while (util.decodeUTF8(text).length < 128) { runTest(); }

