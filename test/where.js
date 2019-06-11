'use strict'
const test = require('tape')
const where = require('../src/where')

test('Transform a simple equality predicate', t => {
  t.plan(1)
  const options = {
    where: `foo='bar'`
  }
  const whereFragment = where.createClause(options)
  t.equals(whereFragment, `properties->\`foo\` = 'bar'`)
})

test('Transform a simple but inverse predicate', t => {
  t.plan(1)
  const options = {
    where: `'bar'=foo`
  }
  const whereFragment = where.createClause(options)
  t.equals(whereFragment, `'bar' = properties->\`foo\``)
})

test('Transform a simple predicate', t => {
  t.plan(1)
  const options = {
    where: `'bar'=foo`
  }
  const whereFragment = where.createClause(options)
  t.equals(whereFragment, `'bar' = properties->\`foo\``)
})
