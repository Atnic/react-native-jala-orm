import _ from 'lodash';
import Builder from '../Builder'

class Processor {
  /**
   * Process the results of a "select" query.
   *
   * @param  {Builder}  query
   * @param  {Array}  results
   * @return array
   */
  processSelect(query, results)
  {
    return results;
  }

  /**
   * Process an  "insert get ID" query.
   *
   * @param  {Builder}  query
   * @param  {String}  sql
   * @param  {Array}   values
   * @param  {String|null}  sequence
   * @return {Number|String}
   */
  processInsertGetId(query, sql, values, sequence = null)
  {
    query.getConnection().insert(sql, values);

    let id = query.getConnection().getPdo().lastInsertId(sequence);

    return _.isNumber(id) ? Number(id) : id;
  }

  /**
   * Process the results of a column listing query.
   *
   * @param  {Array}  results
   * @return array
   */
  processColumnListing(results)
  {
    return results;
  }
}

export { Processor }
export default Processor
