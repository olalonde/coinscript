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

  return [ patternString, '$$ = ' + action ];
}

var grammar = {
    lex: {
        rules: [
           ["\\s+",           "/* ignore whitespace */"],
           ["\\/\\/.*",       "/* ignore comment */"],
           ["function\\s+",   "return 'FUNCTION';"],
           ["\\(",            "return '(';"],
           ["\\)",            "return ')';"],
           ["\\{",            "return '{';"],
           ["\\}",            "return '}';"],
           [",",              "return ',';"],
           [";",              "return ';';"],
           ["=",              "return '=';"],
           ["return\\s+",     "return 'RETURN';"],
           ["'[^']*'",        "return 'STRING_LITERAL';"],
           ["[-+]?[0-9]*\\.?[0-9]+", "return 'NUMBER_LITERAL';"],
           ["[a-zA-Z]+[0-9]*", "return 'IDENTIFIER';"]
        ]
    },

    //tokens: ["FUNCTION", "(", ")", "{", "}", ",", ";", "RETURN", "IDENTIFIER"],

    bnf: {

        Root: [
          o('Declarations',                 function () { return new Root($1); }),
        ],

        // declaration declaration etc.
        Declarations: [
          o('Declaration',                  function () { return [$1]; }),
          o('Declarations Declaration',     function () { return $1.concat($2); })
        ],

        // function a(param1, param2) { statements... }
        Declaration: [
          o('FUNCTION IDENTIFIER ( ParamList ) { Statements }', function () { return new Func($2, $4, $7); })
        ],

        // param1, param2
        ParamList: [
          o('',                             function () { return []; }),
          o('Param',                        function () { return [$1]; }),
          o('ParamList , Param',            function () { return $1.concat($3); })
        ],

        Param: [
          o('IDENTIFIER',                   function () { return new Param($1); }),
        ],

        // somefunc()
        Invocation: [
          o('IDENTIFIER ( )',               function () { return new Invocation($1, []); }),
          o('IDENTIFIER ( ArgList )',       function () { return new Invocation($1, $3); })
        ],

        ArgList: [
          o('Arg',                          function () { return [$1]; }),
          o('ArgList , Arg',                function () { return $1.concat($3); })
        ],

        Arg: [
          o('Expression')
        ],

        // somevar, somefun(), 'someliteral'
        Expression: [
          o('Literal'),
          o('Variable'),
          o('Invocation')
        ],

        // 'someliteral'
        Literal: [
          o('STRING_LITERAL',               function () {
                                              yytext = yytext.substr(1, yyleng - 2);
                                              return new Literal(yytext);
                                            }
          ),
          o('NUMBER_LITERAL',               function () { return new Literal(Number(yytext)); }
          )
        ],

        Statements: [
          o('',                             function () { return []; }),
          o('Statement ;',                  function () { return [ $1 ]; }),
          o('Statements Statement ;',       function () { return $1.concat($2); })
        ],

        Statement: [
          o('Assign'),
          o('Invocation')
        ],

        Variable: [
          o('IDENTIFIER',                   function () { return new Variable($1); })
        ],

        Assignable: [
          o('Expression')
        ],

        Assign: [
          o('Variable = Assignable',        function () { return new Assign($1, $3); })
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
