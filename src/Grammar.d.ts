import Expression from "./query/Expression";

export default class Grammar {
    /**
     * The grammar table prefix.
     *
     * @var {String}
     */
    _tablePrefix: string;
    /**
     * Wrap an array of values.
     *
     * @param  {Array}  values
     * @return {Array}
     */
    wrapArray(values: any[]): any[];
    /**
     * Wrap a table in keyword identifiers.
     *
     * @param  {Expression|String}  table
     * @return {String}
     */
    wrapTable(table: Expression | string): string;
    /**
     * Wrap a value in keyword identifiers.
     *
     * @param  {Expression|String}  value
     * @param  {Boolean}    prefixAlias
     * @return {String}
     */
    wrap(value: Expression | string, prefixAlias?: boolean): string;
    /**
     * Wrap a value that has an alias.
     *
     * @param  {String}  value
     * @param  {Boolean}  prefixAlias
     * @return {String}
     */
    _wrapAliasedValue(value: string, prefixAlias?: boolean): string;
    /**
     * Wrap the given value segments.
     *
     * @param  {Array}  segments
     * @return {String}
     */
    _wrapSegments(segments: any[]): string;
    /**
     * Wrap a single string in keyword identifiers.
     *
     * @param  {String}  value
     * @return {String}
     */
    _wrapValue(value: string): string;
    /**
     * Convert an array of column names into a delimited string.
     *
     * @param  {Array}   columns
     * @return {String}
     */
    columnize(columns: any[]): string;
    /**
     * Create query parameter place-holders for an array.
     *
     * @param  {Array}   values
     * @return {String}
     */
    parameterize(values: any[]): string;
    /**
     * Get the appropriate query parameter place-holder for a value.
     *
     * @param  {*}   value
     * @return {String}
     */
    parameter(value: any): string;
    /**
     * Quote the given string literal.
     *
     * @param  {String|Array}  value
     * @return {String}
     */
    quoteString(value: string | any[]): string;
    /**
     * Determine if the given value is a raw expression.
     *
     * @param  {*}  value
     * @return {Boolean}
     */
    isExpression(value: any): boolean;
    /**
     * Get the value of a raw expression.
     *
     * @param  {Expression}  expression
     * @return {String}
     */
    getValue(expression: Expression): string;
    /**
     * Get the format for database stored dates.
     *
     * @return {String}
     */
    getDateFormat(): string;
    /**
     * Get the grammar's table prefix.
     *
     * @return {String}
     */
    getTablePrefix(): string;
    /**
     * Set the grammar's table prefix.
     *
     * @param  {String}  prefix
     * @return {Grammar}
     */
    setTablePrefix(prefix: string): Grammar;
}
