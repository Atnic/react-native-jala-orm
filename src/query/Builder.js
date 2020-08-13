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
   * Set the columns to be selected.
   *
   * @param columns
   * @returns {Builder}
   */
  select (columns = ['*']) {
    this.columns = columns instanceof Array ? columns : [...arguments];

    return this
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
   * Creates a subquery and parse it.
   *
   * @param query
   * @returns {[*, *]|[*, []]}
   */
  static createSub (query) {
    if (isFunction(query)) {
      const callback = query
      callback(query = this.forSubQuery())
    }

    return this.parseSub(query)
  }

  /**
   * Add a new select column to the query.
   *
   * @param column
   * @returns {Builder}
   */
  addSelect (column) {
    const columns = Array.isArray(column) ? column : [...arguments]

    this.columns = [...this.columns, ...columns]

    return this
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
   * Prepare the value and operator for a where clause.
   *
   * @param  {String}  value
   * @param  {String}  operator
   * @param  {Boolean}  useDefault
   * @return {Array}
   *
   * @throws Error
   */
  prepareValueAndOperator(value, operator, useDefault = false) {
    if (useDefault) {
      return [operator, '='];
    } else if (Builder.invalidOperatorAndValue(operator, value)) {
      throw new Error('Illegal operator and value combination.');
    }

    return [value, operator];
  }

  /**
   * Add an exists clause to the query.
   *
   * @param  {Function} callback
   * @param  {String}   boolean
   * @param  {Boolean}     not
   * @return this
   */
  whereExists(callback: Function, boolean = 'and', not = false) {
    const query = this.constructor.forSubQuery();

    // Similar to the sub-select clause, we will create a new query instance so
    // the developer may cleanly specify the entire exists query and we will
    // compile the whole thing in the grammar and insert it into the SQL.
    callback(query);

    return this.addWhereExistsQuery(query, boolean, not);
  }

  /**
   * Add an or exists clause to the query.
   *
   * @param  {Function} callback
   * @param  {Boolean}     not
   * @return {Builder}
   */
  orWhereExists(callback: Function, not = false)
  {
    return this.whereExists(callback, 'or', not);
  }

  /**
   * Add a where not exists clause to the query.
   *
   * @param  {Function} callback
   * @param  {String}   boolean
   * @return {Builder}
   */
  whereNotExists(callback: Function, boolean = 'and')
  {
    return this.whereExists(callback, boolean, true);
  }

  /**
   * Add a where not exists clause to the query.
   *
   * @param  {Function}  callback
   * @return {Builder}
   */
  orWhereNotExists(callback: Function)
  {
    return this.orWhereExists(callback, true);
  }

  /**
   * Add an exists clause to the query.
   *
   * @param  {Builder} query
   * @param  {String}  boolean
   * @param  {Boolean}  not
   * @return this
   */
  addWhereExistsQuery(query, boolean = 'and', not = false)
  {
    const type = not ? 'NotExists' : 'Exists';

    this.wheres = [...this.wheres, { type, query, boolean }];

    this.addBinding(query.getBindings(), 'where');

    return this;
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
   * Get a new instance of the query builder.
   *
   * @returns {Builder}
   */
  static newQuery () {
    return new this()
  }

  /**
   * Create a new query instance for a sub-query.
   *
   * @returns {Builder}
   */
  static forSubQuery () {
    return this.newQuery()
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
   * Get the database connection instance.
   *
   * @return {Connection}
   */
  getConnection() {
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
  __call(method, parameters) {
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
