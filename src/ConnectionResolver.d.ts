import Connection from './Connection'

export default class ConnectionResolver {
    /**
     * All of the registered connections.
     *
     * @var {Object}
     */
    _connections: {};
    /**
     * The default connection name.
     *
     * @var string
     */
    _default: string;
    /**
     * Create a new connection resolver instance.
     *
     * @return void
     * @param {Object} connections
     */
    constructor(connections?: any);
    /**
     * Get a database connection instance.
     *
     * @return Connection
     * @param {String|null} name
     */
    connection(name?: string | null): any;
    /**
     * Add a connection to the resolver.
     *
     * @return void
     * @param name
     * @param {Connection} connection
     */
    addConnection(name: any, connection: Connection): void;
    /**
     * Check if a connection has been registered.
     *
     * @return bool
     * @param {String} name
     */
    hasConnection(name: string): boolean;
    /**
     * Get the default connection name.
     *
     * @return {String}
     */
    getDefaultConnection(): string;
    /**
     * Set the default connection name.
     *
     * @return void
     * @param {String} name
     */
    setDefaultConnection(name: string): void;
}
