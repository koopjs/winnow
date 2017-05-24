const test = require('tape')
const compose = require('../src/select/compose')

test('With a single string function', t => {
  const composed = compose(['round'], 'geometry')
  t.equal(composed, 'round(geometry)', 'composed correctly')
  t.end()
})

test('With multiple string functions', t => {
  const composed = compose(['round', 'flatten'], 'geometry')
  t.equal(composed, 'flatten(round(geometry))', 'composed correctly')
  t.end()
})

test('With a single object function', t => {
  const composed = compose([{ name: 'round', options: 3 }], 'geometry')
  t.equal(composed, 'round(geometry,3)', 'composed correctly')
  t.end()
})

test('With multiple object functions', t => {
  const composed = compose([{ name: 'round', options: 3 }, { name: 'flatten', options: 4 }], 'geometry')
  t.equal(composed, 'flatten(round(geometry,3),4)', 'composed correctly')
  t.end()
})

test('With a string and an object function', t => {
  const composed = compose([{ name: 'round', options: 3 }, 'flatten'], 'geometry')
  t.equal(composed, 'flatten(round(geometry,3))', 'composed correctly')
  t.end()
})
