//@todo inheritance

var Root = function (declarations) {
  this.declarations = declarations;
};

var Expression = function (expr) {
  //console.log('new Expression');
  //console.log(arguments);
  this.expr = expr;
};

var Func = function (identifier, arglist, body) {
  //console.log('new Func');
  //console.log(arguments);
  this.identifier = identifier;
  this.arglist = arglist;
  this.body = body;
};

module.exports = {
  Root: Root,
  Func: Func,
  Expression: Expression
};
