import _ from 'lodash'
import Builder from '../model/Builder'
import Model from '../model/Model'

/**
 * BuildsQueries Trait
 * @constructor
 * @mixin
 */
const BuildsQueries = function () {
  /**
   * Chunk the results of the query.
   *
   * @param  {Number}  count
   * @param  {Function}  callback
   * @return {Boolean}
   */
  this.chunk = function(count, callback)
  {
    this._enforceOrderBy();

    let page = 1;
    let countResults = 0;

    do {
      // We'll execute the query for the given page and get the results. If there are
      // no results we can just break and return from here. When there are results
      // we will call the callback with the current chunk of these results here.
      let results = this.forPage(page, count).get();

      countResults = results.length;

      if (countResults === 0) {
        break;
      }

      // On each chunk result set, we will pass them to the callback and then let the
      // developer take care of everything within the callback, which allows us to
      // keep the memory low for spinning through large result sets for working.
      if (callback(results, page) === false) {
        return false;
      }

      results = undefined;

      page++;
    } while (countResults === count);

    return true;
  }

  /**
   * Execute a callback over each item while chunking.
   *
   * @param  {Function}  callback
   * @param  {Number}  count
   * @return {Boolean}
   */
  this.each = function(callback, count = 1000)
  {
    return this.chunk(count, function (results) {
      for (let i = 0; i < results.count(); i++) {
        if (callback(results[i], i) === false)
          return false;
      }
    });
  }

  /**
   * Execute the query and get the first result.
   *
   * @param  {Array}  columns
   * @return {Model|Object|null}
   */
  this.first = async function (columns = ['*'])
  {
    return _.first((await this.take(1).get(columns)));
  }

  /**
   * Apply the callback's query changes if the given "value" is true.
   *
   * @param  {*}  value
   * @param  {Function}  callback
   * @param  {Function|null}  def
   * @return {*|Builder}
   */
  this.when = function(value, callback, def = null)
  {
    if (value) {
      return callback(this, value) || this;
    } else if (def) {
      return def(this, value) || this;
    }

    return this;
  }

  /**
   * Pass the query to a given callback.
   *
   * @param  {Function}  callback
   * @return \Illuminate\Database\Query\Builder
   */
  this.tap = function(callback)
  {
    return this.when(true, callback);
  }

  /**
   * Apply the callback's query changes if the given "value" is false.
   *
   * @param  {*}  value
   * @param  {Function}  callback
   * @param  {Function|null}  def
   * @return {*|Builder}
   */
  this.unless = function(value, callback, def = null)
  {
    if (! value) {
      return callback(this, value) || this;
    } else if (def) {
      return def(this, value) || this;
    }

    return this;
  }

  /**
   * Create a new length-aware paginator instance.
   *
   * @param  {Array}  items
   * @param  {Number}  total
   * @param  {Number}  perPage
   * @param  {Number}  currentPage
   * @param  {Array}  options
   * @return \Illuminate\Pagination\LengthAwarePaginator
   */
  this._paginator = function(items, total, perPage, currentPage, options)
  {
    return Container.getInstance().makeWith(LengthAwarePaginator.name, {
      items, total, perPage, currentPage, options
    });
  }

  /**
   * Create a new simple paginator instance.
   *
   * @param  {Array}  items
   * @param  {Number} perPage
   * @param  {Number} currentPage
   * @param  {Array}  options
   * @return \Illuminate\Pagination\Paginator
   */
  this._simplePaginator = function(items, perPage, currentPage, options)
  {
    return Container.getInstance().makeWith(Paginator.name, {
      items, perPage, currentPage, options
    });
  }
}

export { BuildsQueries }
export default BuildsQueries
