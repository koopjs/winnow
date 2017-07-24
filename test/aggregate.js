'use strict'
const _ = require('lodash')
const test = require('tape')
const winnow = require('../src')
const features = require('./fixtures/trees.json')
const snowFeatures = require('./fixtures/snow.json')
const budgetTable = require('./fixtures/budgetTable.json')
const classBreaks = require('./fixtures/generateBreaks/generateRenderer-ClassBreaks.json')
const uniqueValue = require('./fixtures/generateBreaks/generateRenderer-UniqueValue.json')

test('create breaks', t => {
  t.plan(5)
  const options = _.cloneDeep(classBreaks)
  const results = winnow.query(features, options)
  t.equal(Array.isArray(results), true)
  t.equal(Array.isArray(results[0]), true)
  t.equal(results.length, 5)
  t.deepEqual(results[0], [0, 2.8])
  t.deepEqual(results[4], [11.2, 14])
  t.end()
})

test('change break count', t => {
  t.plan(5)
  const options = _.cloneDeep(classBreaks)
  options.classificationDef.breakCount = 9
  const results = winnow.query(features, options)
  t.equal(Array.isArray(results), true)
  t.equal(Array.isArray(results[0]), true)
  t.equal(results.length, 9)
  t.deepEqual(results[0], [0, 1.5555555555555556])
  t.deepEqual(results[8], [12.444444444444445, 14])
  t.end()
})

test('change classification field', t => {
  t.plan(5)
  const options = _.cloneDeep(classBreaks)
  options.classificationDef.classificationField = 'House_Number'
  const results = winnow.query(features, options)
  t.equal(Array.isArray(results), true)
  t.equal(Array.isArray(results[0]), true)
  t.equal(results.length, 5)
  t.deepEqual(results[0], [1, 910.8])
  t.deepEqual(results[4], [3640.2, 4550])
  t.end()
})

test('change classification method', t => {
  t.plan(5)
  const options = _.cloneDeep(classBreaks)
  options.classificationDef.classificationMethod = 'esriClassifyNaturalBreaks'
  const results = winnow.query(features, options)
  t.equal(Array.isArray(results), true)
  t.equal(Array.isArray(results[0]), true)
  t.equal(results.length, 5)
  t.deepEqual(results[0], [0, 1])
  t.deepEqual(results[4], [10, 14])
})

test('normalize by field', t => {
  t.plan(5)
  const options = _.cloneDeep(classBreaks)
  options.classificationDef.classificationField = 'House_Number'
  options.classificationDef.normalizationType = 'esriNormalizeByField'
  options.classificationDef.normalizationField = 'Trunk_Diameter'
  const results = winnow.query(features, options)
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
  const results = winnow.query(features, options)
  t.equal(Array.isArray(results), true)
  t.equal(Array.isArray(results[0]), true)
  t.equal(results.length, 5)
  t.deepEqual(results[0], [0, 0.2292256071356476])
  t.deepEqual(results[4], [0.9169024285425904, 1.146128035678238])
})

test('normalize by total', t => {
  t.plan(5)
  const options = _.cloneDeep(classBreaks)
  options.classificationDef.normalizationType = 'esriNormalizeByPercentOfTotal'
  const results = winnow.query(features, options)
  t.equal(Array.isArray(results), true)
  t.equal(Array.isArray(results[0]), true)
  t.equal(results.length, 5)
  t.deepEqual(results[0], [0, 0.0013272469579973742])
  t.deepEqual(results[4], [0.005308987831989497, 0.006636234789986871])
})

test('unacceptable classificationField', t => {
  t.plan(1)
  const options = _.cloneDeep(classBreaks)
  options.classificationDef.classificationField = 'Common_Name'
  const results = winnow.query(features, options)
  t.equal(results, undefined)
})

test('unacceptable classificationMethod', t => {
  t.plan(1)
  const options = _.cloneDeep(classBreaks)
  options.classificationDef.classificationMethod = 'invalidMethod'
  const results = winnow.query(features, options)
  t.equal(results, undefined)
})

test('first attempted test at unique values', t => {
  t.plan(1)
  const results = winnow.query(features, _.cloneDeep(uniqueValue))
  console.log(results)
  t.equal(results.length, 162)
})

test('Get a sum', t => {
  t.plan(1)
  const options = {
    aggregates: [
      {
        type: 'sum',
        field: 'Trunk_Diameter'
      }
    ]
  }
  const results = winnow.query(features, options)
  t.equal(results.sum_Trunk_Diameter, 850305)
})

test('Use a group by', t => {
  t.plan(3)
  const options = {
    aggregates: [
      {
        type: 'avg',
        field: 'Trunk_Diameter'
      }
    ],
    groupBy: 'Genus'
  }
  const results = winnow.query(features, options)
  t.equal(results.length, 162)
  t.ok(results[0].Genus)
  t.ok(results[0].avg_Trunk_Diameter)
})

test('Use an order and a group by', t => {
  t.plan(2)
  const options = {
    aggregates: [
      {
        type: 'avg',
        field: 'Trunk_Diameter'
      }
    ],
    groupBy: 'Genus',
    order: 'avg_Trunk_Diameter DESC'
  }
  const results = winnow.query(features, options)
  t.equal(results.length, 162)
  t.equal(results[0].avg_Trunk_Diameter, 37)
})

test('Use a group by esri style', t => {
  t.plan(3)
  const options = {
    outStatistics: [
      {
        statisticType: 'avg',
        onStatisticField: 'Trunk_Diameter'
      }
    ],
    groupByFieldsForStatistics: ['Genus']
  }
  const results = winnow.query(features, options)
  t.equal(results.length, 162)
  t.ok(results[0].Genus)
  t.ok(results[0].avg_Trunk_Diameter)
})

test('Use multiple group bys', t => {
  t.plan(4)
  const options = {
    aggregates: [
      {
        type: 'avg',
        field: 'Trunk_Diameter'
      }
    ],
    groupBy: ['Genus', 'Common_Name']
  }
  const results = winnow.query(features, options)
  t.equal(results.length, 310)
  t.ok(results[0].Genus)
  t.ok(results[0].Common_Name)
  t.ok(results[0].avg_Trunk_Diameter)
})

test('Get a named aggregate', t => {
  t.plan(1)
  const options = {
    aggregates: [
      {
        type: 'sum',
        field: 'Trunk_Diameter',
        name: 'total_diameter'
      }
    ]
  }
  const results = winnow.query(features, options)
  t.equal(results.total_diameter, 850305)
})

test('Get an aggregate on a field with a space', t => {
  t.plan(1)
  const options = {
    aggregates: [
      {
        type: 'sum',
        field: 'total precip'
      }
    ]
  }
  const results = winnow.query(snowFeatures, options)
  t.equal(results.sum_total_precip, 135.69000000000003)
})

test('Get an aggregate on a field with a /', t => {
  t.plan(1)
  const options = {
    aggregates: [
      {
        type: 'count',
        field: 'Full/Part',
        name: 'Full/Part_COUNT'
      }
    ]
  }
  const results = winnow.query(budgetTable, options)
  t.equal(results['Full/Part_COUNT'], 6885)
})

test('Get the variance of a field', t => {
  t.plan(1)
  const options = {
    aggregates: [
      {
        type: 'var',
        field: 'total precip'
      }
    ]
  }
  const results = winnow.query(snowFeatures, options)
  t.equal(results.var_total_precip, 0.07661480700055341)
})

test('Get an aggregate with a where clause', t => {
  t.plan(1)
  const options = {
    aggregates: [
      {
        type: 'sum',
        field: 'Trunk_Diameter',
        name: 'total_diameter'
      }
    ],
    where: 'Trunk_Diameter > 10'
  }
  const results = winnow.query(features, options)
  t.equal(results.total_diameter, 735026)
})

test('Get multiple aggregates', t => {
  t.plan(2)
  const options = {
    aggregates: [
      {
        type: 'sum',
        field: 'Trunk_Diameter',
        name: 'total_diameter'
      },
      {
        type: 'max',
        field: 'Trunk_Diameter',
        name: 'max_diameter'
      }
    ]
  }
  const results = winnow.query(features, options)
  t.equal(results.total_diameter, 850305)
  t.equal(results.max_diameter, 130)
})

test('Get multiple aggregates specified in the esri way', t => {
  t.plan(2)
  const options = {
    outStatistics: [
      {
        statisticType: 'sum',
        onStatisticField: 'Trunk_Diameter',
        outStatisticFieldName: 'total_diameter'
      },
      {
        statisticType: 'max',
        onStatisticField: 'Trunk_Diameter',
        outStatisticFieldName: 'max_diameter'
      }
    ]
  }
  const results = winnow.query(features, options)
  t.equal(results.total_diameter, 850305)
  t.equal(results.max_diameter, 130)
})

test('Get multiple aggregates with a where clause', t => {
  t.plan(2)
  const options = {
    aggregates: [
      {
        type: 'sum',
        field: 'Trunk_Diameter',
        name: 'total_diameter'
      },
      {
        type: 'max',
        field: 'Trunk_Diameter',
        name: 'max_diameter'
      }
    ],
    where: 'Trunk_Diameter > 10'
  }
  const results = winnow.query(features, options)
  t.equal(results.total_diameter, 735026)
  t.equal(results.max_diameter, 130)
})

test('ignore projection when getting an aggregate', t => {
  t.plan(3)
  const options = {
    aggregates: [
      {
        type: 'count',
        field: 'Trunk_Diameter',
        name: 'count_trunk_Diameter'
      }
    ],
    groupBy: 'Trunk_Diameter',
    outSR: 102100
  }
  const results = winnow.query(features, options)
  t.equal(results[0].count_trunk_Diameter, 1905)
  t.ok(results[0].Trunk_Diameter)
  t.ok(results[0].count_trunk_Diameter)
})

test('ignore projection when getting an aggregate specified in the esri way', t => {
  t.plan(3)
  const options = {
    outStatistics: [
      {
        statisticType: 'count',
        onStatisticField: 'Trunk_Diameter',
        'outStatisticFieldName': 'count_trunk_Diameter'
      }
    ],
    groupByFieldsForStatistics: ['Trunk_Diameter'],
    outSR: 102100
  }
  const results = winnow.query(features, options)
  t.equal(results[0].count_trunk_Diameter, 1905)
  t.ok(results[0].Trunk_Diameter)
  t.ok(results[0].count_trunk_Diameter)
})
