const test = require('tape')
const filterAndValidateClassificationValues = require('../../../lib/calculate-class-breaks/filter-and-validate-classification-features')

test('filterAndValidateClassificationValues: invalid std dev interval', spec => {
  const features = [
    { properties: { rain: 0.1 } },
    { properties: { rain: '0.1' } },
    { properties: { rain: 0 } },
    { properties: { } }
  ]
  const result = filterAndValidateClassificationValues(features, 'rain')
  spec.deepEquals(result, [5.866775, 16.133225])
  spec.end()
})
