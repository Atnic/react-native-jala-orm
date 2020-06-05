import _ from 'lodash';
import moment from 'moment'
import DetectsDeadlocks from './DetectsDeadlocks'
import DetectsLostConnections from './DetectsLostConnections'
import ManagesTransactions from './concerns/ManagesTransactions'
import Builder from './query/Builder'
import QueryGrammar from './query/grammars/Grammar'
import QueryProcessor from './query/processors/Processor'

/**
 * @mixes DetectsDeadlocks
 * @mixes DetectsLostConnections
 * @mixes ManagesTransactions
 */
class Connection {
  /**
   * The active PDO connection.
   *
   * @var {PDO|Function}
   */
  _pdo;

  /**
   * The active PDO connection used for reads.
   *
   * @var {PDO|Function}
   */
  _readPdo;

  /**
   * The name of the connected database.
   *
   * @var {String}
   */
  _database;

  /**
   * The table prefix for the connection.
   *
   * @var {String}
   */
  _tablePrefix = '';

  /**
   * The database connection configuration options.
   *
   * @var {Object}
   */
  _config = {};

  /**
   * The reconnector instance for the connection.
   *
   * @var {Function}
   */
  _reconnector;

  /**
   * The query grammar implementation.
   *
   * @var {QueryGrammar}
   */
  _queryGrammar;

  /**
   * The schema grammar implementation.
   *
   * @var {SchemaGrammar}
   */
  _schemaGrammar;

  /**
   * The query post processor implementation.
   *
   * @var {QueryProcessor}
   */
  _postProcessor;

  /**
   * The event dispatcher instance.
   *
   * @var {Dispatcher}
   */
  _events;

  /**
   * The default fetch mode of the connection.
   *
   * @var {Number}
   */
  _fetchMode = 0;

  /**
   * The number of active transactions.
   *
   * @var {Number}
   */
  _transactions = 0;

  /**
   * Indicates if changes have been made to the database.
   *
   * @var {Number|Boolean}
   */
  _recordsModified = false;

  /**
   * All of the queries run against the connection.
   *
   * @var {Array}
   */
  _queryLog = [];

  /**
   * Indicates whether queries are being logged.
   *
   * @var {Boolean}
   */
  _loggingQueries = false;

  /**
   * Indicates if the connection is in a "dry run".
   *
   * @var {Boolean}
   */
  _pretending = false;

  /**
   * The instance of Doctrine connection.
   *
   * @var {DoctrineConnection}
   */
  _doctrineConnection; // TODO

  /**
   * The connection resolvers.
   *
   * @var {Array}
   */
  static _resolvers = [];

  /**
   * Create a new database connection instance.
   *
   * @param  {PDO|Function}     pdo
   * @param  {String}   database
   * @param  {String}   tablePrefix
   * @param  {Object}    config
   * @return void
   */
  constructor(pdo, database = '', tablePrefix = '', config = {})
  {
    this._pdo = pdo;

    // First we will setup the default properties. We keep track of the DB
    // name we are connected to since it is needed when some reflective
    // type commands are run such as checking whether a table exists.
    this._database = database;

    this._tablePrefix = tablePrefix;

    this._config = config;

    // We need to initialize a query grammar and the query post processors
    // which are both very important parts of the database abstractions
    // so we initialize these to their default values while starting.
    this.useDefaultQueryGrammar();

    this.useDefaultPostProcessor();
  }

  /**
   * Set the query grammar to the default implementation.
   *
   * @return void
   */
  useDefaultQueryGrammar()
  {
    this._queryGrammar = this._getDefaultQueryGrammar();
  }

  /**
   * Get the default query grammar instance.
   *
   * @return {QueryGrammar}
   */
  _getDefaultQueryGrammar()
  {
    return new QueryGrammar;
  }

  /**
   * Set the schema grammar to the default implementation.
   *
   * @return void
   */
  useDefaultSchemaGrammar()
  {
    this.schemaGrammar = this._getDefaultSchemaGrammar();
  }

  /**
   * Get the default schema grammar instance.
   *
   * @return {SchemaGrammar}
   */
  _getDefaultSchemaGrammar()
  {
    //
  }

  /**
   * Set the query post processor to the default implementation.
   *
   * @return void
   */
  useDefaultPostProcessor()
  {
    this._postProcessor = this._getDefaultPostProcessor();
  }

  /**
   * Get the default post processor instance.
   *
   * @return {QueryProcessor}
   */
  _getDefaultPostProcessor()
  {
    return new QueryProcessor();
  }

  /**
   * Get a schema builder instance for the connection.
   *
   * @return {SchemaBuilder}
   */
  getSchemaBuilder()
  {
    if (!this._schemaGrammar) {
      this.useDefaultSchemaGrammar();
    }

    return new SchemaBuilder(this);
  }

  /**
   * Begin a fluent query against a database table.
   *
   * @param  {String}  table
   * @return {Builder}
   */
  table(table) {
    return this.query().from(table);
  }

  /**
   * Get a new query builder instance.
   *
   * @return {Builder}
   */
  query()
  {
    return new Builder(
      this, this.getQueryGrammar(), this.getPostProcessor()
    );
  }

  /**
   * Run a select statement and return a single result.
   *
   * @param  {String}  query
   * @param  {Array}   bindings
   * @param  {Boolean}  useReadPdo
   * @return {*}
   */
  selectOne(query, bindings = [], useReadPdo = true) {
    let records = this.select(query, bindings, useReadPdo);

    return records.shift();
  }

  /**
   * Run a select statement against the database.
   *
   * @param  {String}  query
   * @param  {Array}   bindings
   * @return {Array}
   */
  selectFromWriteConnection(query, bindings = [])
  {
    return this.select(query, bindings, false);
  }

  /**
   * Run a select statement against the database.
   *
   * @param  {String}  query
   * @param  {Array}   bindings
   * @param  {Boolean}  useReadPdo
   * @return {Array}
   */
  select(query, bindings = [], useReadPdo = true) {
    return this._run(query, bindings, (query, binding) => {
      if (this.pretending()) {
        return [];
      }

      // For select statements, we'll simply execute the query and return an array
      // of the database result set. Each element in the array will be a single
      // row from the database table, and will either be an array or objects.
      let statement = this._prepared(this.getPdoForSelect(useReadPdo).prepare(query))

      this.bindValues(statement, this.prepareBindings(bindings));

      statement.execute();

      return statement.fetchAll();
    });
  }

  /**
   * Run a select statement against the database and returns a generator.
   *
   * @param  {String}  query
   * @param  {Array}  bindings
   * @param  {Boolean}  useReadPdo
   * @return {Generator}
   */
  *cursor(query, bindings = [], useReadPdo = true) {
    let statement = this.run(query, bindings, (query, binding) => {
      if (this.pretending()) {
        return [];
      }

      // First we will create a statement for the query. Then, we will set the fetch
      // mode and prepare the bindings for the query. Once that's done we will be
      // ready to execute the query against the database and return the cursor.
      let statement = this._prepared(this.getPdoForSelect(useReadPdo).prepare(query));

      this.bindValues(
        statement, this.prepareBindings(bindings)
      );

      // Next, we'll execute the query against the database and return the statement
      // so we can return the cursor. The cursor will use a PHP generator to give
      // back one row at a time without using a bunch of memory to render them.
      statement.execute();

      return statement;
    });

    let record;
    while (record = statement.fetch()) {
      yield record;
    }
  }

  /**
   * Configure the PDO prepared statement.
   */
  _prepared(statement)
  {
    statement.setFetchMode(this._fetchMode);

    // this.event(new Events\StatementPrepared(
    //   this, statement
    // ))

    return statement;
  }

  /**
   * Get the PDO connection to use for a select query.
   *
   * @param  {Boolean}  useReadPdo
   * @return {PDO}
   */
  _getPdoForSelect(useReadPdo = true)
  {
    return useReadPdo ? this.getReadPdo() : this.getPdo();
  }

  /**
   * Run an insert statement against the database.
   *
   * @param  {String}  query
   * @param  {Array}   bindings
   * @return {Boolean}
   */
  insert(query, bindings = []) {
    return this.statement(query, bindings);
  }

  /**
   * Run an update statement against the database.
   *
   * @param  {String}  query
   * @param  {Array}   bindings
   * @return int
   */
  update(query, bindings = []) {
    return this.affectingStatement(query, bindings);
  }

  /**
   * Run a delete statement against the database.
   *
   * @param  {String}  query
   * @param  {Array}   bindings
   * @return int
   */
  delete(query, bindings = []) {
    return this.affectingStatement(query, bindings);
  }

  /**
   * Execute an SQL statement and return the boolean result.
   *
   * @param  {String}  query
   * @param  {Array}   bindings
   * @return bool
   */
  statement(query, bindings = []) {
    return this.run(query, bindings, (query, bindings) => {
      if (this.pretending()) {
        return true;
      }

      let statement = this.getPdo().prepare(query);

      this.bindValues(statement, this.prepareBindings(bindings));

      this.recordsHaveBeenModified();

      return statement.execute();
    });
  }

  /**
   * Run an SQL statement and get the number of rows affected.
   *
   * @param  {String}  query
   * @param  {Array}   bindings
   * @return int
   */
  affectingStatement(query, bindings = []) {
    return this.run(query, bindings, (query, bindings) => {
      if (this.pretending()) {
        return 0;
      }

      // For update or delete statements, we want to get the number of rows affected
      // by the statement and return that back to the developer. We'll first need
      // to execute the statement and then we'll use PDO to fetch the affected.
      let statement = this.getPdo().prepare(query);

      this.bindValues(statement, this.prepareBindings(bindings));

      statement.execute();

      let count;
      this.recordsHaveBeenModified(
        (count = statement.rowCount()) > 0
      );

      return count;
    });
  }

  /**
   * Run a raw, unprepared query against the PDO connection.
   *
   * @param  {String}  query
   * @return bool
   */
  unprepared(query) {
    return this.run(query, [], (query) => {
      if (this.pretending()) {
        return true;
      }

      let change;
      this.recordsHaveBeenModified(
        change = (this.getPdo().exec(query) !== false)
      )

      return change;
    });
  }

  /**
   * Execute the given callback in "dry run" mode.
   *
   * @param  {Function}  callback
   * @return {Array}
   */
  pretend(callback)
  {
    return this.withFreshQueryLog(() => {
      this._pretending = true;

      // Basically to make the database connection "pretend", we will just return
      // the default values for all the query methods, then we will return an
      // array of queries that were "executed" within the Closure callback.
      callback(this);

      this._pretending = false;

      return this._queryLog;
    });
  }

  /**
   * Execute the given callback in "dry run" mode.
   *
   * @param  {Function}  callback
   * @return {Array}
   */
  _withFreshQueryLog(callback)
  {
    let loggingQueries = this._loggingQueries;

    // First we will back up the value of the logging queries property and then
    // we'll be ready to run callbacks. This query log will also get cleared
    // so we will have a new log of all the queries that are executed now.
    this.enableQueryLog();

    this._queryLog = [];

    // Now we'll execute this callback and capture the result. Once it has been
    // executed we will restore the value of query logging and give back the
    // value of the callback so the original callers can have the results.
    let result = callback();

    this._loggingQueries = loggingQueries;

    return result;
  }

  /**
   * Bind values to their parameters in the given statement.
   *
   * @param  {PDOStatement} statement
   * @param  {Object}  bindings
   * @return void
   */
  bindValues(statement, bindings)
  {
    _.forEach(bindings, (value, key) => {
      statement.bindValue(
        _.isNaN(key) ? key : key + 1, value,
        _.isNaN(value) ? 1 : 2
      );
    })
  }

  /**
   * Prepare the query bindings for execution.
   *
   * @param  {Object}  bindings
   * @return {Object}
   */
  prepareBindings(bindings) {
    let grammar = this.getQueryGrammar();

    _.forEach(bindings, (value, key) => {
      // We need to transform all instances of DateTimeInterface into the actual
      // date string. Each query grammar maintains its own date string format
      // so we'll just ask the grammar for the format to get from the date.
      if (moment.isMoment(value)) {
        bindings[key] = value.format(grammar.getDateFormat());
      } else if (value instanceof Date) {
        bindings[key] = moment.utc(value).format(grammar.getDateFormat());
      } else if (_.isBoolean(value)) {
        bindings[key] = Number(value);
      }
    })

    return bindings;
  }

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
  _run(query, bindings, callback) {
    this._reconnectIfMissingConnection();

    let start = moment.utc().milliseconds();

    // Here we will run this query. If an exception occurs we'll determine if it was
    // caused by a connection that has been lost. If that is the cause, we'll try
    // to re-establish connection and re-run the query with a fresh connection.
    let result;
    try {
      result = this._runQueryCallback(query, bindings, callback);
    } catch (e) {
      result = this._handleQueryException(
        e, query, bindings, callback
      )
    }

    // Once we have run the query we will calculate the time that it took to run and
    // then log the query, bindings, and execution time so we will report them on
    // the event that the developer needs them. We'll log time in milliseconds.
    this.logQuery(
      query, bindings, this._getElapsedTime(start)
    );

    return result;
  }

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
  _runQueryCallback(query, bindings, callback)
  {
    // To execute the statement, we'll simply call the callback, which will actually
    // run the SQL against the PDO connection. Then we can calculate the time it
    // took to execute and log the query SQL, bindings and time in our memory.
    let result;
    try {
      result = callback(query, bindings);
    }

    // If an exception occurs when attempting to run a query, we'll format the error
    // message to include the bindings with SQL, which will make this exception a
    // lot more helpful to the developer instead of just the database's errors.
    catch (e) {
      throw new QueryException(
        query, this.prepareBindings(bindings), e
      );
    }

    return result;
  }

  /**
   * Log a query in the connection's query log.
   *
   * @param  {String}  query
   * @param  {Object}   bindings
   * @param  {Number|null}  time
   * @return void
   */
  logQuery(query, bindings, time = null)
  {
    this.event(new QueryExecuted(query, bindings, time, this));

    if (this._loggingQueries) {
      this._queryLog.push({query, bindings, time});
    }
  }

  /**
   * Get the elapsed time since a given starting point.
   *
   * @param  {Number}    start
   * @return {Number}
   */
  _getElapsedTime(start)
  {
    return _.round((moment.utc().milliseconds() - start), 2);
  }

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
  _handleQueryException(e, query, bindings, callback)
  {
    if (this._transactions >= 1) {
      throw e;
    }

    return this._tryAgainIfCausedByLostConnection(
      e, query, bindings, callback
    );
  }

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
  _tryAgainIfCausedByLostConnection(e, query, bindings, callback) {
    if (this._causedByLostConnection(e.getPrevious())) {
      this.reconnect();

      return this._runQueryCallback(query, bindings, callback);
    }

    throw e;
  }

  /**
   * Reconnect to the database.
   *
   * @return void
   *
   * @throws {LogicException}
   */
  reconnect() {
    if (this._reconnector instanceof Function) {
      this._doctrineConnection = null;

      return this._reconnector.call(this);
    }

    throw new LogicException('Lost connection and no reconnector available.');
  }

  /**
   * Reconnect to the database if a PDO connection is missing.
   *
   * @return void
   */
  _reconnectIfMissingConnection()
  {
    if (_.isNull(this._pdo)) {
      this.reconnect();
    }
  }

  /**
   * Disconnect from the underlying PDO connection.
   *
   * @return void
   */
  disconnect()
  {
    this.setPdo(null).setReadPdo(null);
  }

  /**
   * Register a database query listener with the connection.
   *
   * @param  {Function}  callback
   * @return void
   */
  listen(callback)
  {
    if (this._events) {
      this._events.listen(QueryExecuted.name, callback);
    }
  }

  /**
   * Fire an event for this connection.
   *
   * @param  {String}  event
   * @return {Array|null}
   */
  _fireConnectionEvent(event)
  {
    if (!this._events) {
      return;
    }

    switch (event) {
      case 'beganTransaction':
        return this._events.dispatch(new EventsTransactionBeginning(this));
      case 'committed':
        return this._events.dispatch(new EventsTransactionCommitted(this));
      case 'rollingBack':
        return this._events.dispatch(new EventsTransactionRolledBack(this));
    }
  }

  /**
   * Fire the given event if possible.
   *
   * @param  {String}  event
   * @return void
   */
  _event(event)
  {
    if (this._events) {
      this._events.dispatch(event);
    }
  }

  /**
   * Get a new raw query expression.
   *
   * @param  {String|QueryExpression}  value
   * @return {QueryExpression}
   */
  raw(value)
  {
    return new QueryExpression(value);
  }

  /**
   * Indicate if any records have been modified.
   *
   * @param  {Boolean}  value
   * @return void
   */
  recordsHaveBeenModified(value = true)
  {
    if (! this._recordsModified) {
      this._recordsModified = value;
    }
  }

  /**
   * Is Doctrine available?
   *
   * @return bool
   */
  isDoctrineAvailable()
  {
    return false; // No doctrine/dbal for javascript
    // return class_exists('Doctrine\\DBAL\\Connection');
  }

  /**
   * Get a Doctrine Schema Column instance.
   *
   * @param  {String}  table
   * @param  {String}  column
   * @return \Doctrine\DBAL\Schema\Column
   */
  getDoctrineColumn(table, column)
  {
    let schema = this.getDoctrineSchemaManager();

    return schema.listTableDetails(table).getColumn(column);
  }

  /**
   * Get the Doctrine DBAL schema manager for the connection.
   *
   * @return \Doctrine\DBAL\Schema\AbstractSchemaManager
   */
  getDoctrineSchemaManager()
  {
    return this.getDoctrineDriver().getSchemaManager(this.getDoctrineConnection());
  }

  /**
   * Get the Doctrine DBAL database connection instance.
   *
   * @return \Doctrine\DBAL\Connection
   */
  getDoctrineConnection()
  {
    if (_.isNull(this._doctrineConnection)) {
      let driver = this.getDoctrineDriver();

      this._doctrineConnection = new DoctrineConnection(_.filter({
        pdo: this.getPdo(),
        dbname: this.getConfig('database'),
        driver: this.getName(),
        serverVersion: this.getConfig('server_version'),
      }), driver);
    }

    return this._doctrineConnection;
  }

  /**
   * Get the current PDO connection.
   *
   * @return {PDO}
   */
  getPdo()
  {
    if (this._pdo instanceof Function) {
      this._pdo = this._pdo();
    }

    return this._pdo;
  }

  /**
   * Get the current PDO connection used for reading.
   *
   * @return {PDO}
   */
  getReadPdo()
  {
    if (this._transactions > 0) {
      return this.getPdo();
    }

    if (this._recordsModified && this.getConfig('sticky')) {
      return this.getPdo();
    }

    if (this._readPdo instanceof Function) {
      return this._readPdo = this._readPdo();
    }

    return this._readPdo || this.getPdo();
  }

  /**
   * Set the PDO connection.
   *
   * @param  {PDO|Function|null}  pdo
   * @return {Connection}
   */
  setPdo(pdo)
  {
    this._transactions = 0;

    this._pdo = pdo;

    return this;
  }

  /**
   * Set the PDO connection used for reading.
   *
   * @param  {PDO|Function|null}  pdo
   * @return {Connection}
   */
  setReadPdo(pdo)
  {
    this._readPdo = pdo;

    return this;
  }

  /**
   * Set the reconnect instance on the connection.
   *
   * @param  {Function}  reconnector
   * @return {Connection}
   */
  setReconnector(reconnector)
  {
    this._reconnector = reconnector;

    return this;
  }

  /**
   * Get the database connection name.
   *
   * @return {String|null}
   */
  getName()
  {
    return this.getConfig('name');
  }

  /**
   * Get an option from the configuration options.
   *
   * @param  {String|null}  option
   * @return {*}
   */
  getConfig(option = null)
  {
    return _.get(this._config, option);
  }

  /**
   * Get the PDO driver name.
   *
   * @return {String}
   */
  getDriverName()
  {
    return this.getConfig('driver');
  }

  /**
   * Get the query grammar used by the connection.
   *
   * @return {QueryGrammar}
   */
  getQueryGrammar()
  {
    return this._queryGrammar;
  }

  /**
   * Set the query grammar used by the connection.
   *
   * @param  {QueryGrammar}  grammar
   * @return {Connection}
   */
  setQueryGrammar(grammar)
  {
    this._queryGrammar = grammar;

    return this;
  }

  /**
   * Get the schema grammar used by the connection.
   *
   * @return {SchemaGrammar}
   */
  getSchemaGrammar()
  {
    return this._schemaGrammar;
  }

  /**
   * Set the schema grammar used by the connection.
   *
   * @param  {SchemaGrammar}  grammar
   * @return {Connection}
   */
  setSchemaGrammar(grammar)
  {
    this._schemaGrammar = grammar;

    return this;
  }

  /**
   * Get the query post processor used by the connection.
   *
   * @return {QueryProcessor}
   */
  getPostProcessor()
  {
    return this._postProcessor;
  }

  /**
   * Set the query post processor used by the connection.
   *
   * @param  {QueryProcessor}  processor
   * @return {Connection}
   */
  setPostProcessor(processor)
  {
    this._postProcessor = processor;

    return this;
  }

  /**
   * Get the event dispatcher used by the connection.
   *
   * @return Dispatcher
   */
  getEventDispatcher()
  {
    return this._events;
  }

  /**
   * Set the event dispatcher instance on the connection.
   *
   * @param  {Dispatcher}  events
   * @return {Connection}
   */
  setEventDispatcher(events)
  {
    this._events = events;

    return this;
  }

  /**
   * Unset the event dispatcher for this connection.
   *
   * @return void
   */
  unsetEventDispatcher()
  {
    this._events = null;
  }

  /**
   * Determine if the connection is in a "dry run".
   *
   * @return bool
   */
  pretending()
  {
    return this._pretending === true;
  }

  /**
   * Get the connection query log.
   *
   * @return array
   */
  getQueryLog()
  {
    return this._queryLog;
  }

  /**
   * Clear the query log.
   *
   * @return void
   */
  flushQueryLog()
  {
    this._queryLog = [];
  }

  /**
   * Enable the query log on the connection.
   *
   * @return void
   */
  enableQueryLog()
  {
    this._loggingQueries = true;
  }

  /**
   * Disable the query log on the connection.
   *
   * @return void
   */
  disableQueryLog()
  {
    this._loggingQueries = false;
  }

  /**
   * Determine whether we're logging queries.
   *
   * @return bool
   */
  logging()
  {
    return this._loggingQueries;
  }

  /**
   * Get the name of the connected database.
   *
   * @return string
   */
  getDatabaseName()
  {
    return this._database;
  }

  /**
   * Set the name of the connected database.
   *
   * @param  {String}  database
   * @return {Connection}
   */
  setDatabaseName(database)
  {
    this._database = database;

    return this;
  }

  /**
   * Get the table prefix for the connection.
   *
   * @return string
   */
  getTablePrefix()
  {
    return this._tablePrefix;
  }

  /**
   * Set the table prefix in use by the connection.
   *
   * @param  {String}  prefix
   * @return {Connection}
   */
  setTablePrefix(prefix)
  {
    this._tablePrefix = prefix;

    this.getQueryGrammar().setTablePrefix(prefix);

    return this;
  }

  /**
   * Set the table prefix and return the grammar.
   *
   * @param  {Grammar}  grammar
   * @return {Grammar}
   */
  withTablePrefix(grammar)
  {
    grammar.setTablePrefix(this._tablePrefix);

    return grammar;
  }

  /**
   * Register a connection resolver.
   *
   * @param  {String}  driver
   * @param  {Function}  callback
   * @return void
   */
  static resolverFor(driver, callback)
  {
    this._resolvers[driver] = callback;
  }

  /**
   * Get the connection resolver for the given driver.
   *
   * @param  {String}  driver
   * @return {*|null}
   */
  static getResolver(driver)
  {
    return this._resolvers[driver] || null;
  }
}

DetectsDeadlocks.call(Connection.prototype);
DetectsLostConnections.call(Connection.prototype);
ManagesTransactions.call(Connection.prototype);

export { Connection }
export default Connection
