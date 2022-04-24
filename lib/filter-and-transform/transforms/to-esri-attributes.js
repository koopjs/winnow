const _ = require('lodash')
const { createIntegerHash } = require('../helpers')

module.exports = function transformToEsriProperties (properties, geometry, delimitedDateFields, requiresObjectId, idField) {
  requiresObjectId = requiresObjectId === 'true'
  idField = idField === 'null' ? null : idField
  const dateFields = delimitedDateFields.split(',')
  const transformedProperties = serializeNestedProperties(properties, dateFields)
  if (requiresObjectId) {
    if (!idField) {
      const OBJECTID = createIntegerHash(JSON.stringify({ properties: transformedProperties, geometry }))
      return { ...transformedProperties, OBJECTID }
    }

    if (shouldLogIdFieldWarning(properties[idField])) {
      console.warn(`WARNING: OBJECTIDs created from provider's "idField" (${idField}: ${properties[idField]}) are not integers from 0 to 2147483647`)
    }
  }
  return transformedProperties
}

function shouldLogIdFieldWarning (idField) {
  return process.env.NODE_ENV !== 'production' &&
    process.env.KOOP_WARNINGS !== 'suppress' &&
    (!Number.isInteger(idField) || idField > 2147483647)
}

function serializeNestedProperties (properties, dateFields) {
  return Object.entries(properties).reduce((transformedProperties, [key, value]) => {
    if (dateFields.includes(key)) {
      transformedProperties[key] = value === null ? null : new Date(value).getTime()
    } else if (_.isObject(value)) {
      transformedProperties[key] = JSON.stringify(value)
    } else {
      transformedProperties[key] = value
    }
    return transformedProperties
  }, {})
}
