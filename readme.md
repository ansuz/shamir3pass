# Shamir3pass

Copied from [sorribas/shamir3pass](https://github.com/sorribas/shamir3pass).

---

## WARNING

This library has not been audited or validated in any way by anyone with experience in implementing cyphers.

You definitely should not depend on this library for handling sensitive information.

Additionally, it is a work in progress, and I make no guarantees that its API will remain stable.

---

Implements commutative encryption suitable for [implementing a three-pass-protocol](https://en.wikipedia.org/wiki/Three-pass_protocol).

Encrypt a plaintext in with as many keys as you like, and decrypt the resulting cyphertext an any order to reveal the same result.

## Caveats

* when converted to a big integer, messages must have a value of at least 2
* messages are not authenticated
* messages must not be larger than the size of the shared prime

## Usage

### Generating keys

#### async

Recommended non-blocking random prime generator.

```javascript
var s = require("shamir3pass");

// use nacl's randomBytes as a source of entropy
var nacl = require("tweetnacl");

// generate a random 1024-bit prime
s.prime(nacl.randomBytes, 1024, function (e, prime) {
    if (e) { return console.error(e); }

    // primes are big integers (implemented by jsbn.BigInteger

    // generate a 1024-bit encryption key using this prime
    s.genkeys(nacl.randomBytes, 1024, prime, function (e, key) {
        if (e) { return console.error(e); }
        /* do something with your encryption key */
    });
});
```

#### synchronous

Executed in the browser, this is likely to grind the CPU and halt the page.

```
var P = s.prime.sync(nacl.randomBytes, 1024);
var key = s.genkeys.sync(nacl.randomBytes, 1024, P);
```

### Encryption and decryption with a single key

```javascript
var util = require("tweetnacl-util");

// assuming you have generated a key

// this is a binary block cypher.
var utf8_string = 'pewpewpew';

// convert your string to a Uint8Array
var plaintext = util.decodeUTF8(utf8_string);

// encrypt your plaintext
var cyphertext = s.encrypt(plaintext, key);

// display your encrypted content
console.log(util.encodeBase64(cyphertext));

// decrypt your cyphertext
var decrypted = s.decrypt(cyphertext, key);

// your decrypted content is still a Uint8Array
// convert it back to a string
var utf8_decrypted = util.encodeUTF8(decrypted);

if (utf8_decrypted === utf8_string) {
    console.log("decrypted successfully!");
}
```

### Encryption and decryption with multiple keys

```javascript
// assume we have two keys (aliceKey and bobKey) generated with the same prime

var plaintext = util.decodeUTF8('bork bork bork');

// alice encryps the plaintext
var aliceCyphertext = s.encrypt(plaintext, aliceKey);

// bob encrypts alice's cyphertext
var bobCyphertext = s.encrypt(aliceCyphertext, bobKey);

// now we have a cyphertext encrypted with two keys
// normally we'd have to decrypt it in reverse order
// but this cypher allows us to decrypt in ANY ORDER
var aliceDecrypted = s.decrypt(bobCyphertext, aliceKey);

// alice has decrypted the data, but it is still encrypted with bob's key
// now bob decrypts the data
var bobDecrypted = s.decrypt(aliceDecrypted, bobKey);

// print the decrypted value ('bork bork bork')
console.log(s.encodeUTF8(bobDecrypted));
```

## Cryptographic properties

1. Encryption keys are just large, random primes
2. Decryption keys are derived from the encryption key using a modular inverse operation, and as such, if your encryption key is compromised, the decryption key can be trivially recovered
3. If your decryption key is compromised, your encryption key does not provide much value
4. Given #2 and #3, both keys must be treated as private (do not share under any condition)
5. Encryption keys are used as the exponent, while the shared prime is used as the modulus. Without the shared modulus, encryption will not be commutative.

### Use cases

Unlike other multi-party crypto-systems like _Shamir's secret sharing_, data can be encrypted in multiple stages.

This cypher is not limited to commutative encryption with only two keys.
In theory, it should scale to a very large number of keys, but it has only been tested with as many as 25.

Some multi-party applications are listed below.

#### Locking a shared resource


Alice is a physicist on an interplanetary expedition, along with Bob, Carol, and Dan.
Unfortunately, there is evidence that one of the expedition members has gone mad from their extended isolation in space.
They are expected to fly a shuttle down to a planet to take samples, but their shuttle only carries two passengers.

It is dangerous to leave the main ship, either descending planetside with the mad crew member, or leaving them on the main ship with just one other person.
Fortunately, Alice studied cryptography and game theory.
She applies a layer of disk encryption to the ship's flight computer, and then encrypts the password with a commutative cypher.
Once this is done, she has the other crew members generate keys and encrypt the data themselves.

Alice still knows the passphrase for the disk encryption, so she can always unlock it herself, however, she now has some assurance that the mad crew member will not harm any of the others, as the ship will not be able to fly without all of their keys.

#### Fairly dividing resources

Alice, Bob, Carol, and Dan cannot agree on sleeping arrangements in their spaceship.
Their ship has two indepedent sleeping quarters, and one shared quarter with two bunks.
Dan has offered to generate random numbers with his personal computer, but nobody trusts him because he is a statistician.

Carol thinks of a solution:

1. Carol encodes the ids of the four beds, and encrypts them all.
2. She reorders the encrypted ids, and sends them to Dan.
3. Dan encrypts the list again, shuffles it, and sends it to Alice
4. Alice and Bob perform the same steps
5. Finally, everybody has contributed to the shuffling process, and cannot identify which bunk is which
6. They take turns choosing one of the cyphertexts, and having the others decrypt the value with their keys until the bunk is revealed

In the end, they all have a bunk, and did not have to trust any one person's random number generator.

This is one way to implement [shuffling cards using commutative encryption](https://en.wikipedia.org/wiki/Mental_poker#Shuffling_cards_using_commutative_encryption).

#### Anonymous voting

Having discovered a habitable planet, the crew decides to wake more crew members from hibernation.
They decide to form a democratic society, but would like to cast their votes anonymously.

Dan the statistician proposes a method:

1. While they take time to decide how to vote, each of the 13 citizens generates a cryptographic keypair.
2. When it is ready, they generate a random token that they'll be able to recognize, and encrypt it and their vote together using they encryption key.
3. Once their vote is encrypted, they are able to add it to a public list of votes.
4. Once everybody has published their vote, every citizen encrypts every key other than their own until all votes are encrypted with all keys.
5. Every citizen now generates a second key which they will use to anonymize all the votes.
6. Each citizen then takes a turn encrypting the entire list, one key at a time, and posting the encrypted version after shuffling the list.
7. Once everyone has contributed to the anonymization of the list, citizens take turns decrypting the entire list with both of their keys.

Once the list has been fully decrypted, it should not be possible to determine whose vote is whose without the entire group colluding.
Additionally, since every citizen generated a secret token when they voted, they should be able to check that their vote was counted in the final list.
If nobody objects, the vote is considered fair and binding.

In the event that any of the votes fail to decrypt, it is possible for citizens to step back through the process to determine who sabotaged the process, though this is at the cost of some privacy.
This being the case, it seems the most basic attack vector is a denial-of-service: since everyone has a role in the process, anyone can obstruct it.

There are also some obvious scaling issues: each user must generate two keys, and encrypt and decrypt twice the number of votes.
In practice, optimizations can be made if anyone is willing to make their vote public, or if they decide that they trust someone else to shuffle fairly.

Summarizing: this method works well for small groups where everyone can be present for voting at one time.
The interactivity of the protocol and its scaling issues make it unsuitable for votes by large populaces.


