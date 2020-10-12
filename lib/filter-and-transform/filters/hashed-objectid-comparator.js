const createIntHash = require('../helpers/create-integer-hash')

module.exports = function (properties, geometry, objectId, operator) {
  const hash = createIntHash(JSON.stringify({ properties, geometry }))
  if (operator === '=' && hash === objectId) return true
  else if (operator === '>' && hash > objectId) return true
  else if (operator === '<' && hash < objectId) return true
  else if (operator === '>=' && hash >= objectId) return true
  else if (operator === '<=' && hash <= objectId) return true
  return false
}
