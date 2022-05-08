import Model from "../Model";
import { QueryBuilder } from "../../query/Builder"
import { ModelBuilder } from "../Builder";

export default class Relation {
    /**
     * Indicates if the relation is adding constraints.
     *
     * @var {Boolean}
     */
    static _constraints: boolean;
    /**
     * An array to map class names to their morph names in database.
     *
     * @var {Array}
     */
    static morphMaps: any[];
    /**
     * The Eloquent query builder instance.
     *
     * @var {ModelBuilder}
     */
    _query: ModelBuilder;
    /**
     * The parent model instance.
     *
     * @var {Model}
     */
    _parent: Model;
    /**
     * The related model instance.
     *
     * @var {Model}
     */
    _related: any;
    /**
     * Run a callback with constraints disabled on the relation.
     *
     * @param  {Function}  callback
     * @return mixed
     */
    static noConstraints(callback: Function): any;
    /**
     * Set or get the morph map for polymorphic relations.
     *
     * @param  {Array|null}  map
     * @param  {Boolean}  merge
     * @return {Array}
     */
    static morphMap(map?: any[] | null, merge?: boolean): any[];
    /**
     * Builds a table-keyed array from model class names.
     *
     * @param  {String|Array|Object|null}  models
     * @return {Array}|null
     */
    static _buildMorphMapFromModels(models?: string | any[] | any | null): any[];
    /**
     * Get the model associated with a custom polymorphic type.
     *
     * @param  {String}  alias
     * @return {String|null}
     */
    static getMorphedModel(alias: string): string | null;
    /**
     * Create a new relation instance.
     *
     * @param  {ModelBuilder}  query
     * @param  {Model}  parent
     * @return void
     */
    constructor(query: ModelBuilder, parent: Model);
    /**
     * Set the base constraints on the relation query.
     *
     * @return void
     */
    addConstraints(): void;
    /**
     * Set the constraints for an eager load of the relation.
     *
     * @param  {Array}  models
     * @return void
     */
    addEagerConstraints(models: any[]): void;
    /**
     * Initialize the relation on a set of models.
     *
     * @param  {Array}   models
     * @param  {String}  relation
     * @return {Array}
     */
    initRelation(models: any[], relation: string): any[];
    /**
     * Match the eagerly loaded results to their parents.
     *
     * @param  {Array}   models
     * @param  {Array}  results
     * @param  {String}  relation
     * @return {Array}
     */
    match(models: any[], results: any[], relation: string): any[];
    /**
     * Get the results of the relationship.
     *
     * @return mixed
     */
    getResults(): void;
    /**
     * Get the relationship for eager loading.
     *
     * @return {Array}
     */
    getEager(): any[];
    /**
     * Execute the query as a "select" statement.
     *
     * @param  {Array}  columns
     * @return {Array}
     */
    get(columns?: any[]): any[];
    /**
     * Touch all of the related models for the relationship.
     *
     * @return void
     */
    touch(): void;
    /**
     * Run a raw update against the base query.
     *
     * @param  {Object}  attributes
     * @return {Number}
     */
    rawUpdate(attributes?: any): number;
    /**
     * Add the constraints for a relationship count query.
     *
     * @param  {ModelBuilder}  query
     * @param  {ModelBuilder}  parentQuery
     * @return {ModelBuilder}
     */
    getRelationExistenceCountQuery(query: ModelBuilder, parentQuery: ModelBuilder): ModelBuilder;
    /**
     * Add the constraints for an internal relationship existence query.
     *
     * Essentially, these queries compare on column names like whereColumn.
     *
     * @param  {ModelBuilder}  query
     * @param  {ModelBuilder}  parentQuery
     * @param  {Array} columns
     * @return {ModelBuilder}
     */
    getRelationExistenceQuery(query: ModelBuilder, parentQuery: ModelBuilder, columns?: any[]): ModelBuilder;
    /**
     * Get all of the primary keys for an array of models.
     *
     * @param  {Array<Model>}   models
     * @param  {String}  key
     * @return {Array}
     */
    _getKeys(models: Array<Model>, key?: string): any[];
    /**
     * Get the underlying query for the relation.
     *
     * @return {ModelBuilder}
     */
    getQuery(): ModelBuilder;
    /**
     * Get the base query builder driving the Eloquent builder.
     *
     * @return {QueryBuilder}
     */
    getBaseQuery(): QueryBuilder;
    /**
     * Get the parent model of the relation.
     *
     * @return {Model}
     */
    getParent(): Model;
    /**
     * Get the fully qualified parent key name.
     *
     * @return {String}
     */
    getQualifiedParentKeyName(): string;
    /**
     * Get the related model of the relation.
     *
     * @return {Model}
     */
    getRelated(): Model;
    /**
     * Get the name of the "created at" column.
     *
     * @return {String}
     */
    createdAt(): string;
    /**
     * Get the name of the "updated at" column.
     *
     * @return {String}
     */
    updatedAt(): string;
    /**
     * Get the name of the related model's "updated at" column.
     *
     * @return {String}
     */
    relatedUpdatedAt(): string;
    /**
     * Get the name of the "where in" method for eager loading.
     *
     * @param  {Model}  model
     * @param  {String}  key
     * @return {String}
     */
    _whereInMethod(model: Model, key: string): string;
    /**
     * Handle dynamic method calls to the relationship.
     *
     * @param  {String}  method
     * @param  {Array}   parameters
     * @return mixed
     */
    __call(method: string, parameters: any[]): any;
    /**
     * Force a clone of the underlying query builder when cloning.
     *
     * @return void
     */
    clone(): void;
}
