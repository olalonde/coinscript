# Bitscript

Language and compiler for Bitcoin scripts.

Bitscript uses a Javascript like syntax.

**Work in progress.**

# Install

```
npm install -g bitscript
```

# Usage

Compile source.bitscript

```
bitscript source.bitscript > result.out
```

Generate AST tree

```
bitscript ast source.bitscript > ast.json
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

  // should optimize to OP_EQUALVERIFY
  assert(pubKeyHash == pubKeyHashA);

  // TODO: if/else flow control

  // should optimize to OP_CHECKSIGVERIFY
  assert(checksig(sig, pubkey));
}
```
