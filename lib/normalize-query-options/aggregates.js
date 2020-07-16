function normalizeAggregates ({ aggregates, outStatistics }) {
  if (outStatistics) {
    const aggregates = getAggregatesFromOutStatistics(outStatistics)
    return normalizeAggregateNames(aggregates)
  }

  if (aggregates) {
    return normalizeAggregateNames(aggregates)
  }
}

function getAggregatesFromOutStatistics (outStatistics) {
  return outStatistics.map(agg => {
    return {
      type: agg.statisticType,
      field: agg.onStatisticField,
      name: agg.outStatisticFieldName
    }
  })
}

function normalizeAggregateNames (aggregates) {
  return aggregates.map(aggregate => {
    const { type, name, field } = aggregate
    if (!name) aggregate.name = `${type}_${field}`
    aggregate.name = aggregate.name.replace(/\s/g, '_')
    return aggregate
  })
}

module.exports = normalizeAggregates
