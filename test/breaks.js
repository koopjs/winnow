'use strict'
const _ = require('lodash')
const test = require('tape')
const winnow = require('../src')
const trees = require('./fixtures/trees.json')
const classBreaks = require('./fixtures/breaks/classBreaks.json')
const uniqueValue = require('./fixtures/breaks/uniqueValue.json')

test('create class breaks', t => {
  t.plan(5)
  const options = _.cloneDeep(classBreaks)
  const results = winnow.query(trees, options)
  t.equal(Array.isArray(results), true)
  t.equal(Array.isArray(results[0]), true)
  t.equal(results.length, 5)
  t.deepEqual(results[0], [0, 2.8])
  t.deepEqual(results[4], [11.3, 14])
  t.end()
})

test('create class breaks without where clause', t => {
  t.plan(5)
  const options = _.cloneDeep(classBreaks)
  delete options.where
  const results = winnow.query(trees, options)
  t.equal(Array.isArray(results), true)
  t.equal(Array.isArray(results[0]), true)
  t.equal(results.length, 5)
  t.deepEqual(results[0], [0, 26])
  t.deepEqual(results[4], [105, 130])
  t.end()
})

test('change class break count', t => {
  t.plan(5)
  const options = _.cloneDeep(classBreaks)
  options.classificationDef.breakCount = 9
  const results = winnow.query(trees, options)
  t.equal(Array.isArray(results), true)
  t.equal(Array.isArray(results[0]), true)
  t.equal(results.length, 9)
  t.deepEqual(results[0], [0, 1.5555555555555556])
  t.deepEqual(results[8], [12.444444444444446, 14])
  t.end()
})

test('change classification field', t => {
  t.plan(5)
  const options = _.cloneDeep(classBreaks)
  options.classificationDef.classificationField = 'House_Number'
  const results = winnow.query(trees, options)
  t.equal(Array.isArray(results), true)
  t.equal(Array.isArray(results[0]), true)
  t.equal(results.length, 5)
  t.deepEqual(results[0], [1, 910.8])
  t.deepEqual(results[4], [3640.3, 4550])
  t.end()
})

test('classify using natural breaks', t => {
  t.plan(5)
  const options = _.cloneDeep(classBreaks)
  options.classificationDef.classificationMethod = 'esriClassifyNaturalBreaks'
  const results = winnow.query(trees, options)
  t.equal(Array.isArray(results), true)
  t.equal(Array.isArray(results[0]), true)
  t.equal(results.length, 5)
  t.deepEqual(results[0], [0, 1])
  t.deepEqual(results[4], [11, 14])
})

test('classify using quantile', t => {
  t.plan(5)
  const options = _.cloneDeep(classBreaks)
  options.classificationDef.classificationMethod = 'esriClassifyQuantile'
  const results = winnow.query(trees, options)
  t.equal(Array.isArray(results), true)
  t.equal(Array.isArray(results[0]), true)
  t.equal(results.length, 5)
  t.deepEqual(results[0], [0, 0])
  t.deepEqual(results[4], [11, 14])
})

test('normalize by field', t => {
  t.plan(5)
  const options = _.cloneDeep(classBreaks)
  options.classificationDef.classificationField = 'House_Number'
  options.classificationDef.normalizationType = 'esriNormalizeByField'
  options.classificationDef.normalizationField = 'Trunk_Diameter'
  const results = winnow.query(trees, options)
  t.equal(Array.isArray(results), true)
  t.equal(Array.isArray(results[0]), true)
  t.equal(results.length, 5)
  t.deepEqual(results[0], [0.07142857142857142, 910.0571428571428])
  t.deepEqual(results[4], [3640.0142857142855, 4550])
})

test('normalize by log', t => {
  t.plan(5)
  const options = _.cloneDeep(classBreaks)
  options.classificationDef.normalizationType = 'esriNormalizeByLog'
  const results = winnow.query(trees, options)
  t.equal(Array.isArray(results), true)
  t.equal(Array.isArray(results[0]), true)
  t.equal(results.length, 5)
  t.deepEqual(results[0], [0, 0.2292256071356476])
  t.deepEqual(results[4], [0.9169024285425906, 1.146128035678238])
})

test('normalize by total', t => {
  t.plan(5)
  const options = _.cloneDeep(classBreaks)
  options.classificationDef.normalizationType = 'esriNormalizeByPercentOfTotal'
  const results = winnow.query(trees, options)
  t.equal(Array.isArray(results), true)
  t.equal(Array.isArray(results[0]), true)
  t.equal(results.length, 5)
  t.deepEqual(results[0], [0, 0.0013272469579973742])
  t.deepEqual(results[4], [0.005308987831989498, 0.006636234789986871])
})

test('unacceptable classificationField', t => {
  t.plan(1)
  const options = _.cloneDeep(classBreaks)
  options.classificationDef.classificationField = 'Common_Name'
  t.throws(function () { winnow.query(trees, options) })
})

test('unacceptable classificationMethod', t => {
  t.plan(1)
  const options = _.cloneDeep(classBreaks)
  options.classificationDef.classificationMethod = 'invalidMethod'
  t.throws(function () { winnow.query(trees, options) })
})

test('create unique values', t => {
  t.plan(5)
  const options = _.cloneDeep(uniqueValue)
  const results = winnow.query(trees, options)
  t.equal(Array.isArray(results), true)
  t.equal(typeof results === 'object', true)
  t.equal(results.length, 156)
  t.deepEqual(results[0], { Genus: 'MAGNOLIA', count: 3778 })
  t.deepEqual(results[155], { Genus: 'Thevetia', count: 1 })
  t.end()
})

test('add unique values', t => {
  t.plan(6)
  const options = _.cloneDeep(uniqueValue)
  const ammendedtrees = _.cloneDeep(trees)
  ammendedtrees.features.push({
    'type': 'Feature',
    'properties': {
      'OBJECTID': 99998,
      'Common_Name': 'SOUTHERN MAGNOLIA',
      'Genus': 'MAGNOLIA',
      'Trunk_Diameter': 10
    }
  }, {
    'type': 'Feature',
    'properties': {
      'OBJECTID': 99999,
      'Common_Name': 'SOUTHERN NEW_GENUS',
      'Genus': 'NEW_GENUS',
      'Trunk_Diameter': 11
    }
  })
  const results = winnow.query(ammendedtrees, options)
  t.equal(Array.isArray(results), true)
  t.equal(typeof results === 'object', true)
  t.equal(results.length, 157)
  t.deepEqual(results[0], { Genus: 'MAGNOLIA', count: 3779 })
  t.deepEqual(results[155], { Genus: 'Thevetia', count: 1 })
  t.deepEqual(results[156], { Genus: 'NEW_GENUS', count: 1 })
  t.end()
})

test('change unique value field', t => {
  t.plan(5)
  const options = _.cloneDeep(uniqueValue)
  options.classificationDef.uniqueValueFields[0] = 'Common_Name'
  const results = winnow.query(trees, options)
  t.equal(Array.isArray(results), true)
  t.equal(typeof results === 'object', true)
  t.equal(results.length, 281)
  t.deepEqual(results[0], { Common_Name: 'SOUTHERN MAGNOLIA', count: 3722 })
  t.deepEqual(results[280], { Common_Name: 'ZADD 10', count: 1 })
  t.end()
})
// TODO: add multiple field functionality & tests + fieldDelimiter test
