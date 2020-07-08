import _ from 'lodash'
import BaseRNSQLiteConnection from 'crane-query-builder/src/RNSQLiteConnection'
import Connection from './Connection'
import QueryGrammar from './query/grammars/Grammar'
import SQLiteGrammar from './query/grammars/SQLiteGrammar'
import QueryProcessor from './query/processors/Processor'
import SQLiteProcessor from './query/processors/SQLiteProcessor'
import Database from 'crane-query-builder/src/Database'
import SQLite from 'react-native-sqlite-storage'

/**
 * @mixes BaseRNSQLiteConnection
 */
class RNSQLiteConnection extends Connection {
  /**
   * Create a new database connection instance.
   *
   * @param  {PDO|Function}     pdo
   * @param  {String}   database
   * @param  {String}   tablePrefix
   * @param  {Object}    config
   * @return void
   */
  constructor(pdo, database = '', tablePrefix = '', config = {name: 'rn-sqlite'})
  {
    super(pdo, database, tablePrefix, config)
    Database.Connection = RNSQLiteConnection
    Database.Grammar = SQLiteGrammar
    Database.database = Database.Connection.connect({
      driver: SQLite,
      name: 'Jala.db',
      location: 'default',
      createFromLocation: '~www/Jala.db'
    })

    // let enableForeignKeyConstraints = this._getForeignKeyConstraintsConfigurationValue();
    //
    // if (enableForeignKeyConstraints === null) {
    //   return;
    // }
    //
    // enableForeignKeyConstraints
    //   ? this.getSchemaBuilder().enableForeignKeyConstraints()
    //   : this.getSchemaBuilder().disableForeignKeyConstraints();
  }

  /**
   * Get the default query grammar instance.
   *
   * @return {QueryGrammar}
   */
  _getDefaultQueryGrammar()
  {
    return this.withTablePrefix(new SQLiteGrammar());
  }

  /**
   * Get a schema builder instance for the connection.
   *
   * @return {SchemaBuilder}
   */
  getSchemaBuilder()
  {
    if (this._schemaGrammar == null) {
      this.useDefaultSchemaGrammar();
    }

    return new SQLiteBuilder(this);
  }

  /**
   * Get the default schema grammar instance.
   *
   * @return {SchemaGrammar}
   */
  _getDefaultSchemaGrammar()
  {
    return this.withTablePrefix(new SQLiteSchemaGrammar());
  }

  /**
   * Get the default post processor instance.
   *
   * @return {QueryProcessor}
   */
  _getDefaultPostProcessor()
  {
    return new SQLiteProcessor();
  }

  /**
   * Get the database connection foreign key constraints configuration option.
   *
   * @return bool|null
   */
  _getForeignKeyConstraintsConfigurationValue()
  {
    return this.getConfig('foreign_key_constraints');
  }

  /**
   *
   * @param driver
   * @param name
   * @param location
   * @param createFromLocation
   * @returns {Database}
   */
  static connect ({ driver, name, location, createFromLocation }) {
    const db = driver.openDatabase({ name, location, createFromLocation })

    db.executeSql('PRAGMA foreign_keys = ON;')

    return db
  }
}

/** Bugfix executeSql on RNSQLiteConnection */
BaseRNSQLiteConnection.connect = function ({ driver, name, location, createFromLocation }) {
  const db = driver.openDatabase({ name, location, createFromLocation })

  db.executeSql('PRAGMA foreign_keys = ON;', () =>
    console.log('Foreign keys turned on')
  )

  return db
}

_.forEach(Object.getOwnPropertyDescriptors(BaseRNSQLiteConnection.prototype), (value, key) => {
  if (!['constructor'].includes(key))
    RNSQLiteConnection.prototype[key] = value.value
})

export { RNSQLiteConnection }
export default RNSQLiteConnection
