const createAggregateSelect = require('./aggregate-select')
const { createGeometrySelectFragment } = require('./geometry-select-fragment')
const { createFieldsSelectFragment } = require('./fields-select-fragment')

function createSelectSql (options) {
  if (options.aggregates) return createAggregateSelect(options.aggregates, options.groupBy, options.esri)

  return createStandardSelect(options)
}

function createStandardSelect (options) {
  const fieldsList = createFieldsSelectFragment(options)

  if (options.returnGeometry === false) {
    return (`SELECT ${fieldsList} FROM ?`)
  }

  return (`SELECT ${fieldsList}, ${createGeometrySelectFragment(options)} FROM ?`)
}

module.exports = { createSelectSql }
