//@todo inheritance
var helpers = require('./helpers'),
  extend = helpers.extend,
  inherits = helpers.inherits,
  debug = require('debug')('bitscript:nodes');

/**
 * Custom Errors
 */
// bug with mocha when extending error
function CompileError(msg) {
  var err = new Error(msg);
  err.name = 'CompileError';
  return err;
}

/**
 * Create a new context everytime compile()
 * is called to save some compilation state.
 */
function new_context() {
  var o = {
    vars: {},
    funcs: {},
    stack: [],
    script: []
  };

  // Add native functions
  var definitions = {
    // name    opcode, arglen, returns? (pushed value on stack)
    equal:    [ 'OP_EQUAL',    2, true ],
    hash160:  [ 'OP_HASH160',  2, true ],
    checksig: [ 'OP_CHECKSIG', 0, false ],
    assert:   [ 'OP_VERIFY',   2, true ]
  };

  var funcs = {};
  for (var name in definitions) {
    var opcode = definitions[name][0];
    var arglen = definitions[name][1];
    var returns = definitions[name][2];

    var func = new NativeFunc(name, opcode, arglen, returns);
    funcs[name] = func;
  }

  extend(o.funcs, funcs);

  return o;
}

/**
 * Base node
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

  debug('Compiling %s node', this.type);
  debug('Script: %j', o.script);
  debug('Stack: %j', o.stack);
  this.compileNode(o);
  // http://stackoverflow.com/questions/729692/why-should-files-end-with-a-newline
  return o.script.join('\n') + '\n';
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
// is set on the prototype and prototype properties don't get serialized.
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

  // We have now saved all our function declarations
  // to our context. We now need to compile the main function.
  var mainFunc = o.funcs.main;
  if (!mainFunc) {
    throw new Error('No main() function declared.');
  }

  // Compile invocation of main function
  // No arguments... we assume they are already on stack
  var mainInvocation = new Invocation('main', [ new StackReference(0), new StackReference(1) ]);

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
  // but we need to save the function to our context
  o.funcs[this.name] = this;
};

Func.prototype.compileBody = function (o) {
  //throw new Error('Called ' + this.name + ': non native functions not supported yet.');
  // save parameters as variables

  // Reference parameters to positions on stack
  this.params.forEach(function (param, i) {
    o.vars[param.name] = new StackReference(o.stack.length - 1 - i);
  });

  this.eachChild(function (statement) {
    statement.compile(o);
  });

  // TODO: variables referencing parameters should be deleted from context
};

function NativeFunc (name, opcode, arglen, returns) {
  this.name = name;
  this.opcode = opcode;
  this.arglen = arglen || 0;
  this.returns = returns || false;
}

inherits(NativeFunc, Func);

NativeFunc.prototype.compileBody = function (o) {
  o.script.push(this.opcode);

  // Update stack status
  for (var i = 0; i < this.arglen; i++) {
    o.stack.pop();
  }
  if (this.returns) {
    o.stack.push(this.opcode + ' return value');
  }
};

/**
 * Nop
 *
 * Compiles to nothing
 */
function Nop (name) { this.name = name; }
inherits(Nop, Base);
Nop.prototype.compileNode = function (o) {
  o.script.push(this.name);
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
  this.args = args || [];
}

inherits(Invocation, Base);

Invocation.prototype.compileNode = function (o) {
  var func = o.funcs[this.name];
  if (!func) {
    throw new CompileError('Called unknown function ' + this.name);
  }

  // Push arguments on stack.
  // TODO: Optimize!
  this.args.forEach(function (arg) {
    arg.compileNode(o);
  });

  func.compileBody(o);
};

function StackReference (i) {
  this.i = i;
}

inherits(StackReference, Base);

StackReference.prototype.compileNode = function (o) {
  // Make sure reference exists and is on top of stack
  // Otherwise... compile operations to attemps to move the
  // Reference at the right place?
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

Literal.prototype.compileNode = function (o) {
  o.stack.push(this.val);
  o.script.push(this.val);
};

/**
 * Variable
 *
 * Variable
 */
function Variable (name) {
  this.name = name;
}

inherits(Variable, Base);

Variable.prototype.compileNode = function (o) {
  var val = o.vars[this.name];

  if (typeof val === 'undefined') {
    debug('%j', o);
    throw new Error('Unknown variable ' + this.name + '.');
  }

  val.compileNode(o);
};

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
  o.vars[this.variable.name] = this.assignable;
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
