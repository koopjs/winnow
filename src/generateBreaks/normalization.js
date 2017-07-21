module.exports = { getFieldValues, normalizeValues }

function getFieldValues (features, field) {
  // TODO: should featureCollection metadata fields be checked too?
  return features.map((feature, index) => {
    const properties = feature.properties || feature.attributes // TODO: should this esri/geojson check be included?
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
    default: throw new Error('invalid normalizationType: ', normType)
  }
}

function normalizeByField (values, features, classification) {
  const normField = classification.normalizationField
  if (normField) {
    const normValues = getFieldValues(features, normField)
    if (Array.isArray(normValues)) {
      return values.map((value, index) => {
        return value / (normValues[index] <= 0 ? 1 : normValues[index]) // do not divide by <= 0
      }) // TODO: handle non-integer division
    }
  } else throw new Error('invalid normalizationField: ', normField)
  return values
}

function normalizeByLog (values) {
  return values.map(value => {
    return value === 0 || Math.log(value) <= 0 ? 0 : (Math.log(value) * Math.LOG10E || 0)
  })
}

function normalizeByPercent (values) {
  let valueTotal = values.reduce((sum, value) => { return sum + value }, 0)
  if (valueTotal <= 0) valueTotal = 1
  return values.map(value => { return (value / valueTotal) * 100 })
}
