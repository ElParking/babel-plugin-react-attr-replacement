'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DEFAULT_PROPS = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.getReplaceOptions = getReplaceOptions;
exports.default = babelPluginReactDataTestCamelcaseComponent;

var _path = require('path');

var COMPONENT_ATTRIBUTE_NAME = 'dataTest';
var COMPONENT_ATTRIBUTE_REPLACEMENT_NAME = 'data-test';

var DEFAULT_PROPS = exports.DEFAULT_PROPS = {
  attributeName: COMPONENT_ATTRIBUTE_NAME,
  replaceAttributeName: COMPONENT_ATTRIBUTE_REPLACEMENT_NAME
};

function getReplaceOptions(_ref) {
  var opts = _ref.opts;

  if (!opts.replaceAttributeName) {
    return _extends({}, DEFAULT_PROPS);
  }

  if (!opts.attributeName) {
    return;
  }

  if (opts.attributeName === opts.replaceAttributeName) {
    return;
  }

  return opts;
}

function babelPluginReactDataTestCamelcaseComponent(_ref2) {
  var types = _ref2.types;

  function replaceAttribute(path, _ref3) {
    var attributeName = _ref3.attributeName,
        replaceAttributeName = _ref3.replaceAttributeName;

    if (!replaceAttributeName) {
      return;
    }
    var openingElement = path.get('openingElement');
    var node = openingElement.node;

    var hasDataAttribute = node.attributes.some(function (attribute) {
      return types.isJSXIdentifier(attribute.name, { name: replaceAttributeName });
    });

    if (!hasDataAttribute) {
      node.attributes.forEach(function (attr) {
        if (attr.name && attr.name.name === attributeName) {
          node.attributes.push(Object.assign({}, attr, {
            name: Object.assign({}, attr.name, {
              name: replaceAttributeName
            })
          }));
        }
      });
    }

    path.get('children').filter(function (child) {
      return child.type === 'JSXElement';
    }).forEach(replaceAttribute);
  }

  function fileDetails(_ref4) {
    var filename = _ref4.opts.filename;

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
    var process = name != null && shouldProcessPotentialComponent(path, name, state);
    return {
      name: name || '',
      process: process
    };
  }

  function shouldProcessPotentialComponent(path, name, state) {
    var _ref5 = state.opts || {},
        _ref5$onlyRootCompone = _ref5.onlyRootComponents,
        onlyRootComponents = _ref5$onlyRootCompone === undefined ? false : _ref5$onlyRootCompone;

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


    if (types.isIdentifier(id)) {
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
    JSXElement: function JSXElement(path, _ref6) {
      var opts = _ref6.opts;

      // We never want to go into a tree of JSX elements, only ever process the top-level item
      path.skip();
      replaceAttribute(path, opts);
    }
  };

  var functionVisitor = {
    ReturnStatement: function ReturnStatement(path, _ref7) {
      var opts = _ref7.opts;

      var arg = path.get('argument');
      if (arg.isIdentifier()) {
        var binding = path.scope.getBinding(arg.node.name);
        if (binding == null) {
          return;
        }
        binding.path.traverse(returnStatementVisitor, { opts: opts });
      } else {
        path.traverse(returnStatementVisitor, { opts: opts });
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

        return bodyPath.isClassMethod() && types.isIdentifier(key) && !key.computed;
      }).forEach(function (renderPath) {
        renderPath.traverse(functionVisitor, {
          opts: getReplaceOptions(state)
        });
      });
    },
    'FunctionDeclaration|FunctionExpression|ArrowFunctionExpression': function FunctionDeclarationFunctionExpressionArrowFunctionExpression(path, state) {
      var _evaluatePotentialCom2 = evaluatePotentialComponent(path, state),
          process = _evaluatePotentialCom2.process;

      if (!process) {
        return;
      }

      if (path.isArrowFunctionExpression() && !path.get('body').isBlockStatement()) {
        path.traverse(returnStatementVisitor, {
          source: path,
          opts: getReplaceOptions(state)
        });
      } else {
        path.traverse(functionVisitor, {
          source: path,
          opts: getReplaceOptions(state)
        });
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