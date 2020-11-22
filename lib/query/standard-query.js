const _ = require('lodash')
const { filterAndTransform: sql } = require('../filter-and-transform')
const Query = require('../sql-query-builder')
const packageFeatures = require('./package-features')
const { calculateClassBreaks, calculateUniqueValueBreaks } = require('../generateBreaks/index')

function breaksQuery (features, query, options) {
  const queriedData = standardQuery(features, query, options)
  if (queriedData === undefined || queriedData.features === undefined) throw new Error('query response undefined')
  if (queriedData.features.length === 0) throw new Error('need features in order to classify')

  const classification = options.classification
  if (classification.type === 'classes') {
    if (classification.breakCount <= 0) throw new Error('breakCount must be positive: ' + classification.breakCount)
    return calculateClassBreaks(queriedData.features, classification)
  } else if (classification.type === 'unique') {
    const { options, query } = calculateUniqueValueBreaks(queriedData.features, classification)
    return standardQuery(queriedData.features, query, { ...options, skipLimitHandling: true })
  } else throw new Error('unacceptable classification type: ' + classification.type)
}

function standardQuery (features, query, options = {}) {
  const { limit } = options
  const params = Query.params(features, options)
  const filtered = sql(query, params)

  if (options.skipLimitHandling || !options.limit) {
    return packageFeatures(filtered, options)
  }

  // options.limit is incremented by one in normalizeOptions.js; if filtered.length === options.limit, original limit option has been exceeded
  const limitExceeded = filtered.length === limit

  if (limitExceeded) {
    return conformToLimit(filtered, options)
  }

  return packageFeatures(filtered, options)
}

function conformToLimit (features, options) {
  // Pop off the last feature, so that feature array length is consistent with original limit option
  features.pop()

  if (options.collection) _.set(options, 'collection.metadata.limitExceeded', true)
  return packageFeatures(features, options)
}

module.exports = { breaksQuery, standardQuery }
