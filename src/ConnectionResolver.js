import _ from 'lodash'

class ConnectionResolver {
  /**
   * All of the registered connections.
   *
   * @var {Object}
   */
  _connections = {}

  /**
   * The default connection name.
   *
   * @var string
   */
  _default

  /**
   * Create a new connection resolver instance.
   *
   * @return void
   * @param {Object} connections
   */
  constructor (connections = {}) {
    _.each(connections, (connection, key) => {
      this.addConnection(key, connection)
    })
    this._default = 'rn-sqlite'
  }

  /**
   * Get a database connection instance.
   *
   * @return Connection
   * @param {String|null} name
   */
  connection (name = null) {
    if (name == null) {
      name = this.getDefaultConnection()
    }

    return this._connections[name]
  }

  /**
   * Add a connection to the resolver.
   *
   * @return void
   * @param name
   * @param {Connection} connection
   */
  addConnection (name, connection) {
    this._connections = {
      ...this._connections,
      [name]: connection
    }
  }

  /**
   * Check if a connection has been registered.
   *
   * @return bool
   * @param {String} name
   */
  hasConnection (name) {
    return name in this._connections
  }

  /**
   * Get the default connection name.
   *
   * @return {String}
   */
  getDefaultConnection () {
    return this._default
  }

  /**
   * Set the default connection name.
   *
   * @return void
   * @param {String} name
   */
  setDefaultConnection (name) {
    this._default = name
  }
}

export { ConnectionResolver }
export default ConnectionResolver
