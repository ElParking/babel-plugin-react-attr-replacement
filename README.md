# babel-plugin-react-data-test-camelcase

This plugin transforms a `dataTest` attribute to a 'data-test' attribute in React components.

## Example

**In**

```js
class ComponentOne extends React.Component {
  render() {
    return <div dataTest="ComponentOne" />
  }
}

function ComponentTwo() {
  return someCondition ? (
    <div dataTest="ComponentTwo">
      <div />
    </div>
  ) : (
    <ComponentOne />
  )
}

const ComponentThree = () => <div dataTest="ComponentOne" />
```

**Out**

```js
class ComponentOne extends React.Component {
  render() {
    return <div data-test="ComponentOne" />
  }
}

function ComponentTwo() {
  return someCondition ? (
    <div data-test="ComponentTwo">
      <div />
    </div>
  ) : (
    <ComponentOne />
  )
}

const ComponentThree = () => <div data-test="ComponentThree" />
```

## Installation

```sh
# yarn
yarn add --dev babel-plugin-react-data-test-camelcase

# npm
npm install --save-dev babel-plugin-react-data-test-camelcase
```

## Usage

### Via `.babelrc` (Recommended)

**.babelrc**

```json
{
  "plugins": ["react-component-data-attribute"]
}
```

### Via CLI

```sh
babel --plugins react-component-data-attribute script.js
```

### Via Node API

```js
require('babel-core').transform('code', {
  plugins: ['react-component-data-attribute'],
})
```
