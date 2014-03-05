var grammar = require('./grammar'),
  parser = require('./parser').parser,
  nodes = require('./nodes');

parser.yy = nodes;

function compile (source) {
  var ast = parser.parse(source);
  return ast.compile();
}

module.exports = {
  grammar: grammar,
  parser: parser,
  parse: parser.parse.bind(parser),
  nodes: nodes,
  compile: compile
};
