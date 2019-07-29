# babel-plugin-react-attr-replacement

This plugin transforms a duplicate a attribute in React components. By defaut the duplicated attribute is 'dataTest' and the new attribute with the same value 'data-test'

## Example

**In**

```js
class ComponentOne extends React.Component {
  render() {
    return <div dataTest="ComponentOne" value="MyValue" />
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

const ComponentThree = () => <div dataTest="ComponentTree" />
```

**Out**

```js
class ComponentOne extends React.Component {
  render() {
    return (
      <div data-test="ComponentOne" dataTest="ComponentOne" value="MyValue" />
    )
  }
}

function ComponentTwo() {
  return someCondition ? (
    <div data-test="ComponentTwo" dataTest="ComponentTwo">
      <div />
    </div>
  ) : (
    <ComponentOne />
  )
}

const ComponentThree = () => (
  <div dataTest="ComponentThree" data-test="ComponentThree" />
)
```

## Installation

```sh
# yarn
yarn add --dev babel-plugin-react-attr-replacement

# npm
npm install --save-dev babel-plugin-react-attr-replacement
```

## Usage

### Via `.babelrc` (Recommended)

**.babelrc**

```json
{
  "plugins": ["react-component-data-attribute"]
}
```

With

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

## Configuring attributing names

You can also choose the attribute name for the duplication

**.babelrc**

```json
{
  "plugins": [
    "react-component-data-attribute",
    {
      "attributeName": "data-info",
      "replaceAttributeName": "myDataInfo"
    }
  ]
}
```

**In**

```js
class ComponentOne extends React.Component {
  render() {
    return <div myDataInfo="ComponentOne" value="MyValue" />
  }
}

function ComponentTwo() {
  return someCondition ? (
    <div myDataInfo="ComponentTwo">
      <div />
    </div>
  ) : (
    <ComponentOne />
  )
}

const ComponentThree = () => <div dataTests="ComponentOne" />
```

**Out**

```js
class ComponentOne extends React.Component {
  render() {
    return (
      <div data-info="ComponentOne" myDataInfo="ComponentOne" value="MyValue" />
    )
  }
}

function ComponentTwo() {
  return someCondition ? (
    <div data-info="ComponentTwo" myDataInfo="ComponentTwo">
      <div />
    </div>
  ) : (
    <ComponentOne />
  )
}

const ComponentThree = () => <div dataTests="ComponentThree" />
```
