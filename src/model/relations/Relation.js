import _ from 'lodash'
import { QueryBuilder } from '../../query/Builder'
import { ModelBuilder } from '../Builder'
import Model from '../Model'
import Expression from '../../query/Expression'

class Relation {
  // use ForwardsCalls, Macroable { // TODO
  //   __call as macroCall;
  // }

  /**
   * The Eloquent query builder instance.
   *
   * @var {ModelBuilder}
   */
  _query;

  /**
   * The parent model instance.
   *
   * @var {Model}
   */
  _parent;

  /**
   * The related model instance.
   *
   * @var {Model}
   */
  _related;

  /**
   * Indicates if the relation is adding constraints.
   *
   * @var {Boolean}
   */
  static _constraints = true;

  /**
   * An array to map class names to their morph names in database.
   *
   * @var {Array}
   */
  static morphMaps = [];

  /**
   * Create a new relation instance.
   *
   * @param  {ModelBuilder}  query
   * @param  {Model}  parent
   * @return void
   */
  constructor (query, parent)
  {
    this._query = query;
    this._parent = parent;
    this.related = query['getModel']();

    this.addConstraints();
  }

  /**
   * Run a callback with constraints disabled on the relation.
   *
   * @param  {Function}  callback
   * @return mixed
   */
  static noConstraints(callback)
  {
    let previous = this._constraints;

    this._constraints = false;

    // When resetting the relation where clause, we want to shift the first element
    // off of the bindings, leaving only the constraints that the developers put
    // as "extra" on the relationships, and not original relation constraints.
    try {
      return callback();
    } finally {
      this._constraints = previous;
    }
  }

  /**
   * Set the base constraints on the relation query.
   *
   * @return void
   */
  addConstraints() {}

  /**
   * Set the constraints for an eager load of the relation.
   *
   * @param  {Array}  models
   * @return void
   */
  addEagerConstraints(models) {}

  /**
   * Initialize the relation on a set of models.
   *
   * @param  {Array}   models
   * @param  {String}  relation
   * @return {Array}
   */
  initRelation(models, relation) {}

  /**
   * Match the eagerly loaded results to their parents.
   *
   * @param  {Array}   models
   * @param  {Array}  results
   * @param  {String}  relation
   * @return {Array}
   */
  match(models, results, relation) {}

  /**
   * Get the results of the relationship.
   *
   * @return mixed
   */
  getResults() {}

  /**
   * Get the relationship for eager loading.
   *
   * @return {Array}
   */
  getEager()
  {
    return this.get();
  }

  /**
   * Execute the query as a "select" statement.
   *
   * @param  {Array}  columns
   * @return {Array}
   */
  get(columns = ['*'])
  {
    return this._query['get'](columns);
  }

  /**
   * Touch all of the related models for the relationship.
   *
   * @return void
   */
  touch()
  {
    let model = this.getRelated();

    if (! model.constructor.isIgnoringTouch()) {
      this.rawUpdate({
          [model.getUpdatedAtColumn()]: model.freshTimestampString(),
      })
    }
  }

  /**
   * Run a raw update against the base query.
   *
   * @param  {Object}  attributes
   * @return {Number}
   */
  rawUpdate(attributes = {})
  {
    return this._query['withoutGlobalScopes']().update(attributes);
  }

  /**
   * Add the constraints for a relationship count query.
   *
   * @param  {ModelBuilder}  query
   * @param  {ModelBuilder}  parentQuery
   * @return {ModelBuilder}
   */
  getRelationExistenceCountQuery(query, parentQuery)
  {
    return this.getRelationExistenceQuery(
      query, parentQuery, new Expression('count(*)')
    ).setBindings([], 'select');
  }

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
  getRelationExistenceQuery(query, parentQuery, columns = ['*'])
  {
    return query['select'](columns)['whereColumn'](
      this.getQualifiedParentKeyName(), '=', this['getExistenceCompareKey']()
    );
  }

  /**
   * Get all of the primary keys for an array of models.
   *
   * @param  {Array<Model>}   models
   * @param  {String}  key
   * @return {Array}
   */
  _getKeys(models, key = null)
  {
    return _.sortedUniq(models.map((value) => {
      return key ? value.getAttribute(key) : value.getKey();
    }));
  }

  /**
   * Get the underlying query for the relation.
   *
   * @return {ModelBuilder}
   */
  getQuery()
  {
    return this._query;
  }

  /**
   * Get the base query builder driving the Eloquent builder.
   *
   * @return {QueryBuilder}
   */
  getBaseQuery()
  {
    return this._query['getQuery']();
  }

  /**
   * Get the parent model of the relation.
   *
   * @return {Model}
   */
  getParent()
  {
    return this._parent;
  }

  /**
   * Get the fully qualified parent key name.
   *
   * @return {String}
   */
  getQualifiedParentKeyName()
  {
    return this._parent.getQualifiedKeyName();
  }

  /**
   * Get the related model of the relation.
   *
   * @return {Model}
   */
  getRelated()
  {
    return this.related;
  }

  /**
   * Get the name of the "created at" column.
   *
   * @return {String}
   */
  createdAt()
  {
    return this._parent.getCreatedAtColumn();
  }

  /**
   * Get the name of the "updated at" column.
   *
   * @return {String}
   */
  updatedAt()
  {
    return this._parent.getUpdatedAtColumn();
  }

  /**
   * Get the name of the related model's "updated at" column.
   *
   * @return {String}
   */
  relatedUpdatedAt()
  {
    return this.related.getUpdatedAtColumn();
  }

  /**
   * Get the name of the "where in" method for eager loading.
   *
   * @param  {Model}  model
   * @param  {String}  key
   * @return {String}
   */
  _whereInMethod(model, key)
  {
    return model.getKeyName() === _.last(key.split('.'))
      && model.getIncrementing()
      && ['int', 'integer'].includes(model.getKeyType())
        ? 'whereIntegerInRaw'
        : 'whereIn';
  }

  /**
   * Set or get the morph map for polymorphic relations.
   *
   * @param  {Array|null}  map
   * @param  {Boolean}  merge
   * @return {Array}
   */
  static morphMap(map = null, merge = true)
  {
    map = this._buildMorphMapFromModels(map);

    if (map instanceof Array) {
      this.morphMaps = merge && this.morphMaps
        ? [...map, ...this.morphMaps] : map;
    }

    return this.morphMaps;
  }

  /**
   * Builds a table-keyed array from model class names.
   *
   * @param  {String|Array|Object|null}  models
   * @return {Array}|null
   */
  static _buildMorphMapFromModels(models = null)
  {
    if (models == null || models instanceof Object) {
      return models;
    }

    return _.zipObject(models.map(function (model) {
      return (new model()).getTable();
    }), models);
  }

  /**
   * Get the model associated with a custom polymorphic type.
   *
   * @param  {String}  alias
   * @return {String|null}
   */
  static getMorphedModel(alias)
  {
    return this.morphMaps[alias] || null;
  }

  /**
   * Handle dynamic method calls to the relationship.
   *
   * @param  {String}  method
   * @param  {Array}   parameters
   * @return mixed
   */
  __call(method, parameters)
  {
    // if (this.constructor.hasMacro(method)) { // TODO
    //   return this.macroCall(method, parameters);
    // }

    let result = this._query[method](...parameters) // this.forwardCallTo(this._query, method, parameters);

    if (result === this._query) {
      return this;
    }

    return result;
  }

  /**
   * Force a clone of the underlying query builder when cloning.
   *
   * @return void
   */
  clone()
  {
    this._query = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
  }
}

Relation.prototype = new Proxy(Relation.prototype, {
  get (target, p) {
    if (p in target) return target[p];
    return new Proxy(target.__call, {
      apply (target, thisArg, argArray) {
        return target.call(thisArg, p, argArray)
      }
    });
  }
});

export { Relation }
export default Relation
