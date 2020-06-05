import BaseBuilder from 'crane-query-builder/src/Builder'

/**
 * @mixin
 */
class Builder extends BaseBuilder {
  constructor () {
    super();

    this.orders = [];
    this.unionOrders = [];
    this.groups = [];
    this.havings = [];
    this.unions = [];
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
