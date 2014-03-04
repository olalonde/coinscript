//@todo inheritance
var helpers = require('./helpers'),
  extend = helpers.extend,
  inherits = helpers.inherits,
  debug = require('debug')('bitscript:nodes');

function new_context() {
  var o = {
    scope: {
      vars: {},
      funcs: {}
    },
    stack: []
  };

  // Add native functions
  var definitions = {
    // name    opcode, arglen, returns? (pushed value on stack)
    equal: [ 'OP_EQUAL', 2, true ],
    assert: [ 'OP_ASSERT', 2, true ]
  };

  var funcs = {};
  for (var name in definitions) {
    var opcode = definitions[name][0];
    var arglen = definitions[name][1];
    var returns = definitions[name][2];

    var func = new NativeFunc(name, opcode, arglen, returns);
    funcs[name] = func;
  }

  extend(o.scope.funcs, funcs);

  return o;
}

/**
 * Base
 *
 * Every node inherits from Base
 */
function Base () {}

// Compilation state is saved on `o`
Base.prototype.compile = function (o) {
  o = o || new_context();

  if (typeof this.compileNode !== 'function') {
    throw new Error(this.type + ' does not implement compileNode.');
  }

  this.compileNode(o);
  debug('%j', o.stack);
  return o.stack.join('\n');
};

// Passes each child to a function, breaking when the function returns `false`.
Base.prototype.eachChild = function (cb) {
  if (!this.children) return this;
  for (var i = 0; i < this.children.length; i++) {
    if (cb(this.children[i]) === false) {
      return this;
    }
  }
};

// Add node type when serializing. We need to do this because the type
// is set on the prototype.
Base.prototype.toJSON = function () {
  return extend({ type: this.type }, this);
};

/**
 * Root
 *
 * Root node
 */
function Root (declarations) {
  this.children = declarations;
}

inherits(Root, Base);

Root.prototype.compileNode = function (o) {
  this.eachChild(function (child) {
    return child.compile(o);
  });

  // We have saved all our function declarations
  // to our scope. We now need to compile the main function.
  var mainFunc = o.scope.funcs.main;
  if (!mainFunc) {
    throw new Error('No main() function declared.');
  }

  // Compile invocation of main function
  // No arguments... we assume they are already on stack
  var mainInvocation = new Invocation('main');

  return mainInvocation.compile(o);
};

/**
 * Func
 *
 * Function declaration
 */
function Func (name, params, statements) {
  this.name = name;
  this.params = params;
  this.children = statements;
}

inherits(Func, Base);

Func.prototype.compileNode = function (o) {
  // A function declaration doesn't compile to anything
  // but we need to save the function to our scope
  o.scope.funcs[this.name] = this;
};

Func.prototype.compileBody = function (o) {
  // @TODO
  //throw new Error('Called ' + this.name + ': non native functions not supported yet.');
  this.eachChild(function (statement) {
    statement.compile(o);
  });
};

function NativeFunc (name, opcode, arglen, returns) {
  this.name = name;
  this.opcode = opcode;
  this.arglen = arglen || 0;
  this.returns = returns || false;
}

inherits(NativeFunc, Func);

NativeFunc.prototype.compileBody = function (o) {
  o.stack.push(this.opcode);
};

/**
 * Param
 *
 * Function parameter
 */
function Param (name) {
  this.name = name;
}

inherits(Param, Base);

/**
 * Invocation
 *
 * Function invocation
 */
function Invocation (name, args) {
  this.name = name;
  this.args = args;
}

inherits(Invocation, Base);

Invocation.prototype.compileNode = function (o) {
  var func = o.scope.funcs[this.name];
  if (!func) {
    throw new Error('Called unknown function ' + this.name);
  }

  // TODO: Push arguments on stack? or check if they are already on
  // stack?
  func.compileBody(o);
};

/**
 * Literal
 *
 * String literal
 */
function Literal (val) {
  this.val = val;
}

inherits(Literal, Base);

/**
 * Variable
 *
 * Variable
 */
function Variable (name) {
  this.name = name;
}

inherits(Variable, Base);

/**
 * Assign
 *
 * Variable assignment
 */
function Assign (variable, assignable) {
  this.variable = variable;
  this.assignable = assignable;
}

inherits(Assign, Base);

Assign.prototype.compileNode = function (o) {
  o.scope.vars[this.variable.name] = this.assignable;
};

var nodes = {
  Base: Base,
  Root: Root,
  Func: Func,
  Param: Param,
  Invocation: Invocation,
  Literal: Literal,
  Variable: Variable,
  Assign: Assign
};

// Save Node type to their prototype
for (var key in nodes) {
  nodes[key].prototype.type = key;
}

module.exports = nodes;
