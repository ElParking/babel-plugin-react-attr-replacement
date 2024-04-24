
import { extname, basename, dirname } from 'path'

const COMPONENT_ATTRIBUTE_NAME = 'dataTest'
const COMPONENT_ATTRIBUTE_REPLACEMENT_NAME = 'data-test'

export const DEFAULT_PROPS = {
  attributeName: COMPONENT_ATTRIBUTE_NAME,
  replaceAttributeName: COMPONENT_ATTRIBUTE_REPLACEMENT_NAME,
}

export function getReplaceOptions({ opts }) {
  if (!opts.replaceAttributeName) {
    return {
      ...DEFAULT_PROPS,
    }
  }

  if (!opts.attributeName) {
    return
  }

  if (opts.attributeName === opts.replaceAttributeName) {
    return
  }

  return opts
}

export default function babelPluginReactDataTestCamelcaseComponent({ types }) {
  function replaceAttribute(path, opts) {
    const { attributeName, replaceAttributeName } = opts
    if (!replaceAttributeName) {
      return
    }
    const openingElement = path.get('openingElement')
    const { node } = openingElement
    const hasDataAttribute = node.attributes.some((attribute) =>
      types.isJSXIdentifier(attribute.name, { name: replaceAttributeName })
    )

    if (!hasDataAttribute) {
      node.attributes.forEach((attr) => {
        if (attr.name && attr.name.name === attributeName) {
          node.attributes.push(
            Object.assign({}, attr, {
              name: Object.assign({}, attr.name, {
                name: replaceAttributeName,
              }),
            })
          )
        }
      })
    }

    path
      .get('children')
      .filter((child) => child.type === 'JSXElement')
      .forEach((child) => replaceAttribute(child, opts))
  }

  function fileDetails({ opts: { filename } }) {
    if (filename === 'unknown' || filename == null) {
      return null
    }
    return {
      directory: basename(dirname(filename)),
      name: basename(filename, extname(filename)),
    }
  }

  function isExported(path, name) {
    if (
      path.parentPath.isExportDefaultDeclaration() ||
      path.parentPath.isExportNamedDeclaration()
    ) {
      return true
    }

    const binding = path.scope.getBinding(name)

    return binding
      ? binding.referencePaths.some((referencePath) =>
          referencePath
            .getAncestry()
            .some(
              (ancestorPath) =>
                ancestorPath.isExportDefaultDeclaration() ||
                ancestorPath.isExportSpecifier() ||
                ancestorPath.isExportNamedDeclaration()
            )
        )
      : false
  }

  function evaluatePotentialComponent(path, state) {
    const name = nameForReactComponent(path, state.file)
    const process =
      name != null && shouldProcessPotentialComponent(path, name, state)
    return {
      name: name || '',
      process,
    }
  }

  function shouldProcessPotentialComponent(path, name, state) {
    const { onlyRootComponents = false } = state.opts || {}
    if (!onlyRootComponents) {
      return true
    }

    const details = fileDetails(state.file)
    if (details == null) {
      return false
    }
    if (details.name !== 'index' && details.name !== details.directory) {
      return false
    }

    return isExported(path, name)
  }

  function nameForReactComponent(path, file) {
    const {
      parentPath,
      node: { id },
    } = path

    if (types.isIdentifier(id)) {
      return id.name
    }

    if (parentPath.isVariableDeclarator()) {
      return parentPath.node.id.name
    }

    const details = fileDetails(file)
    if (details == null) {
      return details
    }

    return details.name === 'index' ? details.directory : details.name
  }

  const returnStatementVisitor = {
    JSXElement(path, { opts }) {
      // We never want to go into a tree of JSX elements, only ever process the top-level item
      path.skip()
      replaceAttribute(path, opts)
    },
  }

  const functionVisitor = {
    ReturnStatement(path, { opts }) {
      const arg = path.get('argument')
      if (arg.isIdentifier()) {
        const binding = path.scope.getBinding(arg.node.name)
        if (binding == null) {
          return
        }
        binding.path.traverse(returnStatementVisitor, { opts })
      } else {
        path.traverse(returnStatementVisitor, { opts })
      }
    },
  }

  const programVisitor = {
    'ClassDeclaration|ClassExpression': (path, state) => {
      const { process } = evaluatePotentialComponent(path, state)
      if (!process) {
        return
      }

      path
        .get('body.body')
        .filter((bodyPath) => {
          const { key } = bodyPath.node
          return (
            bodyPath.isClassMethod() && types.isIdentifier(key) && !key.computed
          )
        })
        .forEach((renderPath) => {
          renderPath.traverse(functionVisitor, {
            opts: getReplaceOptions(state),
          })
        })
    },
    'FunctionDeclaration|FunctionExpression|ArrowFunctionExpression': (
      path,
      state
    ) => {
      const { process } = evaluatePotentialComponent(path, state)
      if (!process) {
        return
      }

      if (
        path.isArrowFunctionExpression() &&
        !path.get('body').isBlockStatement()
      ) {
        path.traverse(returnStatementVisitor, {
          source: path,
          opts: getReplaceOptions(state),
        })
      } else {
        path.traverse(functionVisitor, {
          source: path,
          opts: getReplaceOptions(state),
        })
      }
    },
  }

  return {
    name: 'babel-plugin-react-component-data-attribute',
    visitor: {
      Program(path, state) {
        path.traverse(programVisitor, state)
      },
    },
  }
}
