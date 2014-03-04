// see http://coffeescript.org/documentation/docs/grammar.html
// http://dinosaur.compilertools.net/bison/bison_4.html#SEC7

var util = require('util');

//var nodes = require('./nodes');

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
           ["\\/\\/.*", "/* ignore comment */"],
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
          o('Param', function () { return [$1]; }),
          o('ParamList , Param', function () { return $1.concat($3); })
        ],
        Param: [
          o('IDENTIFIER', function () { return new Param($1); }),
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
          o('STRING_LITERAL', function () { yytext = yytext.substr(1, yyleng - 2); return new Value(yytext); })
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
        Variable: [
          o('IDENTIFIER', function () { return new Variable($1); })
        ],
        Expression: [
          o('Value'),
          o('Variable'),
          o('Invocation')
        ],
        Assignable: [
          o('Expression')
        ],
        Assign: [
          o('Variable = Assignable', function () { return new Assign($1, $3); })
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

//console.log(util.inspect(grammar, { depth: null }));

module.exports = grammar;
