import Builder from "../Builder";

export default class Processor {
    /**
     * Process the results of a "select" query.
     *
     * @param  {Builder}  query
     * @param  {Array}  results
     * @return array
     */
    processSelect(query: Builder, results: any[]): any[];
    /**
     * Process an  "insert get ID" query.
     *
     * @param  {Builder}  query
     * @param  {String}  sql
     * @param  {Array}   values
     * @param  {String|null}  sequence
     * @return {Number|String}
     */
    processInsertGetId(query: Builder, sql: string, values: any[], sequence?: string | null): number | string;
    /**
     * Process the results of a column listing query.
     *
     * @param  {Array}  results
     * @return array
     */
    processColumnListing(results: any[]): any[];
}
