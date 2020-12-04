const test = require('tape')
const { calculateUniqueValueBreaks } = require('../../../lib/generate-breaks/index')

test('calculateUniqueValueBreaks, too many fields', t => {
  t.plan(1)
  const features = [
    { properties: { Name: 'Oak', Trunk_Diameter: 13 } },
    { properties: { Name: 'Pine', Trunk_Diameter: 7 } },
    { properties: { Name: 'Oak', Trunk_Diameter: 17 } },
    { properties: { Name: 'Maple', Trunk_Diameter: 25 } },
    { properties: { Name: 'Maple', Trunk_Diameter: 3 } }
  ]
  const classification = {
    type: 'unique',
    fields: ['Name', 'Location', 'Foo', 'Bar']
  }

  try {
    calculateUniqueValueBreaks(features, classification)
    t.fail('should have thrown')
  } catch (error) {
    t.equals(error.message, 'Cannot classify using more than three fields')
  }
})

test('calculateUniqueValueBreaks, unknown field', t => {
  t.plan(1)
  const features = [
    { properties: { Name: 'Oak', Trunk_Diameter: 13 } },
    { properties: { Name: 'Pine', Trunk_Diameter: 7 } },
    { properties: { Name: 'Oak', Trunk_Diameter: 17 } },
    { properties: { Name: 'Maple', Trunk_Diameter: 25 } },
    { properties: { Name: 'Maple', Trunk_Diameter: 3 } }
  ]
  const classification = {
    type: 'unique',
    fields: ['Name', 'Location', 'Foo']
  }

  try {
    calculateUniqueValueBreaks(features, classification)
    t.fail('should have thrown')
  } catch (error) {
    t.equals(error.message, 'Unknown field: Location')
  }
})

test('calculateUniqueValueBreaks, one field', t => {
  t.plan(1)
  const features = [
    { properties: { Name: 'Oak', Trunk_Diameter: 13 } },
    { properties: { Name: 'Pine', Trunk_Diameter: 7 } },
    { properties: { Name: 'Oak', Trunk_Diameter: 17 } },
    { properties: { Name: 'Maple', Trunk_Diameter: 25 } },
    { properties: { Name: 'Maple', Trunk_Diameter: 3 } }
  ]
  const classification = {
    type: 'unique',
    fields: ['Name']
  }

  const result = calculateUniqueValueBreaks(features, classification)
  t.deepEquals(result, {
    options: {
      aggregates: [{ type: 'count', field: 'Name', name: 'count' }],
      groupBy: ['Name'],
      collection: undefined,
      idField: null,
      where: undefined,
      geometry: undefined,
      spatialPredicate: undefined,
      fields: undefined,
      order: undefined,
      limit: undefined,
      outputCrs: { wkid: 4326 },
      inputCrs: { wkid: 4326 },
      classification: undefined,
      offset: undefined,
      dateFields: []
    },
    query: 'SELECT COUNT(properties->`Name`) as `count`,  properties->`Name` as `Name` FROM ?  GROUP BY properties->`Name`'
  })
})

test('calculateUniqueValueBreaks, two fields', t => {
  t.plan(1)
  const features = [
    { properties: { Name: 'Oak', Location: 'Mill St', Trunk_Diameter: 13 } },
    { properties: { Name: 'Pine', Location: 'Mill St', Trunk_Diameter: 7 } },
    { properties: { Name: 'Oak', Location: 'Mill St', Trunk_Diameter: 17 } },
    { properties: { Name: 'Maple', Location: 'Wilson St', Trunk_Diameter: 25 } },
    { properties: { Name: 'Maple', Location: 'Wilson St', Trunk_Diameter: 3 } }
  ]
  const classification = {
    type: 'unique',
    fields: ['Name', 'Location']
  }

  const result = calculateUniqueValueBreaks(features, classification)
  t.deepEquals(result, {
    options: {
      aggregates: [{ type: 'count', field: 'Name', name: 'count' }],
      groupBy: ['Name', 'Location'],
      collection: undefined,
      idField: null,
      where: undefined,
      geometry: undefined,
      spatialPredicate: undefined,
      fields: undefined,
      order: undefined,
      limit: undefined,
      outputCrs: { wkid: 4326 },
      inputCrs: { wkid: 4326 },
      classification: undefined,
      offset: undefined,
      dateFields: []
    },
    query: 'SELECT COUNT(properties->`Name`) as `count`,  properties->`Name` as `Name`, properties->`Location` as `Location` FROM ?  GROUP BY properties->`Name`, properties->`Location`'
  })
})
