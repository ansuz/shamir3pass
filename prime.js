var bigint = require("jsbn").BigInteger;

// primes are 30k+i for i = 1, 7, 11, 13, 17, 19, 23, 29
var GCD_30_DELTA = [6, 4, 2, 4, 2, 4, 6, 2];
var THIRTY = new bigint(null);
THIRTY.fromInt(30);

var op_or = function(x, y) { return x | y; };

var getMillerRabinTests = function (bits) {
  if(bits <= 100) { return 27; }
  if(bits <= 150) { return 18; }
  if(bits <= 200) { return 15; }
  if(bits <= 250) { return 12; }
  if(bits <= 300) { return 9; }
  if(bits <= 350) { return 8; }
  if(bits <= 400) { return 7; }
  if(bits <= 500) { return 6; }
  if(bits <= 600) { return 5; }
  if(bits <= 800) { return 4; }
  if(bits <= 1250) { return 3; }
  return 2;
};

var randomNumberGenerator = function (bytes) {
    return {
        nextBytes: function (x) {
            var b = bytes(x.length);
            var l = x.length;
            for (var i = 0; i < l; ++i) { x[i] = b[i]; }
        }
    };
};

var generateRandom = function (rng, bits) {
    var num = new bigint(bits, rng);
    // force MSB set
    var bits1 = bits - 1;
    if(!num.testBit(bits1)) {
        num.bitwiseTo(bigint.ONE.shiftLeft(bits1), op_or, num);
    }
    // align number on 30k+1 boundary
    num.dAddOffset(31 - num.mod(THIRTY).byteValue(), 0);
    return num;
};

var incrementor = function (f) {
    return function inc (rng, num, bits, deltaIdx, mrTests, maxBlockTime, callback) {
        var start = +new Date();
        do {
            // overflow, regenerate random number
            if(num.bitLength() > bits) {
                num = generateRandom(rng, bits);
            }
            // do primality test
            if(num.isProbablePrime(mrTests)) {
                if (typeof(callback) === 'function') {
                    return callback(null, num);
                }
                return num;
            }
            // get next potential prime
            num.dAddOffset(GCD_30_DELTA[deltaIdx++ % 8], 0);
        } while(maxBlockTime < 0 || (+new Date() - start < maxBlockTime));

        // keep trying later
        return f(function() {
            return inc(rng, num, bits, deltaIdx, mrTests, maxBlockTime, callback);
        });
    };
};

var makePrime = function (f) {
    return function (bytes /* source of random bytes */, bits /* width */, cb) {
      var rng = randomNumberGenerator(bytes);
      // initialize random number
      var num = generateRandom(rng, bits);

      /* Note: All primes are of the form 30k+i for i < 30 and gcd(30, i)=1. The
      number we are given is always aligned at 30k + 1. Each time the number is
      determined not to be prime we add to get to the next 'i', eg: if the number
      was at 30k + 1 we add 6. */
      var deltaIdx = 0;

      // get required number of MR tests
      var mrTests = getMillerRabinTests(num.bitLength());

      var inc = incrementor(f);

      // find prime nearest to 'num' for maxBlockTime ms
      // 10 ms gives 5ms of leeway for other calculations before dropping
      // below 60fps (1000/60 == 16.67), but in reality, the number will
      // likely be higher due to an 'atomic' big int modPow
      return inc(rng, num, bits, deltaIdx, mrTests, 10 /* maxBlockTime */, cb);
    };
};

var prime = module.exports = makePrime(function (f) { setTimeout(f); });
prime.sync = makePrime(function (f) { return f(); });

