import BaseBuilder from 'crane-query-builder/src/Builder'
import { objectKey } from 'crane-query-builder/src/Utilities'
import { isBoolean, isFunction, isString } from 'crane-query-builder/src/DataType'
import { Expression } from './Expression'

/**
 * @mixin
 */
class Builder extends BaseBuilder {
  constructor () {
    super();

    this.distinct = false;
    this.orders = [];
    this.unionOrders = [];
    this.groups = [];
    this.havings = [];
  }

  /**
   * Add a new "raw" select expression to the query.
   *
   * @param expression
   * @param bindings
   * @returns {Builder}
   */
  selectRaw (expression, bindings = []) {
    this.addSelect(new Expression(expression))
    if (bindings) {
      this.addBinding(bindings, 'select')
    }

    return this
  }

  /**
   * Add a new select column to the query.
   *
   * @param column
   * @returns {Builder}
   */
  addSelect (column) {
    const columns = Array.isArray(column) ? column : [...arguments]
    let as = null

    columns.forEach(column => {
      as = objectKey(column)
      if (isString(as) && (column instanceof Builder || isFunction(column))) {
        if (this.columns == null) {
          this.select(`${this.from}.*`)
        }
        this.selectSub(column, as)
      } else {
        this.columns = [...this.columns, column]
      }
    })

    return this
  }

  /**
   * Add a basic where clause to the query.
   *
   * @param column
   * @param operator
   * @param value
   * @param boolean
   * @returns {Builder|*}
   */
  where (column, operator = null, value = null, boolean = 'and') {
    if (Array.isArray(column)) {
      return this.addArrayOfWheres(column, boolean)
    }

    let [ checkedValue, checkedOperator ] = this.prepareValueAndOperator(
      value, operator, arguments.length === 2
    )

    if (isFunction(column)) {
      return this.whereNested(column, boolean)
    }

    if (Builder.invalidOperator(checkedOperator)) {
      checkedValue = checkedOperator
      checkedOperator = '='
    }

    if (isFunction(checkedValue)) {
      return this.whereSub(column, checkedOperator, checkedValue, boolean)
    }

    if (checkedValue == null) {
      return this.whereNull(column, boolean, checkedOperator !== '=')
    }

    let type = 'Basic'

    if (column.includes('->') && isBoolean(value)) {
      checkedValue = new Expression(value ? 'true' : 'false')
      if (isString(column)) {
        type = 'JsonBoolean'
      }
    }

    this.wheres = [
      ...this.wheres,
      {
        type, column, operator: checkedOperator, value: checkedValue, boolean
      }
    ]

    if (!(checkedValue instanceof Expression)) {
      this.addBinding(checkedValue, 'where')
    }

    return this
  }

  /**
   * Add a raw "order by" clause to the query.
   *
   * @param sql
   * @param bindings
   * @returns {Builder}
   */
  orderByRaw (sql, bindings = []) {
    const type = 'Raw'
    const orderType = this.unions ? 'unionOrders' : 'orders'

    this[orderType] = [...this[orderType], { type, sql }]

    this.addBinding(bindings, 'order')

    return this
  }

  /**
   * Prepare the value and operator for a where clause.
   *
   * @param  {String}  value
   * @param  {String}  operator
   * @param  {Boolean}  useDefault
   * @return {Array}
   *
   * @throws Error
   */
  prepareValueAndOperator(value, operator, useDefault = false)
  {
    if (useDefault) {
      return [operator, '='];
    } else if (Builder.invalidOperatorAndValue(operator, value)) {
      throw new Error('Illegal operator and value combination.');
    }

    return [value, operator];
  }

  /**
   * Create a raw database expression.
   *
   * @param value
   * @returns {*}
   */
  static raw (value) {
    return new Expression(value)
  }

  /**
   * Add a subselect expression to the query.
   *
   * @param query
   * @param as
   * @returns {Builder}
   */
  selectSub (query, as) {
    const [ checkedQuery, bindings ] = Builder.createSub(query)
    return this.selectRaw(
      `(${checkedQuery}) as ${this.grammar.wrap(as)}`, bindings
    )
  }

  /**
   * Force the query to only return distinct results.
   *
   * @returns {Builder}
   */
  setDistinct (): Builder {
    this.distinct = true;

    return this
  }

  /**
   * Get the database connection instance.
   *
   * @return {Connection}
   */
  getConnection()
  {
    return this.connection;
  }

  /**
   * Handle dynamic method calls into the method.
   *
   * @param  {String}  method
   * @param  {Array}   parameters
   * @return {*}
   *
   * @throws {Error}
   */
  __call(method, parameters)
  {
    // if (this.constructor.hasMacro(method)) {
    //   return this.macroCall(method, parameters);
    // }

    // if (_.startsWith(method, 'where')) {
    //   return this._dynamicWhere(method, parameters);
    // }

    // this.constructor.throwBadMethodCallException(method);
  }
}

/**
 * @class
 * @mixes Builder
 * @mixin
 */
const QueryBuilder = Builder

export { Builder, QueryBuilder }
export default Builder
