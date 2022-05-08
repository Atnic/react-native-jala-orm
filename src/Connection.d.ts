import QueryGrammar from "./query/grammars/Grammar";
import QueryProcessor from "./query/processors/Processor";
import Builder from "./query/Builder";
import Expression from "./query/Expression";
import Grammar from "./Grammar";

/**
 * @mixes DetectsDeadlocks
 * @mixes DetectsLostConnections
 * @mixes ManagesTransactions
 */
export default class Connection {
    /**
     * The active PDO connection.
     *
     * @var {PDO|Function}
     */
    _pdo: any;
    /**
     * The active PDO connection used for reads.
     *
     * @var {PDO|Function}
     */
    _readPdo: any;
    /**
     * The name of the connected database.
     *
     * @var {String}
     */
    _database: string;
    /**
     * The table prefix for the connection.
     *
     * @var {String}
     */
    _tablePrefix: string;
    /**
     * The database connection configuration options.
     *
     * @var {Object}
     */
    _config: {};
    /**
     * The reconnector instance for the connection.
     *
     * @var {Function}
     */
    _reconnector: any;
    /**
     * The query grammar implementation.
     *
     * @var {QueryGrammar}
     */
    _queryGrammar: any;
    /**
     * The schema grammar implementation.
     *
     * @var {SchemaGrammar}
     */
    _schemaGrammar: any;
    /**
     * The query post processor implementation.
     *
     * @var {QueryProcessor}
     */
    _postProcessor: any;
    /**
     * The event dispatcher instance.
     *
     * @var {Dispatcher}
     */
    _events: any;
    /**
     * The default fetch mode of the connection.
     *
     * @var {Number}
     */
    _fetchMode: number;
    /**
     * The number of active transactions.
     *
     * @var {Number}
     */
    _transactions: number;
    /**
     * Indicates if changes have been made to the database.
     *
     * @var {Number|Boolean}
     */
    _recordsModified: boolean;
    /**
     * All of the queries run against the connection.
     *
     * @var {Array}
     */
    _queryLog: any[];
    /**
     * Indicates whether queries are being logged.
     *
     * @var {Boolean}
     */
    _loggingQueries: boolean;
    /**
     * Indicates if the connection is in a "dry run".
     *
     * @var {Boolean}
     */
    _pretending: boolean;
    /**
     * The instance of Doctrine connection.
     *
     * @var {DoctrineConnection}
     */
    _doctrineConnection: any;
    /**
     * The connection resolvers.
     *
     * @var {Array}
     */
    static _resolvers: any[];
    /**
     * Register a connection resolver.
     *
     * @param  {String}  driver
     * @param  {Function}  callback
     * @return void
     */
    static resolverFor(driver: string, callback: Function): void;
    /**
     * Get the connection resolver for the given driver.
     *
     * @param  {String}  driver
     * @return {*|null}
     */
    static getResolver(driver: string): any | null;
    /**
     * Create a new database connection instance.
     *
     * @param  {PDO|Function}     pdo
     * @param  {String}   database
     * @param  {String}   tablePrefix
     * @param  {Object}    config
     * @return void
     */
    constructor(pdo: Function|any, database?: string, tablePrefix?: string, config?: any);
    /**
     * Set the query grammar to the default implementation.
     *
     * @return void
     */
    useDefaultQueryGrammar(): void;
    /**
     * Get the default query grammar instance.
     *
     * @return {QueryGrammar}
     */
    _getDefaultQueryGrammar(): QueryGrammar;
    /**
     * Set the schema grammar to the default implementation.
     *
     * @return void
     */
    useDefaultSchemaGrammar(): void;
    /**
     * Get the default schema grammar instance.
     *
     * @return {SchemaGrammar}
     */
    _getDefaultSchemaGrammar(): any;
    /**
     * Set the query post processor to the default implementation.
     *
     * @return void
     */
    useDefaultPostProcessor(): void;
    /**
     * Get the default post processor instance.
     *
     * @return {QueryProcessor}
     */
    _getDefaultPostProcessor(): QueryProcessor;
    /**
     * Get a schema builder instance for the connection.
     *
     * @return {SchemaBuilder}
     */
    getSchemaBuilder(): any;
    /**
     * Begin a fluent query against a database table.
     *
     * @param  {String}  table
     * @return {Builder}
     */
    table(table: string): Builder;
    /**
     * Get a new query builder instance.
     *
     * @return {Builder}
     */
    query(): Builder;
    /**
     * Run a select statement and return a single result.
     *
     * @param  {String}  query
     * @param  {Array}   bindings
     * @param  {Boolean}  useReadPdo
     * @return {*}
     */
    selectOne(query: string, bindings?: any[], useReadPdo?: boolean): any;
    /**
     * Run a select statement against the database.
     *
     * @param  {String}  query
     * @param  {Array}   bindings
     * @return {Array}
     */
    selectFromWriteConnection(query: string, bindings?: any[]): any[];
    /**
     * Run a select statement against the database.
     *
     * @param  {String}  query
     * @param  {Array}   bindings
     * @param  {Boolean}  useReadPdo
     * @return {Array}
     */
    select(query: string, bindings?: any[], useReadPdo?: boolean): any[];
    /**
     * Run a select statement against the database and returns a generator.
     *
     * @param  {String}  query
     * @param  {Array}  bindings
     * @param  {Boolean}  useReadPdo
     * @return {Generator}
     */
    cursor(query: string, bindings?: any[], useReadPdo?: boolean): any;
    /**
     * Configure the PDO prepared statement.
     */
    _prepared(statement: any): any;
    /**
     * Get the PDO connection to use for a select query.
     *
     * @param  {Boolean}  useReadPdo
     * @return {PDO}
     */
    _getPdoForSelect(useReadPdo?: boolean): any;
    /**
     * Run an insert statement against the database.
     *
     * @param  {String}  query
     * @param  {Array}   bindings
     * @return {Boolean}
     */
    insert(query: string, bindings?: any[]): boolean;
    /**
     * Run an update statement against the database.
     *
     * @param  {String}  query
     * @param  {Array}   bindings
     * @return int
     */
    update(query: string, bindings?: any[]): any;
    /**
     * Run a delete statement against the database.
     *
     * @param  {String}  query
     * @param  {Array}   bindings
     * @return int
     */
    delete(query: string, bindings?: any[]): any;
    /**
     * Execute an SQL statement and return the boolean result.
     *
     * @param  {String}  query
     * @param  {Array}   bindings
     * @return bool
     */
    statement(query: string, bindings?: any[]): any;
    /**
     * Run an SQL statement and get the number of rows affected.
     *
     * @param  {String}  query
     * @param  {Array}   bindings
     * @return int
     */
    affectingStatement(query: string, bindings?: any[]): any;
    /**
     * Run a raw, unprepared query against the PDO connection.
     *
     * @param  {String}  query
     * @return bool
     */
    unprepared(query: string): any;
    /**
     * Execute the given callback in "dry run" mode.
     *
     * @param  {Function}  callback
     * @return {Array}
     */
    pretend(callback: Function): any[];
    /**
     * Execute the given callback in "dry run" mode.
     *
     * @param  {Function}  callback
     * @return {Array}
     */
    _withFreshQueryLog(callback: Function): any[];
    /**
     * Bind values to their parameters in the given statement.
     *
     * @param  {PDOStatement} statement
     * @param  {Object}  bindings
     * @return void
     */
    bindValues(statement: any, bindings: any): void;
    /**
     * Prepare the query bindings for execution.
     *
     * @param  {Object}  bindings
     * @return {Object}
     */
    prepareBindings(bindings: any): any;
    /**
     * Run a SQL statement and log its execution context.
     *
     * @param  {String}    query
     * @param  {Object|Array}     bindings
     * @param  {Function}  callback
     * @return {*}
     *
     * @throws {QueryException}
     */
    _run(query: string, bindings: any | any[], callback: Function): any;
    /**
     * Run a SQL statement.
     *
     * @param  {String}    query
     * @param  {Object|Array}     bindings
     * @param  {Function}  callback
     * @return {*}
     *
     * @throws \Illuminate\Database\QueryException
     */
    _runQueryCallback(query: string, bindings: any | any[], callback: Function): any;
    /**
     * Log a query in the connection's query log.
     *
     * @param  {String}  query
     * @param  {Object}   bindings
     * @param  {Number|null}  time
     * @return void
     */
    logQuery(query: string, bindings: any, time?: number | null): void;
    /**
     * Get the elapsed time since a given starting point.
     *
     * @param  {Number}    start
     * @return {Number}
     */
    _getElapsedTime(start: number): number;
    /**
     * Handle a query exception.
     *
     * @param  {QueryException}  e
     * @param  {String}  query
     * @param  {Array}  bindings
     * @param  {Function}  callback
     * @return {*}
     *
     * @throws \Illuminate\Database\QueryException
     */
    _handleQueryException(e: Error, query: string, bindings: any[], callback: Function): any;
    /**
     * Handle a query exception that occurred during query execution.
     *
     * @param  {QueryException}  e
     * @param  {String}    query
     * @param  {Object|Array}     bindings
     * @param  {Function}  callback
     * @return {*}
     *
     * @throws {QueryException}
     */
    _tryAgainIfCausedByLostConnection(e: Error, query: string, bindings: any | any[], callback: Function): any;
    /**
     * Reconnect to the database.
     *
     * @return void
     *
     * @throws {LogicException}
     */
    reconnect(): any;
    /**
     * Reconnect to the database if a PDO connection is missing.
     *
     * @return void
     */
    _reconnectIfMissingConnection(): void;
    /**
     * Disconnect from the underlying PDO connection.
     *
     * @return void
     */
    disconnect(): void;
    /**
     * Register a database query listener with the connection.
     *
     * @param  {Function}  callback
     * @return void
     */
    listen(callback: Function): void;
    /**
     * Fire an event for this connection.
     *
     * @param  {String}  event
     * @return {Array|null}
     */
    _fireConnectionEvent(event: string): any[] | null;
    /**
     * Fire the given event if possible.
     *
     * @param  {String}  event
     * @return void
     */
    _event(event: string): void;
    /**
     * Get a new raw query expression.
     *
     * @param  {String|Expression}  value
     * @return {Expression}
     */
    raw(value: string | Expression): Expression;
    /**
     * Indicate if any records have been modified.
     *
     * @param  {Boolean}  value
     * @return void
     */
    recordsHaveBeenModified(value?: boolean): void;
    /**
     * Is Doctrine available?
     *
     * @return bool
     */
    isDoctrineAvailable(): boolean;
    /**
     * Get a Doctrine Schema Column instance.
     *
     * @param  {String}  table
     * @param  {String}  column
     * @return \Doctrine\DBAL\Schema\Column
     */
    getDoctrineColumn(table: string, column: string): any;
    /**
     * Get the Doctrine DBAL schema manager for the connection.
     *
     * @return \Doctrine\DBAL\Schema\AbstractSchemaManager
     */
    getDoctrineSchemaManager(): any;
    /**
     * Get the Doctrine DBAL database connection instance.
     *
     * @return \Doctrine\DBAL\Connection
     */
    getDoctrineConnection(): any;
    /**
     * Get the current PDO connection.
     *
     * @return {PDO}
     */
    getPdo(): any;
    /**
     * Get the current PDO connection used for reading.
     *
     * @return {PDO}
     */
    getReadPdo(): any;
    /**
     * Set the PDO connection.
     *
     * @param  {PDO|Function|null}  pdo
     * @return {Connection}
     */
    setPdo(pdo: any | Function | null): Connection;
    /**
     * Set the PDO connection used for reading.
     *
     * @param  {PDO|Function|null}  pdo
     * @return {Connection}
     */
    setReadPdo(pdo: any | Function | null): Connection;
    /**
     * Set the reconnect instance on the connection.
     *
     * @param  {Function}  reconnector
     * @return {Connection}
     */
    setReconnector(reconnector: Function): Connection;
    /**
     * Get the database connection name.
     *
     * @return {String|null}
     */
    getName(): string | null;
    /**
     * Get an option from the configuration options.
     *
     * @param  {String|null}  option
     * @return {*}
     */
    getConfig(option?: string | null): any;
    /**
     * Get the PDO driver name.
     *
     * @return {String}
     */
    getDriverName(): string;
    /**
     * Get the query grammar used by the connection.
     *
     * @return {QueryGrammar}
     */
    getQueryGrammar(): QueryGrammar;
    /**
     * Set the query grammar used by the connection.
     *
     * @param  {QueryGrammar}  grammar
     * @return {Connection}
     */
    setQueryGrammar(grammar: QueryGrammar): Connection;
    /**
     * Get the schema grammar used by the connection.
     *
     * @return {SchemaGrammar}
     */
    getSchemaGrammar(): any;
    /**
     * Set the schema grammar used by the connection.
     *
     * @param  {SchemaGrammar}  grammar
     * @return {Connection}
     */
    setSchemaGrammar(grammar: any): Connection;
    /**
     * Get the query post processor used by the connection.
     *
     * @return {QueryProcessor}
     */
    getPostProcessor(): QueryProcessor;
    /**
     * Set the query post processor used by the connection.
     *
     * @param  {QueryProcessor}  processor
     * @return {Connection}
     */
    setPostProcessor(processor: QueryProcessor): Connection;
    /**
     * Get the event dispatcher used by the connection.
     *
     * @return Dispatcher
     */
    getEventDispatcher(): any;
    /**
     * Set the event dispatcher instance on the connection.
     *
     * @param  {Dispatcher}  events
     * @return {Connection}
     */
    setEventDispatcher(events: any): Connection;
    /**
     * Unset the event dispatcher for this connection.
     *
     * @return void
     */
    unsetEventDispatcher(): void;
    /**
     * Determine if the connection is in a "dry run".
     *
     * @return bool
     */
    pretending(): boolean;
    /**
     * Get the connection query log.
     *
     * @return array
     */
    getQueryLog(): any[];
    /**
     * Clear the query log.
     *
     * @return void
     */
    flushQueryLog(): void;
    /**
     * Enable the query log on the connection.
     *
     * @return void
     */
    enableQueryLog(): void;
    /**
     * Disable the query log on the connection.
     *
     * @return void
     */
    disableQueryLog(): void;
    /**
     * Determine whether we're logging queries.
     *
     * @return bool
     */
    logging(): boolean;
    /**
     * Get the name of the connected database.
     *
     * @return string
     */
    getDatabaseName(): string;
    /**
     * Set the name of the connected database.
     *
     * @param  {String}  database
     * @return {Connection}
     */
    setDatabaseName(database: string): Connection;
    /**
     * Get the table prefix for the connection.
     *
     * @return string
     */
    getTablePrefix(): string;
    /**
     * Set the table prefix in use by the connection.
     *
     * @param  {String}  prefix
     * @return {Connection}
     */
    setTablePrefix(prefix: string): Connection;
    /**
     * Set the table prefix and return the grammar.
     *
     * @param  {Grammar}  grammar
     * @return {Grammar}
     */
    withTablePrefix(grammar: Grammar): Grammar;
}
