const Classifier = require('classybrew')
const { getFieldValues, normalizeValues } = require('./normalization')

function createBreaks (data, classification) {
  const features = data.features
  let values
  try {
    values = getFieldValues(features, classification.classificationField)
    if (classification.breakCount > values.length) classification.breakCount = values.length // make sure there aren't more breaks than values
    return classifyBreaks(values, features, classification)
      .map((value, index, array) => { return [array[index - 1] || array[0], value] }).slice(1)
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

module.exports = { createBreaks }
