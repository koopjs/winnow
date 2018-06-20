'use strict'
const Geometry = require('./geometry')
const Where = require('./where')
const Select = require('./select')
const Order = require('./order')

function create (options) {
  let query = Select.createClause(options)
  const where = Where.createClause(options)
  const geomFilter = Geometry.createClause(options)
  const order = Order.createClause(options)
  if (options.where || options.geometry) query += ' WHERE '
  if (options.where) query += where
  if (options.geometry && !where) query += geomFilter
  if (options.geometry && where) query += ` AND ${geomFilter}`
  if (options.order || options.orderByFields) query += order
  if (options.limit && options.offset) {
    query += ` LIMIT ${options.limit} OFFSET ${options.offset}`
  } else {
    if (options.limit) query += ` LIMIT ${options.limit}`
    if (options.offset) query += ` LIMIT 99999999999 OFFSET ${options.offset}` // https://stackoverflow.com/questions/255517/mysql-offset-infinite-rows (99999999999 is max before alasql crashes)
  }
  return query
}

function params (features, options) {
  const params = []
  // NOTE: order matters here
  // Fields stage
  if (options.projection && !options.aggregates) params.push(options.projection)
  if (options.geometryPrecision) params.push(options.geometryPrecision)
  // From stage
  params.push(Array.isArray(features) ? features : [features])
  // Where stage
  if (options.geometry) params.push(options.geometry)
  return params
}

module.exports = { create, params }
