'use strict'
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
  let filtered = []
  let limitExceeded = false
  // Get a prefix for constructing an OBJECTID
  let randomIntPrefix = getRandomIntPrefix(options.limit)

  if (options.offset) {
    if (options.offset >= features.length) throw new Error('OFFSET >= features length: ' + options)
    options.limit += options.offset
  }
  features.some((feature, i) => {
    const result = processQuery(feature, query, options, randomIntPrefix, i)
    if (result) filtered.push(result)
    if (filtered.length === (options.limit + 1)) {
      limitExceeded = true
      return true
    }
  })

  if (limitExceeded) filtered = filtered.slice(0, -1)

  if (options.collection) {
    options.collection.metadata = Object.assign({}, options.collection.metadata, { limitExceeded })
  }

  return finishQuery(filtered, options)
}

function standardQuery (features, query, options) {
  // Get a prefix for constructing an OBJECTID
  let randomIntPrefix = getRandomIntPrefix(features.length)
  const filtered = features.reduce((filteredFeatures, feature, i) => {
    const result = processQuery(feature, query, options, randomIntPrefix, i)
    if (result) filteredFeatures.push(result)
    return filteredFeatures
  }, [])
  return finishQuery(filtered, options)
}

function processQuery (feature, query, options, randomIntPrefix, objectId) {
  const params = Query.params([feature], options)
  const result = sql(query, params)[0]

  if (result && options.toEsri) return esriFy(result, options, randomIntPrefix, objectId)
  else return result
}

function esriFy (result, options, randomIntPrefix, objectId) {
  if (options.dateFields.length) {
    // mutating dates has down stream consequences if the data is reused
    result.attributes = _.cloneDeep(result.attributes)
    options.dateFields.forEach(field => {
      result.attributes[field] = new Date(result.attributes[field]).getTime()
    })
  }

  const metadata = (options.collection && options.collection.metadata) || {}

  // If the feature doesn't come with a consistent OBJECTID, then give it one likely to
  // vary across requests from same client
  if (!metadata.idField) {
    result.attributes.OBJECTID = Number(`${randomIntPrefix}${objectId}`)
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
 * Create a integer prefix (as string) that will not allow a final concatenated
 * value greater than OBJECTID limit of 2147483647
 * @param {*} maxIteratorValue the max value of iterator to which the prefix will be concatenated
 */
function getRandomIntPrefix (maxIteratorValue) {
  // Get the number of digits in feature count
  const digits = maxIteratorValue.toString().length

  // Set value for max OBJECTID (from ArcGIS, signed 32-bit integer)
  const MAXID = (2147483647).toString()

  // Calculate the largest allowable prefix for this set of features by
  // stripping place values need for the ID concatenation; then minus 1
  // to ensure the final concatenation is less then the MAXID
  const maxPrefix = Number(MAXID.substring(0, MAXID.length - digits)) - 1

  // Select a random number from 0 to maxPrefix and return as string
  return Math.floor(Math.random() * maxPrefix).toString()
}

module.exports = { breaksQuery, aggregateQuery, limitQuery, standardQuery, finishQuery }
