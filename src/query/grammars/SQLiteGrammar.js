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
