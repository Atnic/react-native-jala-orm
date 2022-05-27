import Model from "./Model";
import Scope from "./Scope";
import Relation from "./relations/Relation";
import QueryBuilder from "../query/Builder";
import BaseQueryBuilder from "../query/BaseBuilder";

/**
 * @mixes QueryBuilder
 * @mixes BuildsQueries
 * @mixin
 */
export default class Builder extends QueryBuilder {
    /**
     * All of the globally registered builder macros.
     *
     * @var {Object}
     */
    static _macros: any;
    /**
     * Dynamically handle calls into the query instance.
     *
     * @param  {String}  method
     * @param  {Array}  parameters
     * @return {*}
     *
     * @throws \BadMethodCallException
     */
    static __callStatic(method: string, parameters: any[]): any;
    /**
     * Create a new Eloquent query builder instance.
     *
     * @param  {QueryBuilder}  query
     * @return void
     */
    constructor(query: QueryBuilder);
    /**
     * The base query builder instance.
     *
     * @var {QueryBuilder}
     */
    _query: QueryBuilder;
    /**
     * The model being queried.
     *
     * @var {Model}
     */
    _model: any;
    /**
     * The relationships that should be eager loaded.
     *
     * @var {Object}
     */
    _eagerLoad: {};
    /**
     * All of the locally registered builder macros.
     *
     * @var {Object}
     */
    _localMacros: {};
    /**
     * A replacement for the typical delete function.
     *
     * @var {Function}
     */
    _onDelete: any;
    /**
     * The methods that should be returned from query builder.
     *
     * @var {Array}
     */
    _passthru: string[];
    /**
     * Applied global scopes.
     *
     * @var {Object}
     */
    _scopes: {};
    /**
     * Removed global scopes.
     *
     * @var {Array}
     */
    _removedScopes: any[];
    /**
     * Create and return an un-saved model instance.
     *
     * @param  {Object}  attributes
     * @return {Model}
     */
    make(attributes?: any): Model;
    /**
     * Register a new global scope.
     *
     * @param  {String}  identifier
     * @param  {Scope|Function}  scope
     * @return {Builder}
     */
    withGlobalScope(identifier: string, scope: Scope | Function): Builder;
    /**
     * Remove a registered global scope.
     *
     * @param  {Scope|String}  scope
     * @return {Builder}
     */
    withoutGlobalScope(scope: Scope | string): Builder;
    /**
     * Remove all or passed registered global scopes.
     *
     * @param  {Array|null}  scopes
     * @return {Builder}
     */
    withoutGlobalScopes(scopes?: any[] | null): Builder;
    /**
     * Get an array of global scopes that were removed from the query.
     *
     * @return {Array}
     */
    removedScopes(): any[];
    /**
     * Add a where clause on the primary key to the query.
     *
     * @param  {Number|String}  id
     * @return {Builder}
     */
    whereKey(id: number | string): Builder;
    /**
     * Add a where clause on the primary key to the query.
     *
     * @param  {Number|String}  id
     * @return {Builder}
     */
    whereKeyNot(id: number | string): Builder;
    /**
     * Add a basic where clause to the query.
     *
     * @param  {String|Array|Function}  column
     * @param  {String|Array|Number|Function|null}   operator
     * @param  {String|Array|Number|Function|null}   value
     * @param  {String}  boolean
     * @return {Builder}
     */
    where(column: string | any[] | Function, operator?: string | any[] | number | Function | null, value?: string | any[] | number | Function | null, boolean?: string, ...args: any[]): Builder;
    /**
     * Add an "or where" clause to the query.
     *
     * @param  {Function|Array|String}  column
     * @param  {String|Array|Number|Function|null}   operator
     * @param  {String|Array|Number|Function|null}   value
     * @return {Builder}
     */
    orWhere(column: Function | any[] | string, operator?: string | any[] | number | Function | null, value?: string | any[] | number | Function | null, ...args: any[]): Builder;
    /**
     * Add an "order by" clause for a timestamp to the query.
     *
     * @param  {String}  column
     * @return {Builder}
     */
    latest(column?: string): BaseQueryBuilder & Builder;
    /**
     * Add an "order by" clause for a timestamp to the query.
     *
     * @param  {String}  column
     * @return {Builder}
     */
    oldest(column?: string): BaseQueryBuilder & Builder;
    /**
     * Create a collection of models from plain arrays.
     *
     * @param  {Array}  items
     * @return {Array}
     */
    hydrate(items: any[]): any[];
    /**
     * Create a collection of models from a raw query.
     *
     * @param  {String}  query
     * @param  {Array}  bindings
     * @return {Array}
     */
    fromQuery(query: string, bindings?: any[]): any[];
    /**
     * Find a model by its primary key.
     *
     * @param  {Number|String}  id
     * @param  {Array}  columns
     * @return {Model|Array<Model>|null}
     */
    find(id: number | string, columns?: any[]): Model | Array<Model> | null;
    /**
     * Find multiple models by their primary keys.
     *
     * @param  {Array}  ids
     * @param  {Array|Object}  columns
     * @return {Array}
     */
    findMany(ids: any[], columns?: any[] | any): any[];
    /**
     * Find a model by its primary key or throw an exception.
     *
     * @param  {Number|String}  id
     * @param  {Array}  columns
     * @return {Model}|{Array}|static|static[]
     *
     * @throws {Model}NotFoundException
     */
    findOrFail(id: number | string, columns?: any[]): Model;
    /**
     * Find a model by its primary key or return fresh model instance.
     *
     * @param  {Number|String}  id
     * @param  {Array}  columns
     * @return {Model}
     */
    findOrNew(id: number | string, columns?: any[]): Model;
    /**
     * Get the first record matching the attributes or instantiate it.
     *
     * @param  {Object}  attributes
     * @param  {Object}  values
     * @return {Model}
     */
    firstOrNew(attributes: any, values?: any): Model;
    /**
     * Get the first record matching the attributes or create it.
     *
     * @param  {Object}  attributes
     * @param  {Object}  values
     * @return {Model}
     */
    firstOrCreate(attributes: any, values?: any): Model;
    /**
     * Create or update a record matching the attributes, and fill it with values.
     *
     * @param  {Object}  attributes
     * @param  {Object}  values
     * @return {Model}
     */
    updateOrCreate(attributes: any, values?: any): Model;
    /**
     * Execute the query and get the first result or throw an exception.
     *
     * @param  {Array|Object}  columns
     * @return {Model}
     *
     * @throws {Model}NotFoundException
     */
    firstOrFail(columns?: any[] | any): Model;
    /**
     * Execute the query and get the first result or call a callback.
     *
     * @param  {Function|Array}  columns
     * @param  {Function|null}  callback
     * @return {Model|*}
     */
    firstOr(columns?: Function | any[], callback?: Function | null): Model | any;
    /**
     * Get a single column's value from the first result of a query.
     *
     * @param  {String}  column
     * @return {*}
     */
    value(column: string): any;
    /**
     * Execute the query as a "select" statement.
     *
     * @param  {Array|Object}  columns
     * @return {Promise<Array>}
     */
    get(columns?: any[] | any): Promise<any[]>;
    /**
     * Get the hydrated models without eager loading.
     *
     * @param  {Array}  columns
     * @return {Promise<Array<Model>>}
     */
    getModels(columns?: any[]): Promise<Array<Model>>;
    /**
     * Eager load the relationships for the models.
     *
     * @param  {Array}  models
     * @return {Array}
     */
    eagerLoadRelations(models: any[]): any[];
    /**
     * Eagerly load the relationship on a set of models.
     *
     * @param  {Array}  models
     * @param  {String}  name
     * @param  {Function}  constraints
     * @return {Array}
     */
    _eagerLoadRelation(models: any[], name: string, constraints: Function): any[];
    /**
     * Get the relation instance for the given relation name.
     *
     * @param  {String}  name
     * @return {Relation}
     */
    getRelation(name: string): Relation;
    /**
     * Get the deeply nested relations for a given top-level relation.
     *
     * @param  {String}  relation
     * @return {Array}
     */
    _relationsNestedUnder(relation: string): any[];
    /**
     * Determine if the relationship is nested.
     *
     * @param  {String}  relation
     * @param  {String}  name
     * @return bool
     */
    _isNestedUnder(relation: string, name: string): any;
    /**
     * Get a generator for the given query.
     *
     * @return {any}
     */
    cursor(): any;
    /**
     * Chunk the results of a query by comparing numeric IDs.
     *
     * @param  {Number}  count
     * @param  {Function}  callback
     * @param  {String|null}  column
     * @param  {String|null}  alias
     * @return bool
     */
    chunkById(count: number, callback: Function, column?: string | null, alias?: string | null): boolean;
    /**
     * Add a generic "order by" clause if the query doesn't already have one.
     *
     * @return void
     */
    _enforceOrderBy(): void;
    /**
     * Get an array with the values of a given column.
     *
     * @param  {String}  column
     * @param  {String|null}  key
     * @return {Promise<any>}
     */
    pluck(column: string, key?: string | null): Promise<any>;
    /**
     * Paginate the given query.
     *
     * @param  {Number}  perPage
     * @param  {Array}  columns
     * @param  {String}  pageName
     * @param  {Number|null}  page
     * @return \Illuminate\Contracts\Pagination\LengthAwarePaginator
     *
     * @throws \InvalidArgumentException
     */
    paginate(perPage?: number, columns?: any[], pageName?: string, page?: number | null): any;
    /**
     * Paginate the given query into a simple paginator.
     *
     * @param  {Number}  perPage
     * @param  {Array}  columns
     * @param  {String}  pageName
     * @param  {Number|null}  page
     * @return \Illuminate\Contracts\Pagination\Paginator
     */
    simplePaginate(perPage?: number, columns?: any[], pageName?: string, page?: number | null): any;
    /**
     * Save a new model and return the instance.
     *
     * @param  {Object}  attributes
     * @return {Model}
     */
    create(attributes?: any): Model;
    /**
     * Save a new model and return the instance. Allow mass-assignment.
     *
     * @param  {Object}  attributes
     * @return {Model}
     */
    forceCreate(attributes: any): Model;
    /**
     * Update a record in the database.
     *
     * @param  {Array}  values
     * @return {Number}
     */
    update(values: any[]): number;
    /**
     * Increment a column's value by a given amount.
     *
     * @param  {String}  column
     * @param  {Number}  amount
     * @param  {Array}  extra
     * @return {Number}
     */
    increment(column: string, amount?: number, extra?: any[]): number;
    /**
     * Decrement a column's value by a given amount.
     *
     * @param  {String}  column
     * @param  {Number}  amount
     * @param  {Object}  extra
     * @return {Number}
     */
    decrement(column: string, amount?: number, extra?: any): number;
    /**
     * Add the "updated at" column to an array of values.
     *
     * @param  {Object}  values
     * @return {Object}
     */
    _addUpdatedAtColumn(values: any): any;
    /**
     * Delete a record from the database.
     *
     * @return {*}
     */
    delete(): any;
    /**
     * Run the default delete function on the builder.
     *
     * Since we do not apply scopes here, the row will actually be deleted.
     *
     * @return {*}
     */
    forceDelete(): any;
    /**
     * Register a replacement for the default delete function.
     *
     * @param  {Function}  callback
     * @return void
     */
    onDelete(callback: Function): void;
    /**
     * Call the given local model scopes.
     *
     * @param  {Array}  scopes
     * @return {Builder}
     */
    scopes(scopes: any[]): Builder;
    /**
     * Apply the scopes to the Eloquent builder instance and return it.
     *
     * @return {Builder}
     */
    applyScopes(): Builder;
    /**
     * Apply the given scope on the current builder instance.
     *
     * @param  {Function}  scope
     * @param  {Object}  parameters
     * @return {*}
     */
    _callScope(scope: Function, parameters?: any): any;
    /**
     * Nest where conditions by slicing them at the given where count.
     *
     * @param  {QueryBuilder}  query
     * @param  {Number}  originalWhereCount
     * @return void
     */
    _addNewWheresWithinGroup(query: QueryBuilder, originalWhereCount: number): void;
    /**
     * Slice where conditions at the given offset and add them to the query as a nested condition.
     *
     * @param  {QueryBuilder}  query
     * @param  {Object}  whereSlice
     * @return void
     */
    _groupWhereSliceForScope(query: QueryBuilder, whereSlice: any): void;
    /**
     * Create a where array with nested where conditions.
     *
     * @param  {Object}  whereSlice
     * @param  {String}  boolean
     * @return {Object}
     */
    _createNestedWhere(whereSlice: any, boolean?: string): any;
    /**
     * Set the relationships that should be eager loaded.
     *
     * @param  {Array}  relations
     * @return {Builder}
     */
    with(relations: any[], ...args: any[]): Builder;
    /**
     * Prevent the specified relations from being eager loaded.
     *
     * @param  {Array}  relations
     * @return {Builder}
     */
    without(relations: any[]): Builder;
    /**
     * Create a new instance of the model being queried.
     *
     * @param  {Object}  attributes
     * @return {Model}
     */
    newModelInstance(attributes?: any): Model;
    /**
     * Parse a list of relations into individuals.
     *
     * @param  {Array|Object}  relations
     * @return {Array}
     */
    _parseWithRelations(relations: any[] | any): any[];
    /**
     * Create a constraint to select the given columns for the relation.
     *
     * @param  {String}  name
     * @return {Array}
     */
    _createSelectWithConstraint(name: string): any[];
    /**
     * Parse the nested relationships in a relation.
     *
     * @param  {String}  name
     * @param  {Object}  results
     * @return {Object}
     */
    _addNestedWiths(name: string, results: any): any;
    /**
     * Get the underlying query builder instance.
     *
     * @return {QueryBuilder}
     */
    getQuery(): QueryBuilder;
    /**
     * Set the underlying query builder instance.
     *
     * @param  {QueryBuilder}  query
     * @return {Builder}
     */
    setQuery(query: QueryBuilder): Builder;
    /**
     * Get a base query builder instance.
     *
     * @return {QueryBuilder}
     */
    toBase(): QueryBuilder;
    /**
     * Get the relationships being eagerly loaded.
     *
     * @return {Object}
     */
    getEagerLoads(): any;
    /**
     * Set the relationships being eagerly loaded.
     *
     * @param  {Object}  eagerLoad
     * @return {Builder}
     */
    setEagerLoads(eagerLoad: any): Builder;
    /**
     * Get the model instance being queried.
     *
     * @return {Model}
     */
    getModel(): Model;
    /**
     * Set a model instance for the model being queried.
     *
     * @param  {Model}  model
     * @return {Builder}
     */
    setModel(model: Model): Builder;
    /**
     * Qualify the given column name by the model's table.
     *
     * @param  {String}  column
     * @return string
     */
    qualifyColumn(column: string): any;
    /**
     * Get the given macro by name.
     *
     * @param  {String}  name
     * @return {Function}
     */
    getMacro(name: string): Function;
    /**
     * Dynamically access builder proxies.
     *
     * @param  {String}  key
     * @return {*}
     *
     * @throws {Error}
     */
    __get(key: string): any;
    /**
     * Dynamically handle calls into the query instance.
     *
     * @param  {String}  method
     * @param  {Array}  parameters
     * @return {*}
     */
    __call(method: string, parameters: any[]): any;
    /**
     * Force a clone of the underlying query builder when cloning.
     *
     * @return void
     */
    clone(): void;
}

/**
 * @class
 * @mixes Builder
 */
export type ModelBuilder = Builder;
