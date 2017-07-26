'use strict'
function getFieldValues (features, field) {
  return features.map((feature, index) => {
    const properties = feature.properties
    const key = Object.keys(properties).filter(property => { return property === field })
    const value = Number(properties[key])
    if (isNaN(value)) throw new TypeError('Cannot use values from non-numeric field')
    return value
  })
}

function normalizeValues (values, features, classification) {
  const normType = classification.normalizationType
  switch (normType) {
    case 'esriNormalizeByField': return normalizeByField(values, features, classification)
    case 'esriNormalizeByLog': return normalizeByLog(values)
    case 'esriNormalizeByPercentOfTotal': return normalizeByPercent(values)
    default: throw new Error('Normalization not supported: ', normType)
  }
}

function normalizeByField (values, features, classification) {
  const normField = classification.normalizationField
  if (normField) {
    const normValues = getFieldValues(features, normField)
    if (Array.isArray(normValues)) {
      return values.map((value, index) => {
        if (isNaN(normValues[index])) throw new Error('Field value to normalize with is non-numeric: ', normField)
        return value / (normValues[index] <= 0 ? 1 : normValues[index]) // do not divide by <= 0
      })
    } else throw new Error('Normalization values must be an array: ', normValues)
  } else throw new Error('invalid normalizationField: ', normField)
}

function normalizeByLog (values) {
  return values.map(value => {
    return value === 0 || Math.log(value) <= 0 ? 0 : (Math.log(value) * Math.LOG10E || 0)
  })
}

function normalizeByPercent (values) {
  let valueTotal = values.reduce((sum, value) => { return sum + value }, 0)
  if (valueTotal <= 0) throw new Error('Value total is not positive: ', valueTotal)
  return values.map(value => { return (value / valueTotal) * 100 })
}

module.exports = { getFieldValues, normalizeValues }
