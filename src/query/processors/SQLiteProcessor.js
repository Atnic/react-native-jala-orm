import _ from 'lodash'
import Processor from './Processor'

class SQLiteProcessor extends Processor {
  /**
   * Process the results of a column listing query.
   *
   * @param  {Array}  results
   * @return array
   */
  processColumnListing(results)
  {
    return _.map(results, (result) => {
      return result.name;
    }, results);
  }
}

export { SQLiteProcessor }
export default SQLiteProcessor
