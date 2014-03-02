// see http://coffeescript.org/documentation/docs/grammar.html
// http://dinosaur.compilertools.net/bison/bison_4.html#SEC7

var fs = require('fs');
var source = fs.readFileSync(__dirname + '/test/source', 'utf8');

// mygenerator.js
var jison = require('jison'),
  Generator = jison.Generator,
  Parser = jison.Parser,
  nodes = require('./nodes');

var unwrap = /^function\s*\(\)\s*\{\s*return\s*([\s\S]*);\s*\}/;

function o (patternString, action) {
  if (!action)
    return [patternString, '$$ = $1'];

  var match;
  action = (match = unwrap.exec(action)) ? match[1] : '(' + action + '())';
  action = action.replace(/\bnew /g, '$&yy.');

  return [patternString, '$$ = ' + action];
}

var grammar = {
    lex: {
        rules: [
           ["\\s+", "/* ignore whitespace */"],
           ["function\\s+", "return 'FUNCTION';"],
           ["\\(", "return '(';"],
           ["\\)", "return ')';"],
           ["\\{", "return '{';"],
           ["\\}", "return '}';"],
           [",", "return ',';"],
           [";", "return ';';"],
           ["return\\s+", "return 'RETURN';"],
           ["[a-z]+[0-9]*", "return 'IDENTIFIER';"]
        ]
    },

    bnf: {
        "declarations": [
          o("FUNCTION IDENTIFIER ( arglist ) { expressions }"),
          o("declarations declarations")
        ],
        "arglist": [
          o("", function () { return []; }),
          o("IDENTIFIER", function () { return [$1]; }),
          o("arglist , IDENTIFIER", function () { return $1.concat($3); })
        ],
        "expressions": [
          o("expression ;"),
          o("expressions expressions")
        ],
        "expression": [
          o("RETURN IDENTIFIER", function () { return new Expression(); })
        ]
    }
};


var parser = new Parser(grammar);

parser.yy = nodes;

// generate source, ready to be written to disk
var parserSource = parser.generate();

console.log(parserSource);

// you can also use the parser directly from memory

console.log(parser.parse(source));
// returns true
