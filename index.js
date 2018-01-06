var jsbn = require("jsbn");
var bigint = jsbn.BigInteger;
var util = require("tweetnacl-util");
var prime = require("./prime");

var L = module.exports;

var randomPrime = L.randomPrime = prime;
var generateKeyFromPrime = L.generateKeyFromPrime = function (bits, prime, cb) {
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

L.stringToBigInt = function (s) {
    var bytes = util.decodeUTF8(s);
    var num = bigint.ZERO;
    var l = bytes.length;
    for (var i = 0;i < l; i++) {
        num = num.shiftLeft(8).add(new bigint(Number(bytes[i]).toString()));
    }
    return num;
};

L.bigIntToString = function (bi) {
    return util.encodeUTF8(new Uint8Array(bi.toByteArray()));
};

