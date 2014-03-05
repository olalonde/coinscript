#!/usr/bin/env node

var program = require('commander'),
  util = require('util'),
  async = require('async'),
  fs = require('fs'),
  debug = require('debug')('coinscript'),
  jison = require('jison'),
  Parser = jison.Parser,
  coinscript = require('./lib'),
  parser = coinscript.parser,
  nodes = coinscript.nodes,
  grammar = coinscript.grammar;

parser.yy = nodes;

function regenerate_parser () {
  // overwrite parser required at top 
  console.log('regenerating');
  parser = new Parser(grammar);
  parser.yy = nodes;
  // generate source, ready to be written to disk
  var parserSource = parser.generate();
  fs.writeFileSync(__dirname + '/lib/parser.js', parserSource);
}

function log (val) {
  if (!program.human) {
    console.log(JSON.stringify(val));
    return;
  }
  console.log(util.inspect(val, { depth: null, colors: true }));
}

program
  .version(JSON.parse(fs.readFileSync(__dirname + '/package.json', 'utf8')).version)
  .usage('<action>')
  .option('--human', 'Human friendly output.')
  .option('--dev', 'Regenerate parser before compiling.');

program
  .command('*')
  .description('Compile file.')
  .action(function (source) {
    if (program.dev) regenerate_parser();
    source = fs.readFileSync(source, 'utf8');

    var ast = parser.parse(source);
    debug(ast);
    var compiled = ast.compile();
    console.log(compiled);
  });

program
  .command('ast <source>')
  .description('Generate AST tree of source.')
  .action(function (source) {
    if (program.dev) regenerate_parser();
    source = fs.readFileSync(source, 'utf8');

    var ast = parser.parse(source);
    log(ast);
  });

program.parse(process.argv);
