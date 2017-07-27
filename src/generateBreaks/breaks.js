'use strict'
const Classifier = require('classybrew')
const Options = require('../options')
const Query = require('../query')
const { getFieldValues, normalizeValues } = require('./normalization')

function calculateClassBreaks (features, classification) {
  const values = getFieldValues(features, classification.classificationField)
  // make sure there aren't more breaks than values
  if (classification.breakCount > values.length) classification.breakCount = values.length
  // calculate break ranges [ [a-b], [b-c], ...] from input values
  return classifyBreaks(values, features, classification)
    .map((value, index, array) => {
      // change minValue so break ranges don't overlap
      return [calculateMinValue(value, index, array), value]
    }).slice(1) // remove first range
}

function classifyBreaks (values, features, classification) {
  // TODO: determine how to handle minValue, maxValue, & label when Quantile values are heavily skewed
  // TODO: implement last two classification methods
  if (classification.normalizationType) values = normalizeValues(values, features, classification)
  const classifier = new Classifier()
  classifier.setSeries(values)
  classifier.setNumClasses(classification.breakCount)

  const classMethod = classification.classificationMethod
  switch (classMethod) {
    case 'esriClassifyEqualInterval': return classifier.classify('equal_interval')
    case 'esriClassifyNaturalBreaks': return classifier.classify('jenks')
    case 'esriClassifyQuantile': return classifier.classify('quantile')
    case 'esriClassifyGeometricalInterval': throw new Error('Classification method not yet supported')
    case 'esriClassifyStandardDeviation': return classifier.classify('std_deviation')
    default: throw new Error('invalid classificationMethod: ', classMethod)
  }
}

// this should really be a built-in called: Math.bump()
function calculateMinValue (value, index, array) {
  // TODO: determine how to fix rounding on large decimal places (e.g., [1 - 2.33334], [2.3333*6* - 3])
  let minValue = array[index - 1] || array[0]
  if (isNaN(minValue)) throw new Error('Previous break value is non-numeric')
  if (minValue !== 0 && minValue !== array[0]) {
    const divisor = Math.pow(10, getPrecision(minValue))
    minValue = Math.round((minValue + (1 / divisor)) * divisor) / divisor
  }
  return minValue
}

function getPrecision (a) {
  if (!isFinite(a)) return 0
  let e = 1
  let p = 0
  while (Math.round(a * e) / e !== a) { e *= 10; p++ }
  return p
}

function calculateUniqueValue (features, classification) {
  const fields = classification.uniqueValueFields[0] // TODO: handle multiple field values
  let options = {
    aggregates: [
      {
        type: 'count',
        field: fields,
        name: 'count'
      }
    ],
    groupBy: fields
  }
  options = Options.prepare(options, features)
  const query = Query.create(options)
  return { options, query }
}

module.exports = { calculateClassBreaks, calculateUniqueValue }

/* TODO: find way to include standardDeviationInterval
function calculateStandardDeviation (values, classification, classifier) {
  return classifier.classify('std_deviation')
  if (classification.standardDeviationInterval) {
    const interval = classification.standardDeviationInterval
    switch (interval) {
      case '1': return classifier.classify('std_deviation')
      case '.5': return classifier.classify('std_deviation')
      case '.33': return classifier.classify('std_deviation')
      case '.25': return classifier.classify('std_deviation')
      default: throw new Error('Invalid standardDeviationInterval. Must specify one of: 1, .5, .33, .25')
    }
  } else throw new Error('Must include standardDeviationInterval')
}
*/
