const compose = require('./compose')
function createClause (options = {}) {
  const funcs = []
  if (options.geometryPrecision) funcs.push({ geometryPrecision: options.geometryPrecision })
  if (options.projection) funcs.push({ project: options.projection })
  if (options.toEsri) funcs.push('esriGeom')

  return funcs.length ? compose(funcs, 'geometry') + ' as geometry' : 'geometry'
}

module.exports = { createClause }
