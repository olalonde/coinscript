// see http://coffeescript.org/documentation/docs/grammar.html
// http://dinosaur.compilertools.net/bison/bison_4.html#SEC7

var fs = require('fs'),
  util = require('util');

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

  return [patternString, '$$ = ' + action + '; console.log($1);'];
}

var grammar = {
    lex: {
        rules: [
           ["\\s+", "/* ignore whitespace */"],
           ["//.*", "/* ignore comment */"],
           ["function\\s+", "return 'FUNCTION';"],
           ["\\(", "return '(';"],
           ["\\)", "return ')';"],
           ["\\{", "return '{';"],
           ["\\}", "return '}';"],
           [",", "return ',';"],
           [";", "return ';';"],
           ["=", "return '=';"],
           ["return\\s+", "return 'RETURN';"],
           ["'[^\\']*'", "return 'STRING_LITERAL';"],
           ["[a-zA-Z]+[0-9]*", "return 'IDENTIFIER';"]
        ]
    },

    //tokens: ["FUNCTION", "(", ")", "{", "}", ",", ";", "RETURN", "IDENTIFIER"],

    bnf: {
        Root: [
          o('Declarations', function () { return new Root($1); }),
        ],
        Declarations: [
          o('Declaration', function () { return [$1]; }),
          o('Declarations Declaration', function () { return $1.concat($2); })
        ],
        Declaration: [
          o('FUNCTION IDENTIFIER ( ParamList ) { Statements }', function () { return new Func($2, $4, $7); })
          //o("declarations declarations")
        ],
        ParamList: [
          o('', function () { return []; }),
          o('IDENTIFIER', function () { return [$1]; }),
          o('ParamList , IDENTIFIER', function () { return $1.concat($3); })
        ],
        Arg: [
          o('Expression')
        ],
        ArgList: [
          o('Arg', function () { return [$1]; }),
          o('ArgList , Arg', function () { return $1.concat($3); })
        ],
        Value: [
          // strip quotes
          o('STRING_LITERAL', function () { yytext = yytext.substr(1, yyleng - 2); return yytext; })
        ],
        Statements: [
          o('', function () { return []; }),
          o('Statement ;', function () { return [ $1 ]; }),
          o('Statements Statement ;', function () { return $1.concat($2); })
        ],
        Statement: [
          o('Assign'),
          o('Invocation')
        ],
        Expression: [
          o('Value'),
          o('IDENTIFIER'),
          o('Invocation')
        ],
        Assignable: [
          o('Expression')
        ],
        Assign: [
          o('IDENTIFIER = Assignable', function () { return new Assign($1, $3); })
        ],
        Invocation: [
          o('IDENTIFIER ( ArgList )', function () { return new Invocation($1, $3); })
        ]
    }
};

// Root should return!
var bnf = grammar.bnf;
for (var name in bnf) {
  var alternatives = bnf[name];
  for (var i = 0; i < alternatives.length; i++) {
    // Root node should RETURN!
    if (name === 'Root') {
      alternatives[i][1] = 'return ' + alternatives[i][1];
    }
  }
}

console.log(util.inspect(grammar, { depth: null }));

var parser = new Parser(grammar);

parser.yy = nodes;

// generate source, ready to be written to disk
var parserSource = parser.generate();

fs.writeFileSync('test/parser.js', parserSource);
//console.log(parserSource);

// you can also use the parser directly from memory

var res = parser.parse(source);

console.log(util.inspect(res, { depth: null }));
// returns true
