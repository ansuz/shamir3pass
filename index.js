var jsbn = require("jsbn");
var bigint = jsbn.BigInteger;
var util = require("tweetnacl-util");
var prime = require("./prime");

var L = module.exports;

var randomPrime = L.randomPrime = prime;
L.generateKeyFromPrime = function (bits, prime, cb) {
    var n;
    var primeMinusOne = prime.subtract(bigint.ONE);
    var gcd;
    var again = function () {
        randomPrime(bits, function (e, p) {
            n = p;
            gcd = primeMinusOne.gcd(n);
            if (gcd.equals(bigint.ZERO)) { return void again(); }
            cb(null, {
                Encryption: n,
                Decryption: n.modInverse(primeMinusOne),
                Prime: prime,
            });
        });
    };
    again();
};

L.encrypt = function (m, key) {
    return m.modPow(key.Encryption, key.Prime);
};

L.decrypt = function (c, key) {
    return c.modPow(key.Decryption, key.Prime);
};

var uint8ArrayToBigInt = L.uint8ArrayToBigInt = function (u8) {
    var num = bigint.ZERO;
    var l = u8.length;
    for (var i = 0;i < l; i++) {
        num = num.shiftLeft(8).add(new bigint(Number(u8[i]).toString()));
    }
    return num;
};

var bigIntToUint8Array = L.bigIntToUint8Array = function (num) {
    return new Uint8Array(num.toByteArray());
};

L.bigIntToBase64 = function (num) {
    return util.encodeBase64(bigIntToUint8Array(num));
};

L.base64ToBigInt = function (b64) {
    return uint8ArrayToBigInt(util.decodeBase64(b64));
};

L.UTF8ToBigInt = function (s) {
    return uint8ArrayToBigInt(util.decodeUTF8(s));
};

L.bigIntToUTF8 = function (num) {
    return util.encodeUTF8(bigIntToUint8Array(num));
};

