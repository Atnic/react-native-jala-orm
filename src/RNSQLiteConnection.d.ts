import Database from 'crane-query-builder/src/Database'
import BaseRNSQLiteConnection from 'crane-query-builder/src/RNSQLiteConnection'
import Connection from "./Connection";

/**
 * @mixes BaseRNSQLiteConnection
 */
export default class RNSQLiteConnection extends Connection {
    /**
     *
     * @param driver
     * @param name
     * @param location
     * @param createFromLocation
     * @returns {Database}
     */
    static connect({ driver, name, location, createFromLocation }: {
        driver: any;
        name: any;
        location: any;
        createFromLocation: any;
    }): Database;
    /**
     * Get the database connection foreign key constraints configuration option.
     *
     * @return bool|null
     */
    _getForeignKeyConstraintsConfigurationValue(): any;
}
