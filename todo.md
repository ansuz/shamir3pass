# To do

1. make it run in the browser
  * bignum provides bindings for OpenSSL, so it will have to be replaced
2. make it work with only one bignum library
  * replace bignum
3. speed up key generation
4. document probable attack vectors

## Notes

### Redundant bignums

#### bignum

* does not implement modular inverse
  * used for deriving the decryption key
  * instead I used `jsbn.BigInteger.prototype.modInverse`

#### jsbn

* does not implement random prime generation
  * instead I used `bignume.prime()`
* does not implement `bignum.fromBuffer(bytes)`


