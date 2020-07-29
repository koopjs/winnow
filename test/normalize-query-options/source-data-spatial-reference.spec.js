const test = require('tape')
const normalizeSourceDataSpatialReference = require('../../lib/normalize-query-options/source-data-spatial-reference')

test('normalize-query-options, source-data-spatial-reference: undefined input', t => {
  t.plan(1)
  const spatialRef = normalizeSourceDataSpatialReference()
  t.equal(spatialRef, 'EPSG:4326')
})

test('normalize-query-options, source-data-spatial-reference: known spatial reference', t => {
  t.plan(1)
  const spatialRef = normalizeSourceDataSpatialReference(3857)
  t.equal(spatialRef, 'EPSG:3857')
})

test('normalize-query-options, source-data-spatial-reference: wkt spatial reference', t => {
  t.plan(1)
  const spatialRef = normalizeSourceDataSpatialReference(2228)
  console.log(spatialRef)
  t.equal(spatialRef, 'PROJCS["NAD_1983_StatePlane_California_IV_FIPS_0404_Feet",GEOGCS["GCS_North_American_1983",DATUM["D_North_American_1983",SPHEROID["GRS_1980",6378137.0,298.257222101]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Lambert_Conformal_Conic"],PARAMETER["False_Easting",6561666.666666666],PARAMETER["False_Northing",1640416.666666667],PARAMETER["Central_Meridian",-119.0],PARAMETER["Standard_Parallel_1",36.0],PARAMETER["Standard_Parallel_2",37.25],PARAMETER["Latitude_Of_Origin",35.33333333333334],UNIT["Foot_US",0.3048006096012192]]')
})