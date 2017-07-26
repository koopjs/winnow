const Classifier = require('classybrew')
const Options = require('../options')
const Query = require('../query')
const { getFieldValues, normalizeValues } = require('./normalization')

function calculateClassBreaks (features, classification) {
  let values
  try {
    values = getFieldValues(features, classification.classificationField)
    // make sure there aren't more breaks than values
    if (classification.breakCount > values.length) classification.breakCount = values.length
    return classifyBreaks(values, features, classification)
      .map((value, index, array) => {
        // increment minValue slightly so that breaks don't overlap
        return [calculateMinValue(value, index, array), value]
      }).slice(1) // remove first invalid range
  } catch (e) { console.log(e) }
}

function classifyBreaks (values, features, classification) {
  if (classification.normalizationType) values = normalizeValues(values, features, classification)
  const classifier = new Classifier()
  classifier.setSeries(values)
  classifier.setNumClasses(classification.breakCount)

  const classMethod = classification.classificationMethod
  switch (classMethod) {
    case 'esriClassifyEqualInterval': return classifier.classify('equal_interval')
    case 'esriClassifyNaturalBreaks': return classifier.classify('jenks')
    case 'esriClassifyQuantile': return classifier.classify('quantile')
    // TODO: implement last two classification methods
    case 'esriClassifyGeometricalInterval': return undefined
    case 'esriClassifyStandardDeviation':
      if (classification.standardDeviationInterval) {
        // TODO: either use a different library to classify, or find how to integrate interval into calculation
        return classifier.classify('std_deviation')
      } else {
        // handle when a user doesn't add a standard deviation interval
      } break
    default: throw new Error('invalid classificationMethod: ', classMethod)
  }
}

// this should really be a built-in called: Math.bump()
function calculateMinValue (value, index, array) {
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

function calculateUniqueValues (features, classification) {
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

module.exports = { calculateClassBreaks, calculateUniqueValues }
