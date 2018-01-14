var bigint = require("jsbn").BigInteger;
var prime = require("cryptomancy-prime");
var format = require("cryptomancy-format");

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

L.encrypt = function (u8_m, key) {
    if (!u8_m || !u8_m.length) { throw new Error('invalid plaintext'); }
    var m = format.encodeBigInt(u8_m);
    if (m.compareTo(bigint.ONE) < 1) { throw new Error('invalid plaintext'); }

    var cypher = m
    .modPow(key.Encryption, key.Prime);
    return format.decodeBigInt(cypher);
};

L.decrypt = function (u8_c, key) {
    if (!u8_c || !u8_c.length) { throw new Error('invalid cyphertext'); }
    var c = format.encodeBigInt(u8_c);
    if (c.compareTo(bigint.ONE) < 1) { throw new Error('invalid cyphertext'); }
    var plain = c
    .modPow(key.Decryption, key.Prime);
    return format.decodeBigInt(plain);
};

