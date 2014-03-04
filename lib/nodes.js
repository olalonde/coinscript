//@todo inheritance
var util = require('util'),
  inherits = util.inherits;

var scope; // @TODO oops, use global scope...

function compileArray(arr) {
  var res = '';
  arr.forEach(function (ele) {
    //console.log(ele);
    var compiled = ele.compileFragment();
    res += compiled ? compiled  + '\n' : '';
  });
  return res;
}

var Root = function (declarations) {
  this.declarations = declarations;
};


Root.prototype.compileFragment = function () {
  scope = {}; // reset scope to {}
  var res = compileArray(this.declarations);
  return res;
};

var Value = function (val) {
  this.value = val;
};

Value.prototype.compileFragment = function () {
  if (this.value.compileFragment) {
    return this.value.compileFragment();
  }
  return this.value;
};

var Variable = function (name) {
  this.name = name;
};

Variable.prototype.compileFragment = function () {
  var val = scope[this.name];
  if (typeof val === 'undefined') {
    console.log(util.inspect(scope, { depth: null }));
    throw new Error(this.name + ' is out of scope or undeclared.');
  }
  return (val.compileFragment) ? val.compileFragment() : val;
};

var Param = function (name) {
  this.name = name;
};

// no need to compile.. presumably, already on stack?
Param.prototype.compileFragment = function () {
};

// Function declaration
var Func = function (identifier, paramlist, body) {
  //console.log('new Func');
  //console.log(arguments);
  this.identifier = identifier;
  this.paramlist = paramlist;
  this.body = body;
};

Func.prototype.compileFragment = function () {
  var self = this;
  // save parameters on scope
  this.paramlist.forEach(function (param) {
    scope[param.name] = param;
  });

  scope[this.identifier] = this;
  return compileArray(this.body);
};

var Assign = function (variable, value) {
  this.variable = variable;
  this.value = value;
};

Assign.prototype.compileFragment = function () {
  scope[this.variable.name] = this.value;
};

var Invocation = function (funcName, arglist) {
  this.funcName = funcName;
  this.arglist = arglist;
};

var NativeCalls = {
  assert: function (arglist) {
    return 'ASSERT';
  },
  equal: function () {
    return 'EQUAL';
  },
  hash160: function () {
    return 'HASH160';
  },
  checksig: function () {
    return 'CHECKSIG';
  }
};

Invocation.prototype.compileFragment = function () {
  // @TODO: non native invocations
  var self = this;

  var func = NativeCalls[this.funcName];
  if (!func) {
    throw new Error('Function ' + this.funcName + ' does not exist.');
  }
  // Push arguments on stack...
  // @TODO: track stack state. some OPs modify first element on stack
  // etc.
  var res = '';
  this.arglist.forEach(function (arg) {
    res += arg.compileFragment();
    res += '\n';
  });
  res += func();
  return res;
};

  //console.log('new Func');
module.exports = {
  Root: Root,
  Func: Func,
  Invocation: Invocation,
  Value: Value,
  Variable: Variable,
  Param: Param,
  Assign: Assign
};
