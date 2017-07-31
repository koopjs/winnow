'use strict'
const _ = require('lodash')
const test = require('tape')
const winnow = require('../src')
const treesSubset = require('./fixtures/trees_subset.json')
const geoServicesClassBreaks = require('./fixtures/generateBreaks/geoServicesClassBreaks.json')
const geoServicesUniqueValue = require('./fixtures/generateBreaks/geoServicesUniqueValue.json')

test('create class breaks the esri way', t => {
  t.plan(5)
  const options = _.cloneDeep(geoServicesClassBreaks)
  const results = winnow.query(treesSubset, options)
  t.equal(Array.isArray(results), true)
  t.equal(Array.isArray(results[0]), true)
  t.equal(results.length, 5)
  t.deepEqual(results[0], [0, 2.6])
  t.deepEqual(results[4], [10.5, 13])
  t.end()
})

test('create class breaks without where clause', t => {
  t.plan(5)
  const options = _.cloneDeep(geoServicesClassBreaks)
  delete options.where
  const results = winnow.query(treesSubset, options)
  t.equal(Array.isArray(results), true)
  t.equal(Array.isArray(results[0]), true)
  t.equal(results.length, 5)
  t.deepEqual(results[0], [0, 5.4])
  t.deepEqual(results[4], [21.7, 27])
  t.end()
})

test('change class break count', t => {
  t.plan(5)
  const options = _.cloneDeep(geoServicesClassBreaks)
  options.classificationDef.breakCount = 9
  const results = winnow.query(treesSubset, options)
  t.equal(Array.isArray(results), true)
  t.equal(Array.isArray(results[0]), true)
  t.equal(results.length, 9)
  t.deepEqual(results[0], [0, 1.4444444444444444])
  t.deepEqual(results[8], [11.555555555555557, 13])
  t.end()
})

test('change classification field', t => {
  t.plan(5)
  const options = _.cloneDeep(geoServicesClassBreaks)
  options.classificationDef.classificationField = 'House_Number'
  const results = winnow.query(treesSubset, options)
  t.equal(Array.isArray(results), true)
  t.equal(Array.isArray(results[0]), true)
  t.equal(results.length, 5)
  t.deepEqual(results[0], [505, 842])
  t.deepEqual(results[4], [1854, 2190])
  t.end()
})

test('classify using natural breaks', t => {
  t.plan(5)
  const options = _.cloneDeep(geoServicesClassBreaks)
  options.classificationDef.classificationMethod = 'esriClassifyNaturalBreaks'
  const results = winnow.query(treesSubset, options)
  t.equal(Array.isArray(results), true)
  t.equal(Array.isArray(results[0]), true)
  t.equal(results.length, 5)
  t.deepEqual(results[0], [0, 1])
  t.deepEqual(results[4], [10, 13])
})

test('classify using quantile', t => {
  t.plan(5)
  const options = _.cloneDeep(geoServicesClassBreaks)
  options.classificationDef.classificationMethod = 'esriClassifyQuantile'
  const results = winnow.query(treesSubset, options)
  t.equal(Array.isArray(results), true)
  t.equal(Array.isArray(results[0]), true)
  t.equal(results.length, 5)
  t.deepEqual(results[0], [0, 1])
  t.deepEqual(results[4], [13, 13])
})

test('normalize by field', t => {
  t.plan(5)
  const options = _.cloneDeep(geoServicesClassBreaks)
  options.classificationDef.classificationField = 'House_Number'
  options.classificationDef.normalizationType = 'esriNormalizeByField'
  options.classificationDef.normalizationField = 'Trunk_Diameter'
  const results = winnow.query(treesSubset, options)
  t.equal(Array.isArray(results), true)
  t.equal(Array.isArray(results[0]), true)
  t.equal(results.length, 5)
  t.deepEqual(results[0], [38.84615384615385, 176.4102564102564])
  t.deepEqual(results[4], [589.1025641025642, 726.6666666666666])
})

test('normalize by log', t => {
  t.plan(5)
  const options = _.cloneDeep(geoServicesClassBreaks)
  options.classificationDef.normalizationType = 'esriNormalizeByLog'
  const results = winnow.query(treesSubset, options)
  t.equal(Array.isArray(results), true)
  t.equal(Array.isArray(results[0]), true)
  t.equal(results.length, 5)
  t.deepEqual(results[0], [0, 0.22278867046136736])
  t.deepEqual(results[4], [0.8911546818454695, 1.1139433523068367])
})

test('normalize by total', t => {
  t.plan(5)
  const options = _.cloneDeep(geoServicesClassBreaks)
  options.classificationDef.normalizationType = 'esriNormalizeByPercentOfTotal'
  const results = winnow.query(treesSubset, options)
  t.equal(Array.isArray(results), true)
  t.equal(Array.isArray(results[0]), true)
  t.equal(results.length, 5)
  t.deepEqual(results[0], [0, 2.452830188679245])
  t.deepEqual(results[4], [9.81132075471699, 12.264150943396226])
})

test('unacceptable classificationField', t => {
  t.plan(1)
  const options = _.cloneDeep(geoServicesClassBreaks)
  options.classificationDef.classificationField = 'Common_Name'
  t.throws(function () { winnow.query(treesSubset, options) })
})

test('unacceptable classificationMethod', t => {
  t.plan(1)
  const options = _.cloneDeep(geoServicesClassBreaks)
  options.classificationDef.classificationMethod = 'invalidMethod'
  t.throws(function () { winnow.query(treesSubset, options) })
})

test('create unique values', t => {
  t.plan(5)
  const options = _.cloneDeep(geoServicesUniqueValue)
  const results = winnow.query(treesSubset, options)
  t.equal(Array.isArray(results), true)
  t.equal(typeof results === 'object', true)
  t.equal(results.length, 6)
  t.deepEqual(results[0], { Genus: 'MAGNOLIA', count: 3 })
  t.deepEqual(results[5], { Genus: 'MELALEUCA', count: 1 })
  t.end()
})

test('add unique values', t => {
  t.plan(6)
  const options = _.cloneDeep(geoServicesUniqueValue)
  const ammendedtrees = _.cloneDeep(treesSubset)
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
  t.equal(results.length, 7)
  t.deepEqual(results[0], { Genus: 'MAGNOLIA', count: 4 })
  t.deepEqual(results[5], { Genus: 'MELALEUCA', count: 1 })
  t.deepEqual(results[6], { Genus: 'NEW_GENUS', count: 1 })
  t.end()
})

test('change unique value field', t => {
  t.plan(5)
  const options = _.cloneDeep(geoServicesUniqueValue)
  options.classificationDef.uniqueValueFields[0] = 'Common_Name'
  const results = winnow.query(treesSubset, options)
  t.equal(Array.isArray(results), true)
  t.equal(typeof results === 'object', true)
  t.equal(results.length, 7)
  t.deepEqual(results[0], { Common_Name: 'SOUTHERN MAGNOLIA', count: 3 })
  t.deepEqual(results[6], { Common_Name: 'FLAX-LEAF PAPERBARK', count: 1 })
  t.end()
})
// TODO: add multiple field functionality & tests + fieldDelimiter test
