import BaseBuilder from "./BaseBuilder";
import Connection from "../Connection";

/**
 * @mixin
 */
export default class Builder extends BaseBuilder {
    // @ts-ignore
    distinct: boolean;
    orders: any[];
    unionOrders: any[];
    groups: any[];
    havings: any[];

    /**
     * Force the query to only return distinct results.
     *
     * @returns {Builder}
     */
    setDistinct(): Builder;
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
    prepareValueAndOperator(value: string, operator: string, useDefault?: boolean): any[];
    /**
     * Add an exists clause to the query.
     *
     * @param  {Function} callback
     * @param  {String}   boolean
     * @param  {Boolean}     not
     * @return this
     */
    whereExists(callback: Function, boolean?: string, not?: boolean): Builder;
    /**
     * Add an or exists clause to the query.
     *
     * @param  {Function} callback
     * @param  {Boolean}     not
     * @return {Builder}
     */
    orWhereExists(callback: Function, not?: boolean): Builder;
    /**
     * Add a where not exists clause to the query.
     *
     * @param  {Function} callback
     * @param  {String}   boolean
     * @return {Builder}
     */
    whereNotExists(callback: Function, boolean?: string): Builder;
    /**
     * Add a where not exists clause to the query.
     *
     * @param  {Function}  callback
     * @return {Builder}
     */
    orWhereNotExists(callback: Function): Builder;
    /**
     * Add an exists clause to the query.
     *
     * @param  {Builder} query
     * @param  {String}  boolean
     * @param  {Boolean}  not
     * @return this
     */
    addWhereExistsQuery(query: Builder, boolean?: string, not?: boolean): Builder;
    /**
     * Get the database connection instance.
     *
     * @return {Connection}
     */
    getConnection(): Connection;
    /**
     * Handle dynamic method calls into the method.
     *
     * @param  {String}  method
     * @param  {Array}   parameters
     * @return {*}
     *
     * @throws {Error}
     */
    __call(method: string, parameters: any[]): any;
}

/**
 * @class
 * @mixes Builder
 * @mixin
 */
export type QueryBuilder = Builder;
