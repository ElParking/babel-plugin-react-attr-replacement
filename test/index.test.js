import * as babel from 'babel-core'
import babelPluginReactDataTestCamelcaseComponent from '../src'

describe('babelPluginReactDataTestCamelcaseComponent()', () => {
  it('handles a data-test explicit definition', () => {
    expect(
      transform(`
      function MyComponent() {
        return <div key='uno' data-test='id-test-2' data-info='my data info'/>;
      }
    `)
    ).toMatchSnapshot()
  })

  it('handles simple returns', () => {
    expect(
      transform(`
      function MyComponent() {
        return <div dataTest="description-id" />;
      }
    `)
    ).toMatchSnapshot()
  })

  it('handles a conlfict', () => {
    expect(
      transform(`
      function MyComponent() {
        return <div data-test='id-test-1' dataTest="description-id" />;
      }
    `)
    ).toMatchSnapshot()
  })

  it('handles simple complex returns', () => {
    expect(
      transform(`
      function MyComponent() {
        const t = 'description-id'
        return <div dataTest={t} />;
      }
    `)
    ).toMatchSnapshot()
  })

  it('handles simple inline complex returns', () => {
    expect(
      transform(`
      function MyComponent() {
        const t = 1
        return <div dataTest={\`description-id-\${t}\`} />;
      }
    `)
    ).toMatchSnapshot()
  })

  it('does not add attributes to composite components', () => {
    expect(
      transform(`
      function MyComponent() {
        const t = 1
        return <SomeOtherComponent dataTest={\`description-id-\${t}\`}  />;
      }
    `)
    ).toMatchSnapshot()
  })

  it('adds the attribute to the first non-composite component', () => {
    expect(
      transform(`
      function MyComponent() {
        const t = 1
        return <SomeOtherComponent><div><div dataTest={\`description-id-\${t}\`} /></div></SomeOtherComponent>;
      }
    `)
    ).toMatchSnapshot()
  })

  it('handles a inline component', () => {
    expect(
      transform(`
      const MyComponent2 = () => {
        return <SomeOtherComponent dataTest={\`description-id-\${t}\`}></SomeOtherComponent>;
      }
    `)
    ).toMatchSnapshot()
  })

  it('handles a inline component without return', () => {
    expect(
      transform(`
      const MyComponent3 = () => <SomeOtherComponent dataTest={\`description-id-\${t}\`}></SomeOtherComponent>;
    `)
    ).toMatchSnapshot()
  })

  it('handle properly a class render methods', () => {
    expect(
      transform(`
      class MyComponent extends React.Component {
        renderAnotherThing() {
          return <div dataTest="id-info-AnotherThing" />;
        }
        render() {
          return <div dataTest="id-info">{ this.renderAnotherThing() }</div>;
        }
      }
    `)
    ).toMatchSnapshot()
  })

  it('handle properly passing attributes beetween class render methods', () => {
    expect(
      transform(`
      class MyComponent1 extends React.Component {
        render() {
          return <div dataTest={this.props.dataTest}>Info</div>;
        }
      }

      MyComponent1.propTypes = {
        dataTest: PropTypes.string
      };

      MyComponent1.defaultProps = {
        dataTest: PropTypes.string
      };

      class MyComponent2 extends React.Component {
        render() {
          return <MyComponent1 dataTest="id-info" />;
        }
      }
    `)
    ).toMatchSnapshot()
  })

  it('handle when bail early if we are in a different function than the component', () => {
    expect(
      transform(`
      
      class MyComponent2 extends React.Component {
        render() {
          return <MyComponent1 dataTest="id-info" />;
        }
      }
    `)
    ).toMatchSnapshot()
  })
})

function transform(code, pluginOptions, transformOptions) {
  return babel
    .transform(code, {
      babelrc: false,
      plugins: [[babelPluginReactDataTestCamelcaseComponent, pluginOptions]],
      parserOpts: {
        plugins: ['jsx'],
      },
      ...transformOptions,
    })
    .code.trim()
}
