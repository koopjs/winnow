const _ = require('lodash')

/**
 * Normalize the fields option
 * @param {Object} options
 */
function normalizeFields (options) {
  const { returnIdsOnly, outFields, collection } = options
  const idField = _.get(collection, 'metadata.idField')
  // returnIdsOnly overrules all other fields options values
  if (returnIdsOnly === true && idField) return [idField]
  if (returnIdsOnly === true) return ['OBJECTID']

  const fields = options.fields || outFields
  // * is Geoservices equivalent of "all fields", so set to undefined
  if (fields === '*') return undefined
  if (typeof fields === 'string' || fields instanceof String) return fields.split(',').map(item => item.trim())
  if (fields instanceof Array) return fields
}

module.exports = normalizeFields
