const proj4 = require('proj4')
const _ = require('lodash')
const transformCoordinates = require('./transform-coordinates')

module.exports = function projectCoordinates (coordinates, options = {}) {
  const sourceSR = options.sourceSR || 'EPSG:4326'
  const targetSR = options.targetSR || 'EPSG:3857'
  if (sourceSR === targetSR) return coordinates

  return transformCoordinates(coordinates, { sourceSR, targetSR }, (coordinates, options) => {
    if (_.isNumber(coordinates[0]) && _.isNumber(coordinates[1])) {
      return proj4(options.sourceSR, options.targetSR, coordinates)
    } else {
      return coordinates
    }
  })
}
