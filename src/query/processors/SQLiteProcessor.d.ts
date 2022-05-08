import Processor from "./Processor";

export default class SQLiteProcessor extends Processor {
    /**
     * Process the results of a column listing query.
     *
     * @param  {Array}  results
     * @return array
     */
    processColumnListing(results: any[]): any;
}
