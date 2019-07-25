'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = babelPluginReactDataTestCamelcaseComponent;

var _path = require('path');

var COMPONENT_ATTRIBUTE = 'dataTest';
var DATA_ATTRIBUTE = 'data-test';

function babelPluginReactDataTestCamelcaseComponent(_ref) {
  var t = _ref.types;

  function fileDetails(_ref2) {
    var filename = _ref2.opts.filename;

    if (filename === 'unknown' || filename == null) {
      return null;
    }
    return {
      directory: (0, _path.basename)((0, _path.dirname)(filename)),
      name: (0, _path.basename)(filename, (0, _path.extname)(filename))
    };
  }

  function isExported(path, name) {
    if (path.parentPath.isExportDefaultDeclaration() || path.parentPath.isExportNamedDeclaration()) {
      return true;
    }

    var binding = path.scope.getBinding(name);

    return binding ? binding.referencePaths.some(function (referencePath) {
      return referencePath.getAncestry().some(function (ancestorPath) {
        return ancestorPath.isExportDefaultDeclaration() || ancestorPath.isExportSpecifier() || ancestorPath.isExportNamedDeclaration();
      });
    }) : false;
  }

  function evaluatePotentialComponent(path, state) {
    var name = nameForReactComponent(path, state.file);
    var overrides = name && getoverrides(name, state.opts.overrides);

    var process = void 0;

    if (overrides != null && overrides.process != null) {
      process = overrides.process;
    } else {
      process = name != null && shouldProcessPotentialComponent(path, name, state);
    }

    return {
      name: overrides && overrides.name || name || '',
      process: process,
      overrides: overrides
    };
  }

  function shouldProcessPotentialComponent(path, name, state) {
    if (!path.getFunctionParent().isProgram()) {
      return false;
    }
    if (path.parentPath.isAssignmentExpression()) {
      return false;
    }

    var _ref3 = state.opts || {},
        _ref3$onlyRootCompone = _ref3.onlyRootComponents,
        onlyRootComponents = _ref3$onlyRootCompone === undefined ? false : _ref3$onlyRootCompone;

    if (!onlyRootComponents) {
      return true;
    }

    var details = fileDetails(state.file);
    if (details == null) {
      return false;
    }
    if (details.name !== 'index' && details.name !== details.directory) {
      return false;
    }

    return isExported(path, name);
  }

  function nameForReactComponent(path, file) {
    var parentPath = path.parentPath,
        id = path.node.id;


    if (t.isIdentifier(id)) {
      return id.name;
    }

    if (parentPath.isVariableDeclarator()) {
      return parentPath.node.id.name;
    }

    var details = fileDetails(file);
    if (details == null) {
      return details;
    }

    return details.name === 'index' ? details.directory : details.name;
  }

  var returnStatementVisitor = {
    JSXElement: function JSXElement(path) {
      var openingElement = path.get('openingElement');
      var node = openingElement.node;

      // We never want to go into a tree of JSX elements, only ever process the top-level item

      path.skip();

      var hasDataAttribute = node.attributes.some(function (attribute) {
        return t.isJSXIdentifier(attribute.name, { name: DATA_ATTRIBUTE });
      });

      if (hasDataAttribute) {
        return;
      }

      node.attributes.forEach(function (attr) {
        if (attr.name && attr.name.name === COMPONENT_ATTRIBUTE) {
          node.attributes.push(Object.assign({}, attr, {
            name: Object.assign({}, attr.name, {
              name: DATA_ATTRIBUTE
            })
          }));
        }
      });
    }
  };

  var functionVisitor = {
    ReturnStatement: function ReturnStatement(path) {
      var arg = path.get('argument');

      if (arg.isIdentifier()) {
        var binding = path.scope.getBinding(arg.node.name);
        if (binding == null) {
          return;
        }
        binding.path.traverse(returnStatementVisitor);
      } else {
        path.traverse(returnStatementVisitor);
      }
    }
  };

  var programVisitor = {
    'ClassDeclaration|ClassExpression': function ClassDeclarationClassExpression(path, state) {
      var _evaluatePotentialCom = evaluatePotentialComponent(path, state),
          process = _evaluatePotentialCom.process;

      if (!process) {
        return;
      }

      path.get('body.body').filter(function (bodyPath) {
        var key = bodyPath.node.key;

        return bodyPath.isClassMethod() && t.isIdentifier(key) && !key.computed;
      }).forEach(function (renderPath) {
        renderPath.traverse(functionVisitor);
      });
    },
    'FunctionDeclaration|FunctionExpression|ArrowFunctionExpression': function FunctionDeclarationFunctionExpressionArrowFunctionExpression(path, state) {
      var _evaluatePotentialCom2 = evaluatePotentialComponent(path, state),
          name = _evaluatePotentialCom2.name,
          process = _evaluatePotentialCom2.process,
          overrides = _evaluatePotentialCom2.overrides;

      if (!process) {
        return;
      }

      if (path.isArrowFunctionExpression() && !path.get('body').isBlockStatement()) {
        path.traverse(returnStatementVisitor, { name: name, source: path, overrides: overrides });
      } else {
        path.traverse(functionVisitor, { name: name, source: path, overrides: overrides });
      }
    }
  };

  return {
    name: 'babel-plugin-react-component-data-attribute',
    visitor: {
      Program: function Program(path, state) {
        path.traverse(programVisitor, state);
      }
    }
  };
}

function getoverrides(component) {
  var overrides = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var overide = overrides.hasOwnProperty(component) ? overrides[component] : {};
  return {
    name: overide.name || component,
    process: overide.process
  };
}