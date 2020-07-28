const normalizeSpatialReference = require('./spatial-reference')
/**
 * Normalize the input spatial reference for a geometry filter. Look on options.geometry object first.
 * If spatial reference not present, look in options.inSR.  Defaults to EPSG:4326 (which is known to Proj4)
 * @param {object} options options object that may or may not have "geometry" and "inSR" properties
 * @returns {string} EPSG:<wkid> or srs WKT; defaults to EPSG:4326
 */
function normalizeGeometryFilterSpatialReference ({ geometry = {}, inSR } = {}) {
  // Defer to geometry filters's spatial reference
  const spatialReference = normalizeSpatialReference(geometry.spatialReference || inSR)

  if (!spatialReference) return 'EPSG:4326'
  const { wkid, wkt } = spatialReference
  return wkid ? `EPSG:${wkid}` : wkt
}

module.exports = normalizeGeometryFilterSpatialReference
