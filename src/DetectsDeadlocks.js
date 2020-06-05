import _ from 'lodash'

/**
 * DetectsDeadlocks Trait
 *
 * @constructor
 * @mixin
 */
const DetectsDeadlocks = function () {
  /**
   * Determine if the given exception was caused by a deadlock.
   *
   * @param  {Exception}  e
   * @return bool
   */
  this._causedByDeadlock = function (e)
  {
    let message = e.getMessage();

    return _.contains(message, [
      'Deadlock found when trying to get lock',
      'deadlock detected',
      'The database file is locked',
      'database is locked',
      'database table is locked',
      'A table in the database is locked',
      'has been chosen as the deadlock victim',
      'Lock wait timeout exceeded; try restarting transaction',
      'WSREP detected deadlock/conflict and aborted the transaction. Try restarting the transaction',
    ]);
  }
}

export { DetectsDeadlocks }
export default DetectsDeadlocks
