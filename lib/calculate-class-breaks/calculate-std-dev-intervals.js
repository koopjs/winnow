const ss = require('simple-statistics')

function calculateStdDevIntervals (values, classification) {
  if (!classification.stddev_intv) throw new Error('must supply a standard deviation interval')
  const intv = classification.stddev_intv
  if (intv !== 0.25 && intv !== 0.33 && intv !== 0.5 && intv !== 1) throw new Error('Unacceptable interval value: ' + intv)

  const mean = ss.mean(values)
  const stddev = ss.standardDeviation(values)
  const breakCount = classification.breakCount
  const intervals = []

  // create interval around mean
  const minMeanInt = Number((mean - (0.5 * stddev)).toFixed(6))
  const maxMeanInt = Number((mean + (0.5 * stddev)).toFixed(6))
  intervals.unshift(minMeanInt)
  intervals.push(maxMeanInt)

  // create positive & negative stddev intervals
  let maxPosStd, minNegStd
  for (let i = 1; i <= breakCount; i++) {
    minNegStd = Number((minMeanInt - (i * stddev)).toFixed(6))
    maxPosStd = Number((maxMeanInt + (i * stddev)).toFixed(6))
    intervals.unshift(minNegStd)
    intervals.push(maxPosStd)
  }
  return intervals
}

module.exports = calculateStdDevIntervals
