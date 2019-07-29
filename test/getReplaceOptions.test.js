import { getReplaceOptions, DEFAULT_PROPS } from '../src'

describe('getReplaceOptions()', () => {
  function testReplaceOptions(obj1, obj2) {
    expect(getReplaceOptions({ opts: obj1 }).toString()).toBe(obj2.toString())
  }

  it('work property by defaul', () => {
    testReplaceOptions({}, DEFAULT_PROPS)
  })

  it('work property only with specified attribute', () => {
    testReplaceOptions(
      {
        attributeName: 'myDataInfo',
        replaceAttributeName: 'data-info',
      },
      {
        attributeName: 'myDataInfo',
        replaceAttributeName: 'data-info',
      }
    )
  })

  it('work property only with error', () => {
    expect(
      getReplaceOptions({
        opts: {
          attributeName: 'dataInfo',
          replaceAttributeName: 'dataInfo',
        },
      })
    ).toBe(undefined)
  })
})
