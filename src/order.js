function createClause (options) {
  const selector = options.esri ? 'attributes' : 'properties'
  const order = options.order
  if (order) {
    const fields = order.map((item, i) => {
      let field = item[0]
      let direction = item[1].toUpperCase()
      const orderIsAgg = options.aggregates && options.aggregates.some(agg => {
        return field === agg.name
      })
      if (orderIsAgg) return `\`${field}\` ${direction}`
      else return `${selector}->\`${field}\` ${direction}`
    }, '').join(', ')
    return ` ORDER BY ${fields}`
  } else {
    return ''
  }
}

module.exports = { createClause }
