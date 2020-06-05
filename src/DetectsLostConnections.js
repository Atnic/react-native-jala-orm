import _ from 'lodash'

/**
 * DetectsLostConnections Trait
 *
 * @constructor
 * @mixin
 */
const DetectsLostConnections = function () {
  /**
   * Determine if the given exception was caused by a lost connection.
   *
   * @param  {Throwable}  e
   * @return bool
   */
  this._causedByLostConnection = function(e)
  {
    let message = e.getMessage();

    return _.contains(message, [
      'server has gone away',
      'no connection to the server',
      'Lost connection',
      'is dead or not enabled',
      'Error while sending',
      'decryption failed or bad record mac',
      'server closed the connection unexpectedly',
      'SSL connection has been closed unexpectedly',
      'Error writing data to the connection',
      'Resource deadlock avoided',
      'Transaction() on null',
      'child connection forced to terminate due to client_idle_limit',
      'query_wait_timeout',
      'reset by peer',
      'Physical connection is not usable',
      'TCP Provider: Error code 0x68',
      'ORA-03114',
      'Packets out of order. Expected',
      'Adaptive Server connection failed',
      'Communication link failure',
    ]);
  }
}

export { DetectsLostConnections }
export default DetectsLostConnections
