import _ from 'lodash'
import Expression from './query/Expression'

export default class Grammar {
  /**
   * The grammar table prefix.
   *
   * @var {String}
   */
  _tablePrefix = '';

  /**
   * Wrap an array of values.
   *
   * @param  {Array}  values
   * @return {Array}
   */
  wrapArray(values)
  {
    return _.map(values, this.wrap);
  }

  /**
   * Wrap a table in keyword identifiers.
   *
   * @param  {Expression|String}  table
   * @return {String}
   */
  wrapTable(table)
  {
    if (! this.isExpression(table)) {
    return this.wrap(this._tablePrefix + table, true);
  }

    return this.getValue(table);
  }

  /**
   * Wrap a value in keyword identifiers.
   *
   * @param  {Expression|String}  value
   * @param  {Boolean}    prefixAlias
   * @return {String}
   */
  wrap(value, prefixAlias = false)
  {
    if (this.isExpression(value)) {
      return this.getValue(value);
    }

    // If the value being wrapped has a column alias we will need to separate out
    // the pieces so we can wrap each of the segments of the expression on its
    // own, and then join these both back together using the "as" connector.
    if (_.includes(value, ' as ') !== false) {
      return this.wrapAliasedValue(value, prefixAlias);
    }

    return this.wrapSegments(value.split('.'));
  }

  /**
   * Wrap a value that has an alias.
   *
   * @param  {String}  value
   * @param  {Boolean}  prefixAlias
   * @return {String}
   */
  _wrapAliasedValue(value, prefixAlias = false)
  {
    let segments = value.split(/\s+as\s+/i);

    // If we are wrapping a table we need to prefix the alias with the table prefix
    // as well in order to generate proper syntax. If this is a column of course
    // no prefix is necessary. The condition will be true when from wrapTable.
    if (prefixAlias) {
      segments[1] = this._tablePrefix + segments[1];
    }

    return this.wrap(segments[0]) + ' as ' + this._wrapValue(segments[1]);
  }

  /**
   * Wrap the given value segments.
   *
   * @param  {Array}  segments
   * @return {String}
   */
  _wrapSegments(segments)
  {
    return _.map(segments, (segment, key) => {
      return key === 0 && segments.length > 1
        ? this.wrapTable(segment)
        : this._wrapValue(segment);
    }).join('.');
  }

  /**
   * Wrap a single string in keyword identifiers.
   *
   * @param  {String}  value
   * @return {String}
   */
  _wrapValue(value)
  {
    if (value !== '*') {
      return '"' + value.replace(/"/i, '""') + '"';
    }

    return value;
  }

  /**
   * Convert an array of column names into a delimited string.
   *
   * @param  {Array}   columns
   * @return {String}
   */
  columnize(columns)
  {
    return columns.map(columns, this.wrap).join(', ');
  }

  /**
   * Create query parameter place-holders for an array.
   *
   * @param  {Array}   values
   * @return {String}
   */
  parameterize(values)
  {
    return values.map(values, this.parameter).join(', ');
  }

  /**
   * Get the appropriate query parameter place-holder for a value.
   *
   * @param  {*}   value
   * @return {String}
   */
  parameter(value)
  {
    return this.isExpression(value) ? this.getValue(value) : '?';
  }

  /**
   * Quote the given string literal.
   *
   * @param  {String|Array}  value
   * @return {String}
   */
  quoteString(value)
  {
    if (value instanceof Array) {
      return value.map(value, this.quoteString).join(', ');
    }

    return "'value'";
  }

  /**
   * Determine if the given value is a raw expression.
   *
   * @param  {*}  value
   * @return {Boolean}
   */
  isExpression(value)
  {
    return value instanceof Expression;
  }

  /**
   * Get the value of a raw expression.
   *
   * @param  {Expression}  expression
   * @return {String}
   */
  getValue(expression)
  {
    return expression.getValue();
  }

  /**
   * Get the format for database stored dates.
   *
   * @return {String}
   */
  getDateFormat()
  {
    return 'Y-m-d H:i:s';
  }

  /**
   * Get the grammar's table prefix.
   *
   * @return {String}
   */
  getTablePrefix()
  {
    return this._tablePrefix;
  }

  /**
   * Set the grammar's table prefix.
   *
   * @param  {String}  prefix
   * @return {Grammar}
   */
  setTablePrefix(prefix)
  {
    this._tablePrefix = prefix;

    return this;
  }
}
