'use strict'
const Classifier = require('classybrew')
const Options = require('../options')
const Query = require('../query')
const { getFieldValues, normalizeClassBreaks } = require('./normalizeClassBreaks')
const { calculateMinValue } = require('./utils')

function calculateClassBreaks (features, classification) {
  const values = getFieldValues(features, classification.field)
  // make sure there aren't more breaks than values
  if (classification.breakCount > values.length) classification.breakCount = values.length
  // calculate break ranges [ [a-b], [b-c], ...] from input values
  return classifyClassBreaks(values, features, classification)
    .map((value, index, array) => {
      // change minValue so break ranges don't overlap
      return [calculateMinValue(value, index, array), value]
    }).slice(1) // remove first range
}

function classifyClassBreaks (values, features, classification) {
  // TODO: determine how to handle minValue, maxValue, & label when Quantile values are heavily skewed
  // TODO: implement last two classification methods
  if (classification.normType) values = normalizeClassBreaks(values, features, classification)
  const classifier = new Classifier()
  classifier.setSeries(values)
  classifier.setNumClasses(classification.breakCount)

  switch (classification.method) {
    case 'equalInterval': return classifier.classify('equal_interval')
    case 'naturalBreaks': return classifier.classify('jenks')
    case 'quantile': return classifier.classify('quantile')
    case 'geomInterval': throw new Error('Classification method not yet supported')
    case 'std': return classifier.classify('std_deviation') // TODO: integrate geoservices' std interval
    default: throw new Error('invalid classificationMethod: ', classification.method)
  }
}

function calculateUniqueValueBreaks (features, classification) {
  let options = {
    aggregates: [
      {
        type: 'count',
        field: classification.fields,
        name: 'count'
      }
    ],
    groupBy: classification.fields
  }
  options = Options.prepare(options, features)
  const query = Query.create(options)
  return { options, query }
}

module.exports = { calculateClassBreaks, calculateUniqueValueBreaks }
