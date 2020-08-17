/**
 * Normalize the limit option; defaults to undefined
 * @param {object} options
 * @returns {integer} or undefined
 */
function normalizeLimit (options) {
  const limit = options.limit || options.resultRecordCount || options.count || options.maxFeatures

  if (limit !== undefined && !Number.isInteger(limit)) {
    console.warn('"limit" option is not an integer; skipping')
    return
  }
  // If there is a limit, add 1 to it so we can later calculate a limitExceeded. The result set will be resized accordingly, post SQL
  return limit ? limit + 1 : undefined
}

module.exports = normalizeLimit
