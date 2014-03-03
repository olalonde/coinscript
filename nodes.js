//@todo inheritance

var Root = function (declarations) {
  this.declarations = declarations;
};

var Func = function (identifier, paramlist, body) {
  //console.log('new Func');
  //console.log(arguments);
  this.identifier = identifier;
  this.paramlist = paramlist;
  this.body = body;
};

var Assign = function (variable, value) {
  this.variable = variable;
  this.value = value;
};

var Invocation = function (funcName, arglist) {
  this.funcName = funcName;
  this.arglist = arglist;
};

  //console.log('new Func');
module.exports = {
  Root: Root,
  Func: Func,
  Invocation: Invocation,
  Assign: Assign
};
