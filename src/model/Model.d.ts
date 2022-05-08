import ConnectionResolver from "../ConnectionResolver";
import Connection from "../Connection";
import { ModelBuilder } from "./Builder";
import { QueryBuilder } from "../query/Builder";

/**
 * @mixes HasAttributes
 * @mixes HasEvents
 * @mixes HasGlobalScopes
 * @mixes HasRelationships
 * @mixes HasTimestamps
 * @mixes HidesAttributes
 * @mixes GuardsAttributes
 */
export default class Model {
    /**
     * The connection resolver instance.
     *
     * @var {ConnectionResolver|null}
     */
    static _resolver: any;
    /**
     * The event dispatcher instance.
     *
     * @var Dispatcher
     */
    static _dispatcher: any;
    /**
     * The array of booted models.
     *
     * @var {Object}
     */
    static _booted: {};
    /**
     * The array of global scopes on the model.
     *
     * @var {Object}
     */
    static _globalScopes: {};
    /**
     * The list of models classes that should not be affected with touch.
     *
     * @var {Array}
     */
    static _ignoreOnTouch: any[];
    /**
     * The name of the "created at" column.
     *
     * @var string
     */
    static CREATED_AT: string;
    /**
     * The name of the "updated at" column.
     *
     * @var string
     */
    static UPDATED_AT: string;
    /**
     * Trait used
     *
     * @var {Array}
     */
    static _traits: any[];
    /**
     * The "booting" method of the model.
     *
     * @return void
     */
    static _boot(): void;
    /**
     * Apply Trait
     *
     * @param {Function} trait
     */
    static applyTrait(trait: Function): void;
    /**
     * @returns {Array<Function>}
     */
    static getTraits(): Array<Function>;
    /**
     * Boot all of the bootable traits on the model.
     *
     * @return void
     */
    static _bootTraits(): void;
    /**
     * Clear the list of booted models so they will be re-booted.
     *
     * @return void
     */
    static clearBootedModels(): void;
    /**
     * Disables relationship model touching for the current class during given callback scope.
     *
     * @param  {Function}  callback
     * @return void
     */
    static withoutTouching(callback: Function): void;
    /**
     * Disables relationship model touching for the given model classes during given callback scope.
     *
     * @param  {Array}  models
     * @param  {Function}  callback
     * @return void
     */
    static withoutTouchingOn(models: any[], callback: Function): void;
    /**
     * Determine if the given model is ignoring touches.
     *
     * @param  {Function|null}  cls
     * @return {Boolean}
     */
    static isIgnoringTouch(cls?: Function | null): boolean;
    /**
     * Begin querying the model on a given connection.
     *
     * @return {ModelBuilder}
     * @param {String} connection
     */
    static on(connection?: string): ModelBuilder;
    /**
     * Begin querying the model on the write connection.
     *
     * @return {QueryBuilder}
     */
    static onWriteConnection(): QueryBuilder;
    /**
     * Get all of the models from the database.
     *
     * @return {Array<Model>}
     * @param {Array|Object} columns
     */
    static all(columns?: any[] | any, ...args: any[]): Array<Model>;
    /**
     * Begin querying a model with eager loading.
     *
     * @return {ModelBuilder}
     * @param {String|Array<String>} relations
     */
    static with(relations: string | Array<string>, ...args: any[]): ModelBuilder;
    /**
     * Destroy the models for the given IDs.
     *
     * @return int
     * @param {Array|String|Number} ids
     */
    static destroy(ids: any[] | string | number, ...args: any[]): Promise<number>;
    /**
     * Begin querying the model.
     *
     * @return {ModelBuilder}
     */
    static query(): ModelBuilder;
    /**
     * Resolve a connection instance.
     *
     * @return {Connection}
     * @param {String} connection
     */
    static resolveConnection(connection?: string): Connection;
    /**
     * Get the connection resolver instance.
     *
     * @return ConnectionResolver
     */
    static getConnectionResolver(): any;
    /**
     * Set the connection resolver instance.
     *
     * @param  {ConnectionResolver} resolver
     * @return void
     */
    static setConnectionResolver(resolver: ConnectionResolver): void;
    /**
     * Unset the connection resolver for models.
     *
     * @return void
     */
    static unsetConnectionResolver(): void;
    /**
     * Handle dynamic static method calls into the method.
     *
     * @return mixed
     * @param method
     * @param parameters
     */
    static __callStatic(method: any, parameters: any): any;
    /**
     * Create a new Eloquent model instance.
     *
     * @return void
     * @param {Object} attributes
     */
    constructor(attributes?: any);
    /**
     * The connection name for the model.
     *
     * @var {String|null}
     */
    _connection: any;
    /**
     * The table associated with the model.
     *
     * @var {String|null}
     */
    _table: any;
    /**
     * The primary key for the model.
     *
     * @var {String}
     */
    _primaryKey: string;
    /**
     * The "type" of the auto-incrementing ID.
     *
     * @var {String}
     */
    _keyType: string;
    /**
     * Indicates if the IDs are auto-incrementing.
     *
     * @var {Boolean}
     */
    incrementing: boolean;
    /**
     * The relations to eager load on every query.
     *
     * @var {Array}
     */
    _with: any[];
    /**
     * The relationship counts that should be eager loaded on every query.
     *
     * @var {Array}
     */
    _withCount: any[];
    /**
     * The number of models to return for pagination.
     *
     * @var {Number}
     */
    _perPage: number;
    /**
     * Indicates if the model exists.
     *
     * @var {Boolean}
     */
    exists: boolean;
    /**
     * Indicates if the model was inserted during the current request lifecycle.
     *
     * @var {Boolean}
     */
    wasRecentlyCreated: boolean;
    /**
     * Check if the model needs to be booted and if so, do it.
     *
     * @return void
     */
    _bootIfNotBooted(): void;
    /**
     * Fill the model with an array of attributes.
     *
     * @return {Model}
     *
     * @throws MassAssignmentException
     * @param {Object} attributes
     */
    fill(attributes: any): Model;
    /**
     * Fill the model with an array of attributes. Force mass assignment.
     *
     * @return {Model}
     * @param {Array} attributes
     */
    forceFill(attributes: any[]): Model;
    /**
     * Qualify the given column name by the model's table.
     *
     * @return string
     * @param {String} column
     */
    qualifyColumn(column: string): string;
    /**
     * Remove the table name from a given key.
     *
     * @return string
     * @param {String} key
     */
    _removeTableFromKey(key: string): string;
    /**
     * Create a new instance of the given model.
     *
     * @return Model
     * @param {Object} attributes
     * @param {Boolean} exists
     */
    newInstance(attributes?: any, exists?: boolean): any;
    /**
     * Create a new model instance that is existing.
     *
     * @return Model
     * @param {Object} attributes
     * @param {Boolean} connection
     */
    newFromBuilder(attributes?: any, connection?: boolean): any;
    /**
     * Eager load relations on the model.
     *
     * @return {Model}
     * @param {String|Array<String>} relations
     */
    load(relations: string | Array<string>, ...args: any[]): Model;
    /**
     * Eager load relations on the model if they are not already eager loaded.
     *
     * @return {Model}
     * @param {String|Array<String>} relations
     */
    loadMissing(relations: string | Array<string>, ...args: any[]): Model;
    /**
     * Increment a column's value by a given amount.
     *
     * @param {String} column
     * @param {Number} amount
     * @param {Array} extra
     * @return int
     */
    _increment(column: string, amount?: number, extra?: any[]): any;
    /**
     * Decrement a column's value by a given amount.
     *
     * @param {String} column
     * @param {Number} amount
     * @param {Array} extra
     * @return int
     */
    _decrement(column: string, amount?: number, extra?: any[]): any;
    /**
     * Run the increment or decrement method on the model.
     *
     * @return int
     * @param {String} column
     * @param {Number} amount
     * @param {Array} extra
     * @param {String} method
     */
    _incrementOrDecrement(column: string, amount: number, extra: any[], method: string): any;
    /**
     * Increment the underlying attribute value and sync with original.
     *
     * @return void
     * @param {String} column
     * @param {Number} amount
     * @param {Array} extra
     * @param {String} method
     */
    _incrementOrDecrementAttributeValue(column: string, amount: number, extra: any[], method: string): void;
    /**
     * Update the model in the database.
     *
     * @return {Boolean}
     * @param {Object} attributes
     * @param {Object} options
     */
    update(attributes?: any, options?: any): boolean;
    /**
     * Save the model and all of its relationships.
     *
     * @return {Promise<Boolean>}
     */
    push(): Promise<boolean>;
    /**
     * Save the model to the database.
     *
     * @return {Promise<Boolean>}
     * @param {Object} options
     */
    save(options?: any): Promise<boolean>;
    /**
     * Save the model to the database using transaction.
     *
     * @return {Boolean}
     *
     * @throws \Throwable
     * @param {Object} options
     */
    saveOrFail(options?: any): boolean;
    /**
     * Perform any actions that are necessary after the model is saved.
     *
     * @return void
     * @param {Object} options
     */
    _finishSave(options: any): void;
    /**
     * Perform a model update operation.
     *
     * @return {Promise<Boolean>}
     * @param {ModelBuilder} query
     */
    _performUpdate(query: ModelBuilder): Promise<boolean>;
    /**
     * Set the keys for a save update query.
     *
     * @return {ModelBuilder}
     * @param {ModelBuilder} query
     */
    _setKeysForSaveQuery(query: ModelBuilder): ModelBuilder;
    /**
     * Get the primary key value for a save query.
     *
     * @return mixed
     */
    _getKeyForSaveQuery(): any;
    /**
     * Perform a model insert operation.
     *
     * @return {Promise<Boolean>}
     * @param {ModelBuilder} query
     */
    _performInsert(query: ModelBuilder): Promise<boolean>;
    /**
     * Insert the given attributes and set the ID on the model.
     *
     * @return void
     * @param {ModelBuilder} query
     * @param {Object} attributes
     */
    _insertAndSetId(query: ModelBuilder, attributes: any): Promise<void>;
    /**
     * Delete the model from the database.
     *
     * @return {Boolean}
     *
     * @throws \Exception
     */
    delete(): boolean;
    /**
     * Force a hard delete on a soft deleted model.
     *
     * This method protects developers from running forceDelete when trait is missing.
     *
     * @return {Boolean}
     */
    forceDelete(): boolean;
    /**
     * Perform the actual delete query on this model instance.
     *
     * @return void
     */
    _performDeleteOnModel(): Promise<void>;
    /**
     * Get a new query builder for the model's table.
     *
     * @return {ModelBuilder}
     */
    newQuery(): ModelBuilder;
    /**
     * Get a new query builder that doesn't have any global scopes or eager loading.
     *
     * @return {ModelBuilder}
     */
    newModelQuery(): ModelBuilder;
    /**
     * Get a new query builder with no relationships loaded.
     *
     * @return {ModelBuilder}
     */
    newQueryWithoutRelationships(): ModelBuilder;
    /**
     * Register the global scopes for this builder instance.
     *
     * @return {ModelBuilder}
     * @param {ModelBuilder} builder
     */
    registerGlobalScopes(builder: ModelBuilder): ModelBuilder;
    /**
     * Get a new query builder that doesn't have any global scopes.
     *
     * @return {ModelBuilder}
     */
    newQueryWithoutScopes(): ModelBuilder;
    /**
     * Get a new query instance without a given scope.
     *
     * @return {ModelBuilder}
     * @param scope
     */
    newQueryWithoutScope(scope: any): ModelBuilder;
    /**
     * Get a new query to restore one or more models by their queueable IDs.
     *
     * @return {ModelBuilder}
     * @param {Array|String|Number} ids
     */
    newQueryForRestoration(ids: any[] | string | number): ModelBuilder;
    /**
     * Create a new Eloquent query builder for the model.
     *
     * @return {ModelBuilder}
     * @param {QueryBuilder} query
     */
    newModelBuilder(query: QueryBuilder): ModelBuilder;
    /**
     * Get a new query builder instance for the connection.
     *
     * @return {QueryBuilder}
     */
    _newBaseQueryBuilder(): QueryBuilder;
    /**
     * Create a new Eloquent Collection instance.
     *
     * @return {Array<Model>}
     * @param {Array} models
     */
    newCollection(models?: any[]): Array<Model>;
    /**
     * Create a new pivot model instance.
     *
     * @return \Illuminate\Database\Eloquent\Relations\Pivot
     * @param {Model} parent
     * @param {String} attributes
     * @param {String} table
     * @param {Boolean} exists
     * @param {Pivot|null} using
     */
    newPivot(parent: Model, attributes: string, table: string, exists: boolean, using?: Model | null): any;
    /**
     * Convert the model instance to an array.
     *
     * @return {Object}
     */
    toArray(): any;
    /**
     * Convert the model instance to JSON.
     *
     * @return string
     *
     * @throws \Illuminate\Database\Eloquent\JsonEncodingException
     */
    toJson(): string;
    /**
     * Convert the object into something JSON serializable.
     *
     * @return {Object}
     */
    jsonSerialize(): any;
    /**
     * Reload a fresh model instance from the database.
     *
     * @return {Model}
     */
    fresh(withs?: any[], ...args: any[]): Model;
    /**
     * Reload the current model instance with fresh attributes from the database.
     *
     * @return {Model}
     */
    refresh(): Model;
    /**
     * Clone the model into a new, non-existing instance.
     *
     * @return {ModelBuilder}
     * @param {Array|null} except
     */
    replicate(except?: any[] | null): ModelBuilder;
    /**
     * Determine if two models have the same ID and belong to the same table.
     *
     * @return {Boolean}
     * @param  {Model|null}  model
     */
    is(model: Model | null): boolean;
    /**
     * Determine if two models are not the same.
     *
     * @return {Boolean}
     * @param {Model|null} model
     */
    isNot(model: Model | null): boolean;
    /**
     * Get the database connection for the model.
     *
     * @return {Connection}
     */
    getConnection(): Connection;
    /**
     * Get the current connection name for the model.
     *
     * @return string
     */
    getConnectionName(): any;
    /**
     * Set the connection associated with the model.
     *
     * @return {Model}
     * @param {String} name
     */
    setConnection(name: string): Model;
    /**
     * Get the table associated with the model.
     *
     * @return {String}
     */
    getTable(): string;
    /**
     * Set the table associated with the model.
     *
     * @return {Model}
     * @param {String} table
     */
    setTable(table: string): Model;
    /**
     * Get the primary key for the model.
     *
     * @return {String}
     */
    getKeyName(): string;
    /**
     * Set the primary key for the model.
     *
     * @return {Model}
     * @param {String} key
     */
    setKeyName(key: string): Model;
    /**
     * Get the table qualified key name.
     *
     * @return {String}
     */
    getQualifiedKeyName(): string;
    /**
     * Get the auto-incrementing key type.
     *
     * @return {String}
     */
    getKeyType(): string;
    /**
     * Set the data type for the primary key.
     *
     * @return {Model}
     * @param {String} type
     */
    setKeyType(type: string): Model;
    /**
     * Get the value indicating whether the IDs are incrementing.
     *
     * @return {Boolean}
     */
    getIncrementing(): boolean;
    /**
     * Set whether IDs are incrementing.
     *
     * @return {Model}
     * @param {Boolean} value
     */
    setIncrementing(value: boolean): Model;
    /**
     * Get the value of the model's primary key.
     *
     * @return {*}
     */
    getKey(): any;
    /**
     * Get the queueable identity for the entity.
     *
     * @return {*}
     */
    getQueueableId(): any;
    /**
     * Get the queueable connection for the entity.
     *
     * @return {String}
     */
    getQueueableConnection(): string;
    /**
     * Get the value of the model's route key.
     *
     * @return {String}
     */
    getRouteKey(): string;
    /**
     * Get the route key for the model.
     *
     * @return {String}
     */
    getRouteKeyName(): string;
    /**
     * Retrieve the model for a bound value.
     *
     * @return {ModelBuilder|null}
     * @param {*} value
     */
    resolveRouteBinding(value: any): ModelBuilder | null;
    /**
     * Get the default foreign key name for the model.
     *
     * @return {String}
     */
    getForeignKey(): string;
    /**
     * Get the number of models to return per page.
     *
     * @return int
     */
    getPerPage(): number;
    /**
     * Set the number of models to return per page.
     *
     * @return {Model}
     * @param {Number} perPage
     */
    setPerPage(perPage: number): Model;
    /**
     * Dynamically retrieve attributes on the model.
     *
     * @return {*}
     * @param {String} key
     */
    __get(key: string): any;
    /**
     * Dynamically set attributes on the model.
     *
     * @return void
     * @param {String} key
     * @param {*} value
     */
    __set(key: string, value: any): void;
    /**
     * Determine if the given attribute exists.
     *
     * @return {Boolean}
     * @param offset
     */
    offsetExists(offset: any): boolean;
    /**
     * Get the value for a given offset.
     *
     * @return mixed
     * @param {String} offset
     */
    offsetGet(offset: string): any;
    /**
     * Set the value for a given offset.
     *
     * @return void
     * @param {String} offset
     * @param {*} value
     */
    offsetSet(offset: string, value: any): void;
    /**
     * Unset the value for a given offset.
     *
     * @return void
     * @param {String} offset
     */
    offsetUnset(offset: string): void;
    _attributes: any;
    _relations: any;
    /**
     * Determine if an attribute or relation exists on the model.
     *
     * @return {Boolean}
     * @param {String} key
     */
    __isset(key: string): boolean;
    /**
     * Unset an attribute on the model.
     *
     * @return void
     * @param {String} key
     */
    __unset(key: string): void;
    /**
     * Handle dynamic method calls into the model.
     *
     * @return mixed
     * @param {String} method
     * @param {Array} parameters
     */
    __call(method: string, parameters: any[]): any;
    /**
     * Convert the model to its string representation.
     *
     * @return string
     */
    toString(): string;
    /**
     * When a model is being unserialized, check if it needs to be booted.
     *
     * @return void
     */
    __wakeup(): void;
}

export function ModelProxy(cls: any): any;
