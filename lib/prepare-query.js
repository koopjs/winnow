const _ = require('lodash')
const sql = require('./alasql')
const {
  create: createSqlStatement,
  params: createSqlParams
} = require('./sql-query')
const normalizeQueryOptions = require('./normalize-query-options')
const normalizeQueryInput = require('./normalize-query-input')
const { finishQuery } = require('./executeQuery')

module.exports = function (options) {
  const normalizedOptions = normalizeQueryOptions(options)
  const preparedSqlParams = createSqlParams('$features$', normalizedOptions)
  const sqlStatement = createSqlStatement(normalizedOptions)
  const query = sql.compile(sqlStatement)

  return function (input) {
    if (input.features) {
      normalizedOptions.collection = _.omit(input, 'features')
    }
    const params = getParams(input, preparedSqlParams)
    const filtered = query(params)
    return finishQuery(filtered, normalizedOptions)
  }
}

function getParams (input, preparedParams) {
  const features = normalizeQueryInput(input)

  return preparedParams.map(param => {
    if (Array.isArray(param) && param[0] === '$features$') return features
    return param
  })
}
