function normalizeGroupBy (options) {
  const groupBy = options.groupBy || options.groupByFieldsForStatistics
  if (typeof groupBy === 'string' || groupBy instanceof String) return groupBy.split(',').map(item => item.trim())
  if (groupBy instanceof Array) return groupBy
}

module.exports = normalizeGroupBy
