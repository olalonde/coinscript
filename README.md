# Coinscript

[![Build Status](https://travis-ci.org/olalonde/coinscript.png)](https://travis-ci.org/olalonde/coinscript)

Experimental language and compiler for Bitcoin scripts.

Coinscript uses a Javascript like syntax.

**Work in progress.**

# Install

```
npm install -g coinscript
```

# Usage

Compile source.coinscript

```
coinscript source.coin > result.out
```

Generate AST tree

```
coinscript ast source.coin > ast.json
```

Options:

```
--dev Regenerate parser before compiling.
```

# Examples

## Standard transaction

```javascript
function main (sig, pubKey) {
  pubKeyHash = 'somehash....';
  pubKeyHashA = hash160(pubKey);

  assert(equal(pubKeyHash, pubKeyHashA));
  assert(checksig(sig, pubKey));
}
```

Compiles to (for now! - ugly, I know):

```
somehash....
OP_PICK 1
OP_HASH160
OP_EQUAL
OP_VERIFY
OP_PICK 1
OP_PICK 1
OP_CHECKSIG
OP_VERIFY
```

# TODO

I probably got the OP codes wrong for now but this is just a matter of 
tweaking some parameters in the native functions list. 

Lots of optimization to do:

For example: Don't OP_PICK uselessly. Some OP codes can be combined
together (`OP_CHECKSIG OP_VERIFY` -> `OP_CHECKSIGVERIFY`). etc.

Also need a way to encode the intermediate language to binary
representation.
