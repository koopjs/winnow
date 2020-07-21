const { normalizeArray } = require('./helpers')

function normalizeOrder (options) {
  const order = options.order || options.orderByFields
  return normalizeArray(order)
}

module.exports = normalizeOrder
