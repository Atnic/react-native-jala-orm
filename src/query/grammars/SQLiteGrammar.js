import _ from 'lodash'
import BaseSQLiteGrammar from 'crane-query-builder/src/SQLiteGrammar'

class SQLiteGrammar extends BaseSQLiteGrammar {
  /**
   * Get the format for database stored dates.
   *
   * @return {String}
   */
  getDateFormat()
  {
    return 'YYYY-MM-DD HH:mm:ss';
  }

  /**
   *
   * @param query
   * @param where
   * @returns {string}
   */
  whereIn (query, where) {
    if (where.values && where.values.length) {
      return `${this.wrap(where.column)} in (${this.parameterize(where.values)})`
    }

    return '0 = 1'
  }

  /**
   *
   * @param query
   * @param where
   * @returns {string}
   */
  whereNotIn (query, where) {
    if (where.values && where.values.length) {
      return `${this.wrap(where.column)} not in (${this.parameterize(where.values)})`
    }

    return '1 = 1'
  }

  /**
   *
   * @param query
   * @param where
   * @returns {string}
   */
  whereNotInRaw (query, where) {
    if (where.values && where.values.length) {
      return `${this.wrap(where.column)} not in (${where.values.join(', ')})`
    }

    return '1 = 1'
  }

  /**
   *
   * @param query
   * @param where
   * @returns {string}
   */
  whereInRaw (query, where) {
    if (where.values && where.values.length) {
      return `${this.wrap(where.column)} in (${where.values.join(', ')})`
    }

    return '0 = 1'
  }

  /**
   *
   * @param query
   * @param offset
   * @returns {string}
   */
  compileOffset (query, offset) {
    return `offset ${parseInt(offset)}`
  }

  /**
   *
   * @param query
   * @param orders
   * @returns {string}
   */
  compileOrders (query, orders) {
    if (orders.length) {
      return `order by ${this.compileOrdersToArray(query, orders).join(', ')}`
    }

    return ''
  }

  /**
   *
   * @param query
   * @returns {string|*}
   */
  compileDelete (query) {
    if (!_.isEmpty(query.joins) || !_.isEmpty(query.limit)) {
      return this.compileDeleteWithJoinsOrLimit(query)
    }
    return super.compileDelete(query)
  }

  /**
   * Set the grammar's table prefix.
   *
   * @param  {String}  prefix
   * @return {Grammar}
   */
  setTablePrefix(prefix)
  {
    this.tablePrefix = prefix;

    return this;
  }
}

export { SQLiteGrammar }
export default SQLiteGrammar
