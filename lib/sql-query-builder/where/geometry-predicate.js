module.exports = function ({ geometry, spatialPredicate = 'ST_Intersects' } = {}) {
  if (!geometry) return
  return `${spatialPredicate}(geometry, ?)`
}
