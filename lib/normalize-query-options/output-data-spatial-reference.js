const normalizeSpatialReference = require('../helpers/normalize-spatial-reference')

function normalizeOutputDataSpatialReference (options = {}) {
  const {
    srsname,
    srsName,
    projection,
    outputCrs,
    outSR,
    inputCrs,
    sourceSR
  } = options

  // if no output spatial reference set (outputCrs, projection, srsname, srsName, outSR), assume output will be same as input (inputCrs, sourceSR)
  const outputSpatialReference = outputCrs || projection || srsname || srsName || outSR || inputCrs || sourceSR || 4326

  return normalizeSpatialReference(outputSpatialReference)
}

module.exports = normalizeOutputDataSpatialReference
