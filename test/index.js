var assert = require('assert'),
  fs = require('fs'),
  bitscript = require('../'),
  compile = bitscript.compile,
  nodes = bitscript.nodes,
  parse = bitscript.parse;

var DATA_PATH = __dirname + '/data/';

// Read file names in data/, excluding extension
var files = [];
fs.readdirSync(DATA_PATH).forEach(function (file) {
  var match = file.match(/(.+)\.bitscript$/);
  if (match && match[1]) files.push(match[1]);
});

//@todo test parsing

describe('Parsing', function () {
  files.forEach(function (file) {
    var source = fs.readFileSync(DATA_PATH + file + '.bitscript', 'utf8');

    describe(file + '.bitscript', function () {
      var ast;

      it('should not throw errors', function () {
        ast = parse(source);
      });

      it('should not return an object', function () {
        assert.equal('object', typeof ast);
      });

      it('should return a Root node', function () {
        assert.ok(ast instanceof nodes.Root);
      });

      it('the Root node should be an instance of Base node', function () {
        assert.ok(ast instanceof nodes.Base);
      });

    });

  });
});

describe('Compilation', function () {
  files.forEach(function (file) {
    var source = fs.readFileSync(DATA_PATH + file + '.bitscript', 'utf8');
    var expected = fs.readFileSync(DATA_PATH + file + '.res', 'utf8');

    describe(file + '.bitscript', function () {
      var result;

      it('should not throw errors', function () {
        result = compile(source);
      });

      it('should produce expected code', function () {
        assert.equal(expected, result);
      });

    });
  });
});
