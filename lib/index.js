var grammar = require('./grammar'),
  parser = require('./parser').parser,
  nodes = require('./nodes');


function compile (source) {
  parser.yy = nodes;
  var ast = parser.parse(source);
  return ast.compile();
}

module.exports = {
  grammar: grammar,
  parser: parser,
  nodes: nodes,
  compile: compile
};
