module.exports = function (functions, target) {
  return functions.reduce((composed, fx) => {
    const method = typeof fx === 'string' ? fx : fx.name
    return fx.options ? `${method}(${composed},${fx.options})` : `${method}(${composed})`
  }, target)
}
