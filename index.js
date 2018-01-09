var jsbn = require("jsbn");
var bigint = jsbn.BigInteger;
var util = require("tweetnacl-util");
var prime = require("./prime");

var L = module.exports;

L.prime = prime; // function (random_bytes, n_bits, cb);
// Prime.sync // (random_bytes, n_bits [, cb]) => prime_number

var keyFromPrime = function (f, Prime) {
    return function (bytes, bits, prime, cb) {
        var n;
        var primeMinusOne = prime.subtract(bigint.ONE);
        var gcd;

        var errors = 0;
        var again = function () {
            return Prime(bytes, bits, function (e, p) {
                if (e) {
                    console.error(e);
                    errors++;
                    if (errors > 3) { return void cb(e); }
                    return f(again);
                }
                n = p;
                gcd = primeMinusOne.gcd(n);
                if (gcd.equals(bigint.ZERO)) { return void again(); }

                // TODO return Encryption, Decryption, and Prime as Uint8Arrays
                var k = {
                    Encryption: n,
                    Decryption: n.modInverse(primeMinusOne),
                    Prime: prime,
                };

                // your keys must be greater than log2(prime)
                /*
                if ((new bigint('2').pow(n)).compareTo(prime) < 0) {
                    console.log(n.toString());
                    console.log(new bigint('2').pow(n));
                    throw new Error('encryption key is less than log2(prime)');
                }
                if (new bigint('2').pow(k.Decryption).compareTo(prime) < 0) {
                    throw new Error('decryption key is less than log2(prime)');
                }*/

                if (typeof(cb) === 'function') {
                    cb(null, k);
                }
                return k;
            });
        };
        return f(again);
    };
};

L.genkeys = keyFromPrime(function (f) { setTimeout(f); }, L.prime);
L.genkeys.sync = keyFromPrime(function (f) { return f(); }, L.prime.sync);

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

L.encrypt = function (u8_m, key) {
    if (!u8_m || !u8_m.length) { throw new Error('invalid plaintext'); }
    var m = uint8ArrayToBigInt(u8_m);

    var cypher = m
    .modPow(key.Encryption, key.Prime);
    return bigIntToUint8Array(cypher);
};

L.decrypt = function (u8_c, key) {
    if (!u8_c || !u8_c.length) { throw new Error('invalid cyphertext'); }
    var c = uint8ArrayToBigInt(u8_c);
    var plain = c
    .modPow(key.Decryption, key.Prime);
    return bigIntToUint8Array(plain);
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

