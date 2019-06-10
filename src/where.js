const _ = require('lodash')
const Parser = require('flora-sql-parser').Parser
const parser = new Parser()

/**
 * Convert an expression node to its string representation.
 * @param  {object} node    AST expression node
 * @param  {object} options winnow options
 * @return {string}         expression string
 */
function handleExpr (node, options) {
  let expr

  if (node.type === 'unary_expr') {
    expr = `${node.operator} ${traverse(node.expr, options)}`
  } else if (node.operator === '=' && node.left.value === 1 && node.right.value === 1) {
    // a special case related to arcgis server
    return '1=1'
  } else if (node.operator === 'BETWEEN') {
    expr = traverse(node.left, options) + ' ' + (node.operator) + ' ' + (traverse(node.right.value[0], options)) + 'AND' + (traverse(node.right.value[1], options))
  } else {
    // store the column node for value decoding

    if (node.left.type === 'column_ref') {
      node.right.columnNode = node.left
    }

    if (node.right.type === 'column_ref') {
      node.left.columnNode = node.right
    }

    expr = `${traverse(node.left, options)} ${node.operator} ${traverse(node.right, options)}`
  }

  if (node.parentheses) {
    expr = `(${expr})`
  }

  return expr
}

/**
 * Convert an expression list node to its string representation.
 * @param  {object} node    AST expression list node
 * @param  {object} options winnow options
 * @return {string}         expression list string
 */
function handleExprList (node, options) {
  const values = node.value.map((valueNode) => traverse(valueNode, options)).join(',')
  return `(${values})`
}

/**
 * Convert a function node to its string representation.
 * @param  {object} node    AST function node
 * @param  {object} options winnow options
 * @return {string}         function string
 */
function handleFunction (node, options) {
  const args = handleExprList(node.args, options)
  return `${node.name}${args}`
}

/**
 * Convert a column node to its string representation.
 * @param  {object} node    AST column node
 * @param  {object} options winnow options
 * @return {string}         column string
 */
function handleColumn (node, options) {
  return options.esri ? `attributes->\`${node.column}\`` : `properties->\`${node.column}\``
}

/**
 * Convert a value node to its string representation.
 *
 * If the value node has a reference to its column and this column is an encoded
 * field, this function will try to decode the value.
 *
 * @param  {object} node    AST value node
 * @param  {object} options winnow options
 * @return {string}         value string
 */
function handleValue (node, options) {
  let value = node.value

  if (node.columnNode) {
    const field = _.find(options.esriFields, { name: node.columnNode.column })

    if (_.has(field, 'domain.codedValues')) {
      const actual = _.find(field.domain.codedValues, { code: value })

      if (actual) {
        value = actual.name
      }
    }
  }

  if (typeof value === 'string') {
    value = `'${value}'`
  }

  return value
}

/**
 * Convert a timestamp node to its iso8601 string representation.
 *
 * @param  {object} node    AST value node
 * @param  {object} options winnow options
 * @return {string}         value string
 */
function handleTimestampValue (node, options) {
  return `'${new Date(node.value).toISOString()}'`
}

/**
 * Traverse a SQL AST and return its string representation
 * @param  {object} node    AST node
 * @param  {object} options winnow options
 * @return {string}         AST string
 */
function traverse (node, options) {
  if (!node) {
    return ''
  }

  switch (node.type) {
    case 'unary_expr':
    case 'binary_expr':
      return handleExpr(node, options)
    case 'function':
      return handleFunction(node, options)
    case 'expr_list':
      return handleExprList(node, options)
    case 'column_ref':
      return handleColumn(node, options)
    case 'string':
    case 'number':
    case 'null':
    case 'bool':
      return handleValue(node, options)
    case 'timestamp':
      return handleTimestampValue(node, options)
    default:
      throw new Error('Unrecognized AST node: \n' + JSON.stringify(node, null, 2))
  }
}

/**
 * Creates a viable SQL where clause from a passed in SQL (from a url "where" param)
 * @param  {string} options winnow options
 * @return {string}         SQL where clause
 */
function createClause (options) {
  options = options || {}
  if (!options.where) return ''

  // AST parsing requires a complete SQL.
  const whereTree = parser.parse('SELECT * WHERE ' + options.where).where
  let whereTransform = traverse(whereTree, options)
  return translateObjectIdFragments(whereTransform, options)
}

/**
 * If the WHERE contains fragments with OBJECTID, but the data doesn't containg an OBJECTID field,
 * and no substituation is made with the "idField" property, we must replace these WHERE fragments
 * with use a user-defined function that will calculate the OBJECTID on the fly, do the apropriate
 * comparison, and return the resulting boolean value
 * @param {string} input
 * @param {object} options
 */
function translateObjectIdFragments (input, options = {}) {
  let where = input
  const { idField } = options

  // Check if OBJECTID is one of the GeoJSON properties
  const metadataObjectIdField = _.get(options, 'collection.metadata.fields', []).find(field => { return field.name === 'OBJECTID' })

  if (where.includes('OBJECTID') && !idField && !metadataObjectIdField) {
    // RegExp for name-first predicate, e.g "properties->`OBJECTID` = 1234"
    const regexOid1st = /(properties|attributes)->`OBJECTID` (=|<|>|<=|>=) ([0-9]+)/g

    // RegExp for value-first predicate, e.g "1234 = properties->`OBJECTID`""
    const regexOid2nd = /([0-9]+) (=|<|>|<=|>=) (properties|attributes)->`OBJECTID`/g

    // Find matches for either pattern
    const match1sts = where.match(regexOid1st) || []
    const match2nds = where.match(regexOid2nd) || []

    // Replace each match with a fragment that compares the boolean result of user-defined function to 'true'
    match1sts.forEach(match => {
      const result = regexOid1st.exec(where)
      where = where.replace(match, `hashedObjectIdComparator(properties, geometry, ${result[2]}, '${result[1]}')=true`)
    })

    // Replace each match with a fragment that compares the boolean result of user-defined function to 'true'
    // Since the predicate is reversed we need to invert the predicate operator to use same user-defined function
    match2nds.forEach(match => {
      const result = regexOid2nd.exec(where)
      const operator = invertOperator(result[2])
      where = where.replace(match, `hashedObjectIdComparator(properties, geometry, ${result[1]}, '${operator}')=true`)
    })
  }
  return where
}

/**
 * Invert a logical operator
 * @param {*} operator
 */
function invertOperator (operator) {
  if (operator === '=') return '='
  else if (operator === '>') return '<'
  else if (operator === '>=') return '<='
  else if (operator === '<') return '>'
  else if (operator === '<=') return '>='
}

module.exports = { createClause }
