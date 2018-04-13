function normalizeWhere (options) {
  if (/1\s*=\s*1/.test(options.where)) return undefined
  else if (/(?!date )('?\d\d\d\d-\d\d-\d\d'?)/.test(options.where)) return normalizeDate(options.where)
  else return options.where
}

function normalizeDate (where) {
  const matches = where.match(/(?!date )('?\d\d\d\d-\d\d-\d\d'?)/g)
  matches.forEach(match => {
    where = where.replace(`date ${match}`, `'${new Date(match.toString()).toISOString()}'`)
  })
  return where
}

/**
 * Transform the input of requested response fields
 * @param {Object} options - object that may contain 'fields' or 'outFields' property
 */
function normalizeFields (options) {
  let fields = options.fields || options.outFields

  // TODO: Clearer set of if statements
  if (fields === '*') return undefined
  if (typeof fields === 'string' || fields instanceof String) fields = fields.split(',')
  if (fields instanceof Array && options.toEsri) {
    // If idField has been set for use as OBJECTID, we must replace OBJECTID with idField in the query fields
    let idField = options.collection && options.collection.metadata && options.collection.metadata.idField
    let objectIdIndex = fields.findIndex((i) => { return i === 'OBJECTID' })
    if (objectIdIndex > -1 && idField) {
      fields[objectIdIndex] = idField
    }
    return fields
  }
  if (fields instanceof Array) return fields
  return undefined
}

function normalizeOrder (options) {
  const order = options.order || options.orderByFields
  return typeof order === 'string' ? [order] : order
}

function normalizeAggregates (options) {
  let aggregates = options.aggregates
  if (options.outStatistics) {
    aggregates = options.outStatistics.map(agg => {
      return {
        type: agg.statisticType,
        field: agg.onStatisticField,
        name: agg.outStatisticFieldName
      }
    })
  }

  if (aggregates) {
    aggregates.forEach(agg => {
      if (!agg.name) agg.name = `${agg.type}_${agg.field}`
      agg.name = agg.name.replace(/\s/g, '_')
    })
  }

  return aggregates
}

function normalizeGroupBy (options) {
  const groupBy = options.groupBy || options.groupByFieldsForStatistics
  return typeof groupBy === 'string' ? [groupBy] : groupBy
}

module.exports = { normalizeWhere, normalizeFields, normalizeOrder, normalizeAggregates, normalizeGroupBy }
