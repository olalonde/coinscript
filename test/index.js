var should = require('should'),
  fs = require('fs'),
  jison = require('Jison'),
  Parser = jison.Parser,
  coinscript = require('../'),
  nodes = coinscript.nodes;

// Use in memory parser!
var parser = new Parser(coinscript.grammar);
parser.yy = nodes;
var parse = parser.parse.bind(parser);
function compile (source) {
  return parse(source).compile();
}

var dirs = {
  'compile-errors': 'compile-errors/',
  'compile-results': 'compile-results/',
  'syntax-errors': 'syntax-errors/'
};

// Read file names in compile-results/, excluding extension
var names = [];
fs.readdirSync(__dirname + '/' + dirs['compile-results']).forEach(function (file) {
  var match = file.match(/(.+)\.coin/);
  if (match && match[1]) names.push(match[1]);
});

//@todo test parsing

function parse_file (name, type) {
  type = type || 'compile-results';
  var source = fs.readFileSync(__dirname + '/' + dirs[type] + name + '.coin', 'utf8');
  return parse(source);
}

describe('Parsing', function () {
  describe ('an invalid function declaration', function () {
    it('should throw a parse error', function () {
      should.throws(function () {
        parse_file('invalid-function-declaration', 'syntax-errors');
      }, /Parse error/);
    });
  });

  names.forEach(function (name) {
    describe(name + '.coin', function () {
      var ast;

      it('should not throw errors', function () {
        ast = parse_file(name);
      });

      it('should not return an object', function () {
        should.equal('object', typeof ast);
      });

      it('should return a Root node', function () {
        should.ok(ast instanceof nodes.Root);
      });

      it('the Root node should be an instance of Base node', function () {
        should.ok(ast instanceof nodes.Base);
      });

    });

  });
});

describe('Compiling', function () {

  function actual (name, type) {
    type = type || 'compile-results';
    var source = fs.readFileSync(__dirname + '/' + dirs[type] + name + '.coin', 'utf8');
    return compile(source);
  }

  function expected (name, type) {
    type = type || 'compile-results';
    return fs.readFileSync(__dirname + '/' + dirs[type] + name + '.res', 'utf8');
  }

  describe('a source without a main function', function () {
    it('should throw an error', function () {
      should.throws(function () {
        actual('no-main-function', 'compile-errors');
      }, /main\(\)/);
    });
  });

  describe('a function call using an undefined variable as argument', function () {
    it('should throw an error', function () {
      should.throws(function () {
        actual('function-call-undefined-variable', 'compile-errors');
      }, /undefined/i);
    });
  });

  describe('assigning a var to an undefined var', function () {
    it('should throw an error', function () {
      should.throws(function () {
        actual('assign-var-to-undefined-var', 'compile-errors');
      }, /undefined/i);
    });
  });

  names.forEach(function (name) {
    describe(name + '.coin', function () {
      var result;

      it('should not throw errors', function () {
        result = actual(name);
      });

      it('should produce expected code', function () {
        should.equal(expected(name), result);
      });

    });
  });
});
