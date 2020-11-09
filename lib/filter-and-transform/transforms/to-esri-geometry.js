const _ = require('lodash')
const { closeRing, ringIsClockwise } = require('../../geometry/utils')
module.exports = function convert (geometry = {}) {
  const { type, coordinates } = geometry

  if (!type) return null

  if (type === 'Point') {
    const [x, y, z, m] = coordinates
    const geometry = { x, y }
    if (z) geometry.z = z
    if (m) geometry.m = m
    return geometry
  }

  if (type === 'MultiPoint') {
    return { points: _.clone(coordinates) }
  }

  if (type === 'LineString') {
    return { paths: [_.clone(coordinates)] }
  }

  if (type === 'MultiLineString') {
    return { paths: _.clone(coordinates) }
  }

  if (type === 'Polygon') {
    return { rings: orientRings(_.clone(coordinates)) }
  }

  if (type === 'MultiPolygon') {
    return { rings: flattenMultiPolygonRings(_.clone(coordinates)) }
  }

  throw new Error(`conversion of geometry type ${type} to Esri geometry is not supported`)
}

function orientRings (coordinates) {
  const outputRings = []
  const clonedCoordinates = coordinates.slice(0)
  const outerRing = closeRing(clonedCoordinates.shift().slice(0))
  const innerRings = clonedCoordinates

  if (outerRing.length >= 4) {
    if (!ringIsClockwise(outerRing)) {
      outerRing.reverse()
    }

    outputRings.push(outerRing)

    for (let i = 0; i < innerRings.length; i++) {
      var ring = closeRing(innerRings[i].slice(0))
      if (ring.length >= 4) {
        if (ringIsClockwise(ring)) {
          ring.reverse()
        }
        outputRings.push(ring)
      }
    }
  }
  return outputRings
}

function flattenMultiPolygonRings (coordinates) {
  var outputRings = []
  for (let i = 0; i < coordinates.length; i++) {
    const rings = orientRings(coordinates[i])

    for (let x = rings.length - 1; x >= 0; x--) {
      const ring = rings[x].slice(0)
      outputRings.push(ring)
    }
  }
  return outputRings
}
