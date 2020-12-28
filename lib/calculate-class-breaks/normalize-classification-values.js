const _ = require('lodash')

function normalizeClassBreaks (features, classification) {
  const { normType: type } = classification

  if (type === 'field') {
    return normalizeByField(features, classification)
  }

  if (type === 'log') {
    return normalizeByLog(features, classification)
  }

  if (type === 'percent') {
    return normalizeByPercent(features, classification)
  }

  throw new Error(`Normalization not supported: ${type}`)
}

function normalizeByField (features, { field: classificationField, normField: normalizationField }) {
  if (!normalizationField) {
    throw new Error('normalization field is undefined')
  }

  const values = features.map(feature => {
    if (shouldSkipFeatureForFieldNormalization({ feature, classificationField, normalizationField })) {
      return
    }

    validateNormalizationValues({ feature, classificationField, normalizationField })

    const valueToNormalizeBy = feature.properties[normalizationField] > 0 ? feature.properties[normalizationField] : 1

    return feature.properties[classificationField] / valueToNormalizeBy
  }).filter(value => {
    return !_.isUndefined(value)
  })

  if (!values || values.length === 0) {
    throw new Error(`classification field "${classificationField}" and normalization field "${normalizationField}" were not found on any feature.`)
  }
  return values
}

function normalizeByLog (features, { field: classificationField }) {
  const values = features.map(feature => {
    if (shouldSkipFeature({ feature, classificationField })) {
      return
    }

    validateClassificationValue(feature, classificationField)

    const value = feature.properties[classificationField]

    if (value <= 0) {
      return 0
    }
    return Math.log(value) * Math.LOG10E
  }).filter(value => {
    return !_.isUndefined(value)
  })

  if (!values || values.length === 0) {
    throw new Error(`"${classificationField}" was not found on any feature.`)
  }
  return values
}

function normalizeByPercent (features, { field: classificationField }) {
  const values = features.map(feature => {
    if (shouldSkipFeature({ feature, classificationField })) {
      return
    }

    validateClassificationValue(feature, classificationField)

    const value = feature.properties[classificationField]

    if (value <= 0) {
      return 0
    }
    return value
  }).filter(value => {
    return !_.isUndefined(value)
  })

  const valueTotal = values.reduce((sum, value) => { return sum + value }, 0)

  if (valueTotal <= 0) throw new Error(`Cannot normalize by percent because value total is not positive: ${valueTotal}`)

  return values.map(value => { return (value / valueTotal) * 100 })
}

function shouldSkipFeature ({ feature: { properties }, classificationField }) {
  const value = properties[classificationField]
  return value === undefined || value === null
}

function shouldSkipFeatureForFieldNormalization ({ feature: { properties }, classificationField, normalizationField }) {
  const value = properties[classificationField]
  const valueToNormalizeBy = properties[normalizationField]
  return value === undefined || value === null || valueToNormalizeBy === undefined || valueToNormalizeBy === null
}

function validateNormalizationValues ({ feature: { properties }, classificationField, normalizationField }) {
  const value = properties[classificationField]
  const valueToNormalizeBy = properties[normalizationField]
  if (!_.isNumber(value)) {
    throw new TypeError(`Cannot use non-numeric classificationField, ${classificationField}: ${value}`)
  }

  if (!_.isNumber(valueToNormalizeBy)) {
    throw new TypeError(`Cannot use non-numeric normalizationField, ${normalizationField}: ${valueToNormalizeBy}`)
  }
}

function validateClassificationValue ({ properties }, classificationField) {
  const value = properties[classificationField]
  if (!_.isNumber(value)) {
    throw new TypeError(`Cannot use non-numeric classificationField, ${classificationField}: ${value}`)
  }
}
module.exports = normalizeClassBreaks
