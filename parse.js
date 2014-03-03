var fs = require('fs'),
  nodes = require('./nodes');

var source = fs.readFileSync('./test/source', 'utf8');

var parser = require('./test/parser').parser;

console.log(parser);
parser.yy = nodes;

var res = parser.parse(source);

console.log(res);
