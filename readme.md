# Shamir3pass

Copied from [sorribas/shamir3pass](https://github.com/sorribas/shamir3pass).

---

## WARNING

This library has not been audited or validated in any way by anyone with experience in implementing cyphers.

You definitely should not depend on this library for handling sensitive information.

---

Implements commutative encryption.

Encrypt a plaintext in with as many keys as you like, and decrypt the resulting cyphertext an any order to reveal the same result.

## Caveats

* cyphertexts are not padded
* you cannot encrpyt the empty string
* messages cannot be larger than 1024 bytes
* messages are not authenticated at all
* key generation is very slow
* two bignum libraries are used because neither one on its own had all the methods that were required

