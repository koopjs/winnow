function normalizeOrder (options) {
  const order = options.order || options.orderByFields
  if (!order) return
  if (typeof order === 'string' || order instanceof String) return order.split(',').map(item => item.trim())
  if (order instanceof Array) return order
}

module.exports = normalizeOrder
