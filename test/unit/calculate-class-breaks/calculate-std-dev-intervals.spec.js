const test = require('tape')
const calculateStdDevIntervals = require('../../../lib/calculate-class-breaks/calculate-std-dev-intervals')

test('calculateStdDevIntervals: missing std dev interval', spec => {
  try {
    calculateStdDevIntervals([], {})
    spec.fail('should have thrown error')
  } catch (error) {
    spec.equals(error.message, 'must supply a standard deviation interval')
  }
  spec.end()
})

test('calculateStdDevIntervals: invalid std dev interval', spec => {
  try {
    calculateStdDevIntervals([], { stddev_intv: 999 })
    spec.fail('should have thrown error')
  } catch (error) {
    spec.equals(error.message, 'Unacceptable interval value: 999')
  }
  spec.end()
})

test('calculateStdDevIntervals: invalid std dev interval', spec => {
  const result = calculateStdDevIntervals([5, 6, 7, 6, 9, 2, 12, 15, 8, 40], { stddev_intv: 0.33 })
  spec.deepEquals(result, [5.866775, 16.133225])
  spec.end()
})
