'use strict'
const sql = require('./sql')
const Query = require('./query')
const Params = require('./params')
const Options = require('./options')
const _ = require('lodash')
const Winnow = {}

Winnow.query = function (input, options = {}) {
  /* First step is detect what kind of input this is.
  i.e. is it a collection object or an array of features?
  If it's a collection object we'll want to return it as such.
  Otherwise we can just return an array */
  let features = input
  if (input.features) {
    options.collection = _.omit(input, 'features')
    features = input.features
  }

  options = Options.prepare(options)

  const query = Query.create(options)
  if (process.env.NODE_ENV === 'test') console.log(query, options)
  let filtered
  if (options.aggregates) {
    filtered = aggregateQuery(features, query, options)
  } else if (options.limit) {
    filtered = limitQuery(features, query, options)
  } else {
    filtered = standardQuery(features, query, options)
  }
  return finishQuery(filtered, options)
}

function aggregateQuery (features, query, options) {
  const params = Query.params(features, options)
  return sql(query, params)
}

function limitQuery (features, query, options) {
  let filtered = []
  features.some(feature => {
    const params = Query.params([feature], options)
    const result = sql(query, params)
    if (result[0]) filtered.push(result[0])
    return filtered.length === options.limit
  })
  return filtered
}

function standardQuery (features, query, options) {
  return features.reduce((filteredFeatures, feature) => {
    const params = Query.params([feature], options)
    const result = sql(query, params)
    if (result[0]) filteredFeatures.push(result[0])
    return filteredFeatures
  }, [])
}

Winnow.prepareQuery = function (options) {
  options = Options.prepare(options)
  const statement = Query.create(options)
  const query = sql.compile(statement)
  const params = [null]
  if (options.projection) params.push(options.projection)
  if (options.geometryPrecision) params.push(options.geometryPrecision)
  if (options.geometry) params.push(options.geometry)

  return function (input) {
    /* Prepared queries can take either a collection object,
     a feature array, or a single feature.
     So detection is a little more complex */
    let features
    if (input.features) {
      options.collection = _.omit(input, 'features')
      features = input.features
    } else if (input.length) {
      features = input
    } else {
      // coerce to an array if this is a single feature
      features = [input]
    }
    params[0] = features
    const filtered = query(params)
    return finishQuery(filtered, options)
  }
}

Winnow.querySql = function (statement, params) {
  return sql(statement, params)
}

Winnow.prepareSql = function (statement) {
  const query = sql.compile(statement)

  return function (inParams) {
    const params = Params.prepare(inParams)
    const results = query(params)
    return results
  }
}

function finishQuery (features, options) {
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

module.exports = Winnow
