/*global Symbol */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DEFAULT_PROPS = void 0;
exports["default"] = babelPluginReactDataTestCamelcaseComponent;
exports.getReplaceOptions = getReplaceOptions;
var _path = require("path");
// eslint-disable-next-line no-func-assign
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var COMPONENT_ATTRIBUTE_NAME = 'dataTest';
var COMPONENT_ATTRIBUTE_REPLACEMENT_NAME = 'data-test';
var DEFAULT_PROPS = exports.DEFAULT_PROPS = {
  attributeName: COMPONENT_ATTRIBUTE_NAME,
  replaceAttributeName: COMPONENT_ATTRIBUTE_REPLACEMENT_NAME
};
function getReplaceOptions(_ref) {
  var opts = _ref.opts;
  if (!opts.replaceAttributeName) {
    return _objectSpread({}, DEFAULT_PROPS);
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
  function replaceAttribute(path, opts) {
    var attributeName = opts.attributeName,
      replaceAttributeName = opts.replaceAttributeName;
    if (!replaceAttributeName) {
      return;
    }
    var openingElement = path.get('openingElement');
    var node = openingElement.node;
    var hasDataAttribute = node.attributes.some(function (attribute) {
      return types.isJSXIdentifier(attribute.name, {
        name: replaceAttributeName
      });
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
    }).forEach(function (child) {
      return replaceAttribute(child, opts);
    });
  }
  function fileDetails(_ref3) {
    var filename = _ref3.opts.filename;
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
    var _ref4 = state.opts || {},
      _ref4$onlyRootCompone = _ref4.onlyRootComponents,
      onlyRootComponents = _ref4$onlyRootCompone === void 0 ? false : _ref4$onlyRootCompone;
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
    JSXElement: function JSXElement(path, _ref5) {
      var opts = _ref5.opts;
      // We never want to go into a tree of JSX elements, only ever process the top-level item
      path.skip();
      replaceAttribute(path, opts);
    }
  };
  var functionVisitor = {
    ReturnStatement: function ReturnStatement(path, _ref6) {
      var opts = _ref6.opts;
      var arg = path.get('argument');
      if (arg.isIdentifier()) {
        var binding = path.scope.getBinding(arg.node.name);
        if (binding == null) {
          return;
        }
        binding.path.traverse(returnStatementVisitor, {
          opts: opts
        });
      } else {
        path.traverse(returnStatementVisitor, {
          opts: opts
        });
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