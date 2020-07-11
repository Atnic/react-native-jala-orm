import _ from 'lodash'

/**
 * ManagesTransactions Trait
 *
 * @constructor
 * @mixin
 */
const ManagesTransactions = function () {
  /**
   * Execute a Closure within a transaction.
   *
   * @param  {Function}  callback
   * @param  {Number}  attempts
   * @return {*}
   *
   * @throws {Error}
   */
  this.transaction = async function (callback, attempts = 1) {
    for (let currentAttempt = 1; currentAttempt <= attempts; currentAttempt++) {
      this.beginTransaction();

      // We'll simply execute the given callback within a try / catch block and if we
      // catch any exception we can rollback this transaction so that none of this
      // gets actually persisted to a database or stored in a permanent fashion.
      try {
        return _.tap(await callback(this), () => {
          this.commit();
        });
      }

        // If we catch an exception we'll rollback this transaction and try again if we
        // are not out of attempts. If we are out of attempts we will just throw the
        // exception back out and let the developer handle an uncaught exceptions.
      catch (e) {
        try {
          this._handleTransactionException(
            e, currentAttempt, attempts
          );
        } catch (e) {
          this.rollBack();

          throw e;
        }
      }
    }
  }

  /**
   * Handle an exception encountered when running a transacted statement.
   *
   * @param  {Error}  e
   * @param  {Number}  currentAttempt
   * @param  {Number}  maxAttempts
   * @return void
   *
   * @throws {Error}
   */
  this._handleTransactionException = function (e, currentAttempt, maxAttempts)
  {
    // On a deadlock, MySQL rolls back the entire transaction so we can't just
    // retry the query. We have to throw this exception all the way out and
    // let the developer handle it in another way. We will decrement too.
    if (this._causedByDeadlock(e) &&
      this._transactions > 1) {
    this._transactions--;

    throw e;
  }

    // If there was an exception we will rollback this transaction and then we
    // can check if we have exceeded the maximum attempt count for this and
    // if we haven't we will return and try this query again in our loop.
    this.rollBack();

    if (this._causedByDeadlock(e) &&
      currentAttempt < maxAttempts) {
      return;
    }

    throw e;
  }

  /**
   * Start a new database transaction.
   *
   * @return void
   *
   * @throws {Error}
   */
  this.beginTransaction = function ()
  {
    this._createTransaction();

    this._transactions++;

    this._fireConnectionEvent('beganTransaction');
  }

  /**
   * Create a transaction within the database.
   *
   * @return void
   */
  this._createTransaction = function ()
  {
    if (this._transactions === 0) {
      try {
        this.getPdo().beginTransaction();
      } catch (e) {
        this._handleBeginTransactionException(e);
      }
    } else if (this._transactions >= 1 && this._queryGrammar.supportsSavepoints()) {
    this._createSavepoint();
  }
  }

  /**
   * Create a save point within the database.
   *
   * @return void
   */
  this._createSavepoint = function ()
  {
    this.getPdo().exec(
      this._queryGrammar.compileSavepoint('trans' + (this._transactions + 1))
    );
  }

  /**
   * Handle an exception from a transaction beginning.
   *
   * @param  {Error}  e
   * @return void
   *
   * @throws {Error}
   */
  this._handleBeginTransactionException = function (e)
  {
    if (this._causedByLostConnection(e)) {
      this.reconnect();

      this._pdo.beginTransaction();
    } else {
      throw e;
    }
  }

  /**
   * Commit the active database transaction.
   *
   * @return void
   */
  this.commit = function ()
  {
    if (this._transactions === 1) {
      this.getPdo().commit();
    }

    this._transactions = _.max([0, this._transactions - 1]);

    this._fireConnectionEvent('committed');
  }

  /**
   * Rollback the active database transaction.
   *
   * @param  {Number|null}  toLevel
   * @return void
   *
   * @throws {Error}
   */
  this.rollBack = function (toLevel = null)
  {
    // We allow developers to rollback to a certain transaction level. We will verify
    // that this given transaction level is valid before attempting to rollback to
    // that level. If it's not we will just return out and not attempt anything.
    toLevel = (toLevel == null)
      ? this._transactions - 1
      : toLevel;

    if (toLevel < 0 || toLevel >= this._transactions) {
    return;
  }

    // Next, we will actually perform this rollback within this database and fire the
    // rollback event. We will also set the current transaction level to the given
    // level that was passed into this method so it will be right from here out.
    try {
      this._performRollBack(toLevel);
    } catch (e) {
    this._handleRollBackException(e);
  }

    this._transactions = toLevel;

    this._fireConnectionEvent('rollingBack');
  }

  /**
   * Perform a rollback within the database.
   *
   * @param  {Number}  toLevel
   * @return void
   */
  this._performRollBack = function (toLevel)
  {
    if (toLevel === 0) {
      this.getPdo().rollBack();
    } else if (this._queryGrammar.supportsSavepoints()) {
    this.getPdo().exec(
      this._queryGrammar.compileSavepointRollBack('trans' + (toLevel + 1))
    );
  }
  }

  /**
   * Handle an exception from a rollback.
   *
   * @param {Error}  e
   *
   * @throws {Error}
   */
  this._handleRollBackException = function (e)
  {
    if (this._causedByLostConnection(e)) {
      this._transactions = 0;
    }

    throw e;
  }

  /**
   * Get the number of active transactions.
   *
   * @return {Number}
   */
  this.transactionLevel = function ()
  {
    return this._transactions;
  }
}

export { ManagesTransactions }
export default ManagesTransactions
