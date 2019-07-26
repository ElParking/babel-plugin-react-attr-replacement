import { extname, basename, dirname } from 'path'

const COMPONENT_ATTRIBUTE = 'dataTest'
const DATA_ATTRIBUTE = 'data-test'

export default function babelPluginReactDataTestCamelcaseComponent({
  types: t,
}) {
  function replaceAttribute(path) {
    const openingElement = path.get('openingElement')
    const { node } = openingElement

    const hasDataAttribute = node.attributes.some((attribute) =>
      t.isJSXIdentifier(attribute.name, { name: DATA_ATTRIBUTE })
    )

    if (!hasDataAttribute) {
      node.attributes.forEach((attr) => {
        if (attr.name && attr.name.name === COMPONENT_ATTRIBUTE) {
          node.attributes.push(
            Object.assign({}, attr, {
              name: Object.assign({}, attr.name, { name: DATA_ATTRIBUTE }),
            })
          )
        }
      })
    }

    path
      .get('children')
      .filter((child) => child.type === 'JSXElement')
      .forEach(replaceAttribute)
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
    const overrides = name && getoverrides(name, state.opts.overrides)

    let process

    if (overrides != null && overrides.process != null) {
      process = overrides.process
    } else {
      process =
        name != null && shouldProcessPotentialComponent(path, name, state)
    }

    return {
      name: (overrides && overrides.name) || name || '',
      process,
      overrides,
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

    if (t.isIdentifier(id)) {
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
    JSXElement(path) {
      // We never want to go into a tree of JSX elements, only ever process the top-level item
      path.skip()
      replaceAttribute(path)
    },
  }

  const functionVisitor = {
    ReturnStatement(path) {
      const arg = path.get('argument')

      if (arg.isIdentifier()) {
        const binding = path.scope.getBinding(arg.node.name)
        if (binding == null) {
          return
        }
        binding.path.traverse(returnStatementVisitor)
      } else {
        path.traverse(returnStatementVisitor)
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
            bodyPath.isClassMethod() && t.isIdentifier(key) && !key.computed
          )
        })
        .forEach((renderPath) => {
          renderPath.traverse(functionVisitor)
        })
    },
    'FunctionDeclaration|FunctionExpression|ArrowFunctionExpression': (
      path,
      state
    ) => {
      const { process, overrides } = evaluatePotentialComponent(path, state)
      if (!process) {
        return
      }

      if (
        path.isArrowFunctionExpression() &&
        !path.get('body').isBlockStatement()
      ) {
        path.traverse(returnStatementVisitor, { source: path, overrides })
      } else {
        path.traverse(functionVisitor, { source: path, overrides })
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

function getoverrides(component, overrides = {}) {
  const overide = overrides.hasOwnProperty(component)
    ? overrides[component]
    : {}
  return {
    name: overide.name || component,
    process: overide.process,
  }
}
