var jsbn = require("jsbn");
var bigint = jsbn.BigInteger;
var bignum = require("bignum");
var util = require("tweetnacl-util");

var L = module.exports;

var randomProbablePrime = function (bits) {
    return bignum.prime(bits);
};

var randomPrime = L.randomPrime = function (bits) {
    var p = randomProbablePrime(bits);
    while (p.probPrime() !== true) { p = randomProbablePrime(bits); }
    return new bigint(p.toString());
};

var generateKeyFromPrime = L.generateKeyFromPrime = function (prime) {
    var n;
    var primeMinusOne = prime.subtract(bigint.ONE);

    var gcd;
    while (true) {
        n = randomPrime(1024);
        gcd = primeMinusOne.gcd(n);
        if (!gcd.equals(bigint.ZERO)) {
            return {
                Encryption: n,
                Decryption: n.modInverse(primeMinusOne),
                Prime: prime,
            };
        }
    }
};

L.genkey = function () {
    var prime = randomPrime(1024);
    return generateKeyFromPrime(prime);
};

L.encrypt = function (m, key) {
    return m.modPow(key.Encryption, key.Prime);
};

L.decrypt = function (c, key) {
    return c.modPow(key.Decryption, key.Prime);
};

L.stringToBigInt = function (s) {
    var bytes = util.decodeUTF8(s);
    return new bigint(bignum.fromBuffer(bytes).toString());
};

L.bigIntToString = function (bi) {
    return util.encodeUTF8(new Uint8Array(bi.toByteArray()));
};

