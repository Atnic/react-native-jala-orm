import Grammar from "./Grammar";

export default class SQLiteGrammar {
    tablePrefix: string;

    /**
     * Get the format for database stored dates.
     *
     * @return {String}
     */
    getDateFormat(): string;
    /**
     *
     * @param query
     * @param where
     * @returns {string}
     */
    whereIn(query: any, where: any): string;
    /**
     *
     * @param query
     * @param where
     * @returns {string}
     */
    whereNotIn(query: any, where: any): string;
    /**
     *
     * @param query
     * @param where
     * @returns {string}
     */
    whereNotInRaw(query: any, where: any): string;
    /**
     *
     * @param query
     * @param where
     * @returns {string}
     */
    whereInRaw(query: any, where: any): string;
    /**
     *
     * @param query
     * @param offset
     * @returns {string}
     */
    compileOffset(query: any, offset: any): string;
    /**
     *
     * @param query
     * @param orders
     * @returns {string}
     */
    compileOrders(query: any, orders: any): string;
    /**
     *
     * @param query
     * @returns {string|*}
     */
    compileDelete(query: any): string | any;
    /**
     * Set the grammar's table prefix.
     *
     * @param  {String}  prefix
     * @return {Grammar}
     */
    setTablePrefix(prefix: string): Grammar;
}
