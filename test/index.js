var assert = require('assert'),
  fs = require('fs'),
  bitscript = require('../'),
  compile = bitscript.compile;

var DATA_PATH = __dirname + '/data/';

// Read file names in data/, excluding extension
var files = [];
fs.readdirSync(DATA_PATH).forEach(function (file) {
  var match = file.match(/(.+)\.bitscript$/);
  if (match && match[1]) files.push(match[1]);
});

//@todo test parsing

describe('Compilation', function () {
  files.forEach(function (file) {
    var source = fs.readFileSync(DATA_PATH + file + '.bitscript', 'utf8');
    var expected = fs.readFileSync(DATA_PATH + file + '.res', 'utf8');
    describe(file + '.bitscript compilation', function () {
      var result = compile(source);
      it('should produce expected code', function () {
        assert.equal(expected, result);
      });
    });
  });
});
