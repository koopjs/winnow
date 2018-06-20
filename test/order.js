'use strict'
const test = require('tape')
const winnow = require('../src')
const features = require('./fixtures/trees.json').features

test('Order by a single field', t => {
  t.plan(1)
  const options = {
    order: ['Trunk_Diameter asc'],
    limit: 2
  }
  const filtered = winnow.query(features, options)
  t.equal((filtered[0].properties.Trunk_Diameter <= filtered[1].properties.Trunk_Diameter), true)
})
