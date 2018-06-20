'use strict'
const farmhash = require('farmhash')
const sql = require('./sql')
const Query = require('./query')
const { calculateClassBreaks, calculateUniqueValueBreaks } = require('./generateBreaks/index')
const _ = require('lodash')

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
    return aggregateQuery(queriedData.features, query, options)
  } else throw new Error('unacceptable classification type: ' + classification.type)
}

function aggregateQuery (features, query, options) {
  const params = Query.params(features, options)
  const filtered = sql(query, params)
  return finishQuery(filtered, options)
}

function limitQuery (features, query, options) {
  const limitExceeded = features.length < (options.offset ? options.offset : 0) + options.limit

  if (options.offset) {
    if (options.offset >= features.length) throw new Error('OFFSET >= features length: ' + options)
    options.limit += options.offset
  }
  const filtered = processQuery(features, query, options)

  if (options.collection) {
    options.collection.metadata = Object.assign({}, options.collection.metadata, { limitExceeded })
  }

  return finishQuery(filtered, options)
}

function standardQuery (features, query, options) {
  const filtered = processQuery(features, query, options).filter((feature) => feature)
  return finishQuery(filtered, options)
}

function processQuery (features, query, options) {
  if (options.toEsri) {
    features = features.map(esrifyPreQuery.bind(null, options))
  };

  const params = Query.params(features, options)
  const results = sql(query, params)

  if (results && options.toEsri) {
    return results.map(esriFy.bind(null, options))
  } else { return results }
}

function esrifyPreQuery (options, feature) {
  const idField = _.get(options, 'collection.metadata.idField')

  if (!feature || !feature.properties) { return feature }
  // If the idField for the model set use its value as OBJECTID
  if (idField) {
    if (!Number.isInteger(feature.properties[idField]) || feature.properties[idField] > 2147483647) {
      console.warn("WARNING: OBJECTIDs created from provider's \"idField\" are not integers from 0 to 2147483647")
    }
    feature.properties.OBJECTID = feature.properties[idField]
  } else {
    // Create an OBJECTID by creating a numeric hash from the stringified feature
    // Note possibility of OBJECTID collisions with this method still exists, but should be small
    feature.properties.OBJECTID = createIntHash(JSON.stringify(feature))
  }

  return feature
}

function esriFy (options, result) {
  if (options.dateFields.length) {
    // mutating dates has down stream consequences if the data is reused
    result.attributes = _.cloneDeep(result.attributes)
    options.dateFields.forEach(field => {
      result.attributes[field] = new Date(result.attributes[field]).getTime()
    })
  }

  return result
}

function finishQuery (features, options) {
  if (options.offset) {
    if (options.offset >= features.length) throw new Error('OFFSET >= features length: ' + options)
    features = features.slice(options.offset)
  }
  if (options.groupBy) {
    return features
  } else if (options.aggregates) {
    return features[0]
  } else if (options.collection) {
    const collection = options.collection
    collection.features = features
    return collection
  } else {
    return features
  }
}

/**
 * Create integer hash in range of 0 - 2147483647 from string
 * @param {*} inputStr - any string
 */
function createIntHash (inputStr) {
  // Hash to 32 bit unsigned integer
  const hash = farmhash.hash32(inputStr)
  // Normalize to range of postive values of signed integer
  return Math.round((hash / 4294967295) * (2147483647))
}

module.exports = { breaksQuery, aggregateQuery, limitQuery, standardQuery, finishQuery }
