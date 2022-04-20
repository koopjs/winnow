const _ = require('lodash')
const { parseFirst, toSql } = require('pgsql-ast-parser')
const operatorInversions = {
  '=': '=',
  '>=': '<',
  '>': '<=',
  '<=': '>',
  '<': '>='
}
// RegExp for name-first predicate, e.g "properties->`OBJECTID` = 1234"
const fieldFirstObjectIdPredicateRegex = /(properties|attributes)->`OBJECTID` (=|<|>|<=|>=) ([0-9]+)/g

// RegExp for value-first predicate, e.g "1234 = properties->`OBJECTID`""
const valueFirstObjectIdPredicateRegex = /([0-9]+) (=|<|>|<=|>=) (properties|attributes)->`OBJECTID`/g

/**
 * Convert an expression node to its string representation.
 * @param  {object} node    AST expression node
 * @param  {object} options winnow options
 * @return {string}         expression string
 */
function handleExpression (node, options) {
  let expr

  if (node.op === '=' && node.left.value === 1 && node.right.value === 1) {
    // a special case related to arcgis server
    return '1=1'
  } else if (node.op === 'BETWEEN') {
    expr = traverse(node.value, options) + ' ' + (node.op) + ' ' + (traverse(node.lo, options)) + 'AND' + (traverse(node.hi, options))
  } else if (node.op === 'IS NULL' || node.op === 'IS NOT NULL') {
    // a special case of unary expressions that the operator needs to be the right side
    expr = `${traverse(node.operand, options)} ${node.op}`
  } else if (node.type === 'unary') {
    expr = `${node.op} ${traverse(node.operand, options)}`
  } else {
    // store the column name for value decoding
    if (node.left.type === 'ref') {
      node.right.columnName = node.left.name
    }

    if (node.right.type === 'ref') {
      node.left.columnName = node.right.name
    }

    expr = `${traverse(node.left, options)} ${node.op} ${traverse(node.right, options)}`
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
function handleExpressionList (list, options) {
  const values = list.map((valueNode) => traverse(valueNode, options)).join(',')
  return `(${values})`
}

/**
 * Convert a function node to its string representation.
 * @param  {object} node    AST function node
 * @param  {object} options winnow options
 * @return {string}         function string
 */
function handleFunction (node, options) {
  const args = handleExpressionList(node.args, options)
  return `${node.function.name}${args}`
}

/**
 * Convert a column node to its string representation.
 * @param  {object} node    AST column node
 * @param  {object} config  traverse config
 * @return {string}         column string
 */
function handleColumn (node, config) {
  config.updateColumnSet(node.name)
  return config.esri ? `attributes->\`${node.name}\`` : `properties->\`${node.name}\``
}

/**
 * Convert a value node to its string representation.
 *
 * If the value node has a reference to its column and this column is an encoded
 * field, this function will try to decode the value.
 *
 * @param  {object} node    AST value node
 * @param  {object} config  traverse config
 * @return {string}         value string
 */
function handleValue (node, config) {
  let value = node.value

  if (node.columnName in config.codedValueMap) {
    value = config.codedValueMap[node.columnName][value]
  }

  if (typeof value === 'string') {
    // single quotes in the value will break alasql queries. They must be escaped with ''.
    value = `'${value.replace(/'/g, '\'\'')}'`
  }

  return value
}

function handleCast (node, options) {
  if (node.to.name === 'timestamp' && node.operand.type === 'string') {
    return `'${new Date(node.operand.value).toISOString()}'`
  }

  throw new Error(`Unsupported casting operation: ${toSql.cast(node)}`)
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
    case 'unary':
    case 'binary':
    case 'ternary':
      return handleExpression(node, options)
    case 'call':
      return handleFunction(node, options)
    case 'ref':
      return handleColumn(node, options)
    case 'list':
      return handleExpressionList(node.expressions, options)
    case 'string':
    case 'integer':
    case 'numeric':
    case 'null':
    case 'boolean':
      return handleValue(node, options)
    case 'cast':
      return handleCast(node, options)
    default:
      throw new Error('Unrecognized AST node: \n' + JSON.stringify(node, null, 2))
  }
}

function translateSqlWhere (options) {
  const { where, esriFields, esri } = options
  const whereTree = parseWhereToTree(where)
  const columnSet = new Set()

  let whereClause = traverse(whereTree, {
    esri,
    esriFields,
    updateColumnSet: (name) => columnSet.add(name),
    codedValueMap: getCodedValueMap(options.esriFields)
  })

  const columnMap = getColumnMap(columnSet, where)
  whereClause = replaceColumnNames(whereClause, columnMap)

  if (shouldReplaceObjectIdPredicates(options)) {
    whereClause = replaceObjectIdPredicates(whereClause)
  }

  console.log(whereClause)
  return whereClause
}

function parseWhereToTree (where) {
  const { where: whereTree } = parseFirst(`SELECT * WHERE ${where}`)
  return whereTree
}

/**
 * if the where clause includes OBJECTID predicate, but the dataset doesn't include an OBJECTID,
 * assume it is due to ArcGIS clients querying a Koop dataset that had no idField defined and thus created
 * and OBJECTID field on the fly from the hashed feature. As a result, the OBJECTID predicate must be
 * replaced by an inline function that (1) hashes the feature and (2) executes the comparison
 */
function shouldReplaceObjectIdPredicates ({ where, idField }) {
  return where.includes('OBJECTID') && !idField
}

function replaceObjectIdPredicates (where) {
  return where.replace(fieldFirstObjectIdPredicateRegex, 'hashedObjectIdComparator($1, geometry, $3, \'$2\')=true')
    .replace(valueFirstObjectIdPredicateRegex, (match, value, operator, parentProperty, offset, string) => {
      return `hashedObjectIdComparator(${parentProperty}, geometry, ${value}, '${operatorInversions[operator]}')=true`
    })
}

function getCodedValueMap (esriFields = []) {
  const map = {}
  const collectCodedValues = (map, value) => {
    map[value.code] = value.name
    return map
  }

  esriFields.forEach((field) => {
    if (_.get(field, 'domain.type') === 'codedValue') {
      map[field.name.toLowerCase()] = field.domain.codedValues.reduce(collectCodedValues, {})
    }
  })

  return map
}

function getColumnMap (pgColumns, originalStatement) {
  const lowered = originalStatement.toLowerCase()
  const map = {}

  pgColumns.forEach((column) => {
    const index = lowered.indexOf(column)

    if (index > -1) {
      map[column] = originalStatement.slice(index, index + column.length)
    }
  })

  return map
}

function replaceColumnNames (statement, columnMap) {
  Object.entries(columnMap).forEach(([key, value]) => {
    const regex = new RegExp(`\`${key}\``, 'g')
    statement = statement.replace(regex, `\`${value}\``)
  })

  return statement
}

module.exports = translateSqlWhere
