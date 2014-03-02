// see http://coffeescript.org/documentation/docs/grammar.html
// http://dinosaur.compilertools.net/bison/bison_4.html#SEC7

var fs = require('fs');
var source = fs.readFileSync(__dirname + '/test/source', 'utf8');

// mygenerator.js
var Parser = require('jison').Parser;

var Parser = require("jison").Parser;

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
          "FUNCTION IDENTIFIER ( arglist ) { expressions }",
          "declarations declarations"
        ],
        "arglist": [
          "IDENTIFIER",
          "arglist , arglist"
        ],
        "expressions": [
          "expression ;",
          "expressions expressions"
        ],
        "expression": [
          "RETURN IDENTIFIER"
        ]
    }
};

var parser = new Parser(grammar);

// generate source, ready to be written to disk
var parserSource = parser.generate();

console.log(parserSource);

// you can also use the parser directly from memory

console.log(parser.parse(source));
// returns true
debugger;
console.log('test');
