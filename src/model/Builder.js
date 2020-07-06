import _ from 'lodash'
import Model from './Model'
import Scope from './Scope'
import { QueryBuilder } from '../query/Builder'
import Relation from './relations/Relation'
import BuildsQueries from '../concerns/BuildsQueries'

const BuilderProxy = function (cls) {
  return new Proxy(Builder, {
    get (target, p) {
      if (p in target) return target[p];
      if (['macro'].includes(p) || target._macros[p] instanceof Function)
        return new Proxy(target.__callStatic, {
          apply (target, thisArg, argArray) {
            return target.call(thisArg, p, argArray)
          }
        });
      return null
    }
  })
}

const BuilderInstanceProxy = function (cls) {
  return new Proxy(cls, {
    get (target, p) {
      if (p === Symbol.toStringTag) return 'Builder'
      if (p in target || [
        '_query',
        '_model',
        '_eagerLoad',
        '_localMacros',
        '_onDelete',
        '_passthru',
        '_scopes',
        '_removedScopes'
      ].includes(p)) return target[p];
      if (['macro'].includes(p) ||
        target._localMacros[p] instanceof Function ||
        target.constructor._macros[p] instanceof Function ||
        target._model['scope' + _.upperFirst(_.camelCase(p))] instanceof Function ||
        target._passthru[p] instanceof Function ||
        target._query[p] instanceof Function
      ) return new Proxy(target.__call, {
          apply (target, thisArg, argArray) {
            return target.call(thisArg, p, argArray)
          }
        });
      return target.__get(p)
    }
  })
}

/**
 * @mixes QueryBuilder
 * @mixes BuildsQueries
 * @mixin
 */
class Builder {
  /**
   * The base query builder instance.
   *
   * @var {QueryBuilder}
   */
  _query;

  /**
   * The model being queried.
   *
   * @var {Model}
   */
  _model;

  /**
   * The relationships that should be eager loaded.
   *
   * @var {Object}
   */
  _eagerLoad = {};

  /**
   * All of the globally registered builder macros.
   *
   * @var {Object}
   */
  static _macros = {};

  /**
   * All of the locally registered builder macros.
   *
   * @var {Object}
   */
  _localMacros = {};

  /**
   * A replacement for the typical delete function.
   *
   * @var {Function}
   */
  _onDelete;

  /**
   * The methods that should be returned from query builder.
   *
   * @var {Array}
   */
  _passthru = [
    'insert', 'insertOrIgnore', 'insertGetId', 'insertUsing', 'getBindings', 'toSql', 'dump', 'dd',
    'exists', 'doesntExist', 'count', 'min', 'max', 'avg', 'average', 'sum', 'getConnection',
  ];

  /**
   * Applied global scopes.
   *
   * @var {Object}
   */
  _scopes = {};

  /**
   * Removed global scopes.
   *
   * @var {Array}
   */
  _removedScopes = [];

  /**
   * Create a new Eloquent query builder instance.
   *
   * @param  {QueryBuilder}  query
   * @return void
   */
  constructor (query)
  {
    this._query = query;

    return BuilderInstanceProxy(this);
  }

  /**
   * Create and return an un-saved model instance.
   *
   * @param  {Object}  attributes
   * @return {Model}
   */
  make(attributes = [])
  {
    return this.newModelInstance(attributes);
  }

  /**
   * Register a new global scope.
   *
   * @param  {String}  identifier
   * @param  {Scope|Function}  scope
   * @return {Builder}
   */
  withGlobalScope(identifier, scope)
  {
    this._scopes = {
      ...this._scopes,
      [identifier]: scope
    };

    if (_.isFunction(scope['extend'])) {
      scope['extend'](this);
    }

    return this;
  }

  /**
   * Remove a registered global scope.
   *
   * @param  {Scope|String}  scope
   * @return {Builder}
   */
  withoutGlobalScope(scope)
  {
    if (! _.isString(scope)) {
      // scope = scope;
    }

    let scopes = {...this._scopes}
    delete scopes[scope];
    this._scopes = {...scopes}

    this._removedScopes = [...this._removedScopes, scope];

    return this;
  }

  /**
   * Remove all or passed registered global scopes.
   *
   * @param  {Array|null}  scopes
   * @return {Builder}
   */
  withoutGlobalScopes(scopes = null)
  {
    if (! _.isArray(scopes)) {
      scopes = _.keys(this._scopes);
    }

    (scopes || []).forEach(scope => {
      this.withoutGlobalScope(scope);
    })

    return this;
  }

  /**
   * Get an array of global scopes that were removed from the query.
   *
   * @return {Array}
   */
  removedScopes()
  {
    return this._removedScopes;
  }

  /**
   * Add a where clause on the primary key to the query.
   *
   * @param  {Number|String}  id
   * @return {Builder}
   */
  whereKey(id)
  {
    if (_.isArray(id)) {
      this._query['whereIn'](this._model.getQualifiedKeyName(), id);

      return this;
    }

    return this.where(this._model.getQualifiedKeyName(), '=', id);
  }

  /**
   * Add a where clause on the primary key to the query.
   *
   * @param  {Number|String}  id
   * @return {Builder}
   */
  whereKeyNot(id)
  {
    if (_.isArray(id)) {
      this._query['whereNotIn'](this._model.getQualifiedKeyName(), id)

      return this;
    }

    return this.where(this._model.getQualifiedKeyName(), '!=', id);
  }

  /**
   * Add a basic where clause to the query.
   *
   * @param  {String|Array|Function}  column
   * @param  {String|Array|Number|Function|null}   operator
   * @param  {String|Array|Number|Function|null}   value
   * @param  {String}  boolean
   * @return {Builder}
   */
  where(column, operator = null, value = null, boolean = 'and')
  {
    if (column instanceof Function) {
      let query = this._model.newModelQuery();
      column(query);

      this._query.addNestedWhereQuery(query.getQuery(), boolean);
    } else {
      this._query.where(...arguments);
    }

    return this;
  }

  /**
   * Add an "or where" clause to the query.
   *
   * @param  {Function|Array|String}  column
   * @param  {String|Array|Number|Function|null}   operator
   * @param  {String|Array|Number|Function|null}   value
   * @return {Builder}
   */
  orWhere(column, operator = null, value = null)
  {
    [value, operator] = this._query['prepareValueAndOperator'](
      value, operator, [...arguments].length === 2
    );

    return this.where(column, operator, value, 'or');
  }

  /**
   * Add an "order by" clause for a timestamp to the query.
   *
   * @param  {String}  column
   * @return {Builder}
   */
  latest(column = null)
  {
    if (_.isNull(column)) {
      column = this._model.getCreatedAtColumn() ?? 'created_at';
    }

    this._query['latest'](column);

    return this;
  }

  /**
   * Add an "order by" clause for a timestamp to the query.
   *
   * @param  {String}  column
   * @return {Builder}
   */
  oldest(column = null)
  {
    if (_.isNull(column)) {
      column = this._model.getCreatedAtColumn() || 'created_at';
    }

    this._query['oldest'](column);

    return this;
  }

  /**
   * Create a collection of models from plain arrays.
   *
   * @param  {Array}  items
   * @return {Array}
   */
  hydrate(items)
  {
    let instance = this.newModelInstance();

    return instance.newCollection(items.map((item) => {
      return instance.newFromBuilder(item);
    }))
  }

  /**
   * Create a collection of models from a raw query.
   *
   * @param  {String}  query
   * @param  {Array}  bindings
   * @return {Array}
   */
  fromQuery(query, bindings = [])
  {
    return this.hydrate(
      this._query.getConnection().select(query, bindings)
    )
  }

  /**
   * Find a model by its primary key.
   *
   * @param  {Number|String}  id
   * @param  {Array}  columns
   * @return {Model|Array<Model>|null}
   */
  find(id, columns = ['*'])
  {
    if (_.isArray(id)) {
      return this.findMany(id, columns);
    }

    return this.whereKey(id).first(columns);
  }

  /**
   * Find multiple models by their primary keys.
   *
   * @param  {Array}  ids
   * @param  {Array|Object}  columns
   * @return {Array}
   */
  findMany(ids, columns = ['*'])
  {
    // ids = ids instanceof Arrayable ? ids.toArray() : ids;

    if (_.isEmpty(ids)) {
      return this._model.newCollection();
    }

    return this.whereKey(ids).get(columns);
  }

  /**
   * Find a model by its primary key or throw an exception.
   *
   * @param  {Number|String}  id
   * @param  {Array}  columns
   * @return {Model}|{Array}|static|static[]
   *
   * @throws {Model}NotFoundException
   */
  findOrFail(id, columns = ['*'])
  {
    let result = this.find(id, columns);

    if (_.isArray(id)) {
      if (result.length === _.uniq(id).length) {
        return result;
      }
    } else if (! _.isNull(result)) {
      return result;
    }

    throw (new ModelNotFoundException).setModel(
      this._model.constructor, id
    );
  }

  /**
   * Find a model by its primary key or return fresh model instance.
   *
   * @param  {Number|String}  id
   * @param  {Array}  columns
   * @return {Model}
   */
  findOrNew(id, columns = ['*'])
  {
    let model = this.find(id, columns);
    if (! _.isNull(model)) {
      return model;
    }

    return this.newModelInstance();
  }

  /**
   * Get the first record matching the attributes or instantiate it.
   *
   * @param  {Object}  attributes
   * @param  {Object}  values
   * @return {Model}
   */
  firstOrNew(attributes, values = {})
  {
    let instance = this.where(attributes).first()
    if (! _.isNull(instance)) {
      return instance;
    }

    return this.newModelInstance({...attributes, ...values});
  }

  /**
   * Get the first record matching the attributes or create it.
   *
   * @param  {Object}  attributes
   * @param  {Object}  values
   * @return {Model}
   */
  firstOrCreate(attributes, values = {})
  {
    let instance = this.where(attributes).first()
    if (! _.isNull(instance)) {
      return instance;
    }

    return _.tap(this.newModelInstance({...attributes, ...values}), (instance) => {
      instance.save();
    });
  }

  /**
   * Create or update a record matching the attributes, and fill it with values.
   *
   * @param  {Object}  attributes
   * @param  {Object}  values
   * @return {Model}
   */
  updateOrCreate(attributes, values = {})
  {
    return _.tap(this.firstOrNew(attributes), (instance) => {
      instance.fill(values).save();
    });
  }

  /**
   * Execute the query and get the first result or throw an exception.
   *
   * @param  {Array|Object}  columns
   * @return {Model}
   *
   * @throws {Model}NotFoundException
   */
  firstOrFail(columns = ['*'])
  {
    let model = this.first(columns)
    if (! _.isNull(model)) {
      return model;
    }

    throw (new ModelNotFoundException).setModel(this._model.constructor); // TODO
  }

  /**
   * Execute the query and get the first result or call a callback.
   *
   * @param  {Function|Array}  columns
   * @param  {Function|null}  callback
   * @return {Model|*}
   */
  firstOr(columns = ['*'], callback = null)
  {
    if (columns instanceof Function) {
      callback = columns;

      columns = ['*'];
    }

    let model = this.first(columns)
    if (! _.isNull(model)) {
      return model;
    }

    return callback();
  }

  /**
   * Get a single column's value from the first result of a query.
   *
   * @param  {String}  column
   * @return {*}
   */
  value(column)
  {
    let result = this.first([column])
    if (result) {
      return result[column];
    }
  }

  /**
   * Execute the query as a "select" statement.
   *
   * @param  {Array|Object}  columns
   * @return {Array}
   */
  async get (columns = ['*']) {
    let builder = this.applyScopes();

    // If we actually found models we will also eager load any relationships that
    // have been specified as needing to be eager loaded, which will solve the
    // n+1 query issue for the developers to avoid running a lot of queries.
    let models = await builder.getModels(columns)
    if (models.length > 0) {
      models = builder.eagerLoadRelations(models);
    }

    return builder.getModel().newCollection(models);
  }

  /**
   * Get the hydrated models without eager loading.
   *
   * @param  {Array}  columns
   * @return {Array<Model>}
   */
  async getModels (columns = ['*']) {
    return this.hydrate(
      await this._query.get(columns)
    );
  }

  /**
   * Eager load the relationships for the models.
   *
   * @param  {Array}  models
   * @return {Array}
   */
  eagerLoadRelations(models)
  {
    _.forEach(this._eagerLoad, (constrain, name) => {
      // For nested eager loads we'll skip loading them here and they will be set as an
      // eager load on the query to retrieve the relation so that they will be eager
      // loaded on that query, because that is where they get hydrated as models.
      if (name.includes('.') === false) {
        models = this._eagerLoadRelation(models, name, constrain);
      }
    })

    return models;
  }

  /**
   * Eagerly load the relationship on a set of models.
   *
   * @param  {Array}  models
   * @param  {String}  name
   * @param  {Function}  constraints
   * @return {Array}
   */
  _eagerLoadRelation(models, name, constraints)
  {
    // First we will "back up" the existing where conditions on the query so we can
    // add our eager constraints. Then we will merge the wheres that were on the
    // query back to it in order that any where conditions might be specified.
    let relation = this.getRelation(name);

    relation.addEagerConstraints(models);

    constraints(relation);

    // Once we have the results, we just match those back up to their parent models
    // using the relationship instance. Then we just return the finished arrays
    // of models which have been eagerly hydrated and are readied for return.
    return relation.match(
      relation.initRelation(models, name),
      relation.getEager(), name
    );
  }

  /**
   * Get the relation instance for the given relation name.
   *
   * @param  {String}  name
   * @return {Relation}
   */
  getRelation(name)
  {
    // We want to run a relationship query without any constrains so that we will
    // not have to remove these where clauses manually which gets really hacky
    // and error prone. We don't want constraints because we add eager ones.
    let relation = Relation.noConstraints(() => {
      try {
        return this.getModel().newInstance().name();
      } catch (e) {
        throw RelationNotFoundException.make(this.getModel(), name);
      }
    });

    let nested = this._relationsNestedUnder(name);

    // If there are nested relationships set on the query, we will put those onto
    // the query instances so that they can be handled after this relationship
    // is loaded. In this way they will all trickle down as they are loaded.
    if (nested.length > 0) {
      relation.getQuery().with(nested);
    }

    return relation;
  }

  /**
   * Get the deeply nested relations for a given top-level relation.
   *
   * @param  {String}  relation
   * @return {Array}
   */
  _relationsNestedUnder(relation)
  {
    let nested = [];

    // We are basically looking for any relationships that are nested deeper than
    // the given top-level relationship. We will just check for any relations
    // that start with the given top relations and adds them to our arrays.
    _.forEach(this._eagerLoad, (constraints, name) => {
      if (this._isNestedUnder(relation, name)) {
        nested[name.substr((relation + '.').length)] = constraints;
      }
    })

    return nested;
  }

  /**
   * Determine if the relationship is nested.
   *
   * @param  {String}  relation
   * @param  {String}  name
   * @return bool
   */
  _isNestedUnder(relation, name)
  {
    return _.includes(name, '.') && _.includes(name, relation + '.')
  }

  /**
   * Get a generator for the given query.
   *
   * @return {Generator}
   */
  *cursor()
  {
    let x = this.applyScopes().query.cursor();
    let y = x.next();
    while (!y.done) {
      yield this.newModelInstance().newFromBuilder(y.value);
      y = x.next();
    }
  }

  /**
   * Chunk the results of a query by comparing numeric IDs.
   *
   * @param  {Number}  count
   * @param  {Function}  callback
   * @param  {String|null}  column
   * @param  {String|null}  alias
   * @return bool
   */
  chunkById(count, callback, column = null, alias = null)
  {
    column = _.isNull(column) ? this.getModel().getKeyName() : column;

    alias = _.isNull(alias) ? column : alias;

    let lastId = null;

    let countResults;
    do {
      let clone = BuilderInstanceProxy(Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this)));

      // We'll execute the query for the given page and get the results. If there are
      // no results we can just break and return from here. When there are results
      // we will call the callback with the current chunk of these results here.
      let results = clone.forPageAfterId(count, lastId, column).get();

      countResults = results.length;

      if (countResults === 0) {
        break;
      }

      // On each chunk result set, we will pass them to the callback and then let the
      // developer take care of everything within the callback, which allows us to
      // keep the memory low for spinning through large result sets for working.
      if (callback(results) === false) {
        return false;
      }

      lastId = results.last()[alias]
    } while (countResults === count);

    return true;
  }

  /**
   * Add a generic "order by" clause if the query doesn't already have one.
   *
   * @return void
   */
  _enforceOrderBy()
  {
    if (_.isEmpty(this._query['orders']) && _.isEmpty(this._query['unionOrders'])) {
      this.orderBy(this._model.getQualifiedKeyName(), 'asc');
    }
  }

  /**
   * Get an array with the values of a given column.
   *
   * @param  {String}  column
   * @param  {String|null}  key
   * @return {Array}
   */
  pluck(column, key = null)
  {
    let results = this.toBase().pluck(column, key);

    // If the model has a mutator for the requested column, we will spin through
    // the results and mutate the values so that the mutated version of these
    // columns are returned as you would expect from these Eloquent models.
    if (! this._model.hasGetMutator(column) &&
    ! this._model.hasCast(column) &&
    ! this._model.getDates().includes(column)) {
      return results;
    }

    return _.map(results, (value) => {
      return this._model.newFromBuilder({[column]: value})[column];
    });
  }

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
  paginate(perPage = null, columns = ['*'], pageName = 'page', page = null)
  {
    page = page || Paginator.resolveCurrentPage(pageName); // TODO

    perPage = perPage || this._model.getPerPage();

    let total = this.toBase().getCountForPagination()
    let results = (total)
      ? this.forPage(page, perPage).get(columns)
      : this._model.newCollection();

    return this.paginator(results, total, perPage, page, {
      path: Paginator.resolveCurrentPath(),
      pageName: pageName,
    });
  }

  /**
   * Paginate the given query into a simple paginator.
   *
   * @param  {Number}  perPage
   * @param  {Array}  columns
   * @param  {String}  pageName
   * @param  {Number|null}  page
   * @return \Illuminate\Contracts\Pagination\Paginator
   */
  simplePaginate(perPage = null, columns = ['*'], pageName = 'page', page = null)
  {
    page = page || Paginator.resolveCurrentPage(pageName);

    perPage = perPage || this._model.getPerPage();

    // Next we will set the limit and offset for this query so that when we get the
    // results we get the proper section of results. Then, we'll create the full
    // paginator instances for these results with the given page and per page.
    this.skip((page - 1) * perPage).take(perPage + 1);

    return this.simplePaginator(this.get(columns), perPage, page, {
      path: Paginator.resolveCurrentPath(),
      pageName: pageName,
    });
  }

  /**
   * Save a new model and return the instance.
   *
   * @param  {Object}  attributes
   * @return {Model}
   */
  create(attributes = [])
  {
    return _.tap(this.newModelInstance(attributes), (instance) => {
      instance.save();
    });
  }

  /**
   * Save a new model and return the instance. Allow mass-assignment.
   *
   * @param  {Object}  attributes
   * @return {Model}
   */
  forceCreate(attributes)
  {
    return this._model.constructor['unguarded'](() => {
      return this.newModelInstance().create(attributes);
    });
  }

  /**
   * Update a record in the database.
   *
   * @param  {Array}  values
   * @return {Number}
   */
  update(values)
  {
    return this.toBase().update(this._addUpdatedAtColumn(values));
  }

  /**
   * Increment a column's value by a given amount.
   *
   * @param  {String}  column
   * @param  {Number}  amount
   * @param  {Array}  extra
   * @return {Number}
   */
  increment(column, amount = 1, extra = [])
  {
    return this.toBase().increment(
      column, amount, this._addUpdatedAtColumn(extra)
    );
  }

  /**
   * Decrement a column's value by a given amount.
   *
   * @param  {String}  column
   * @param  {Number}  amount
   * @param  {Object}  extra
   * @return {Number}
   */
  decrement(column, amount = 1, extra = {})
  {
    return this.toBase().decrement(
      column, amount, this._addUpdatedAtColumn(extra)
    );
  }

  /**
   * Add the "updated at" column to an array of values.
   *
   * @param  {Object}  values
   * @return {Object}
   */
  _addUpdatedAtColumn(values)
  {
    if (! this._model.usesTimestamps() ||
      _.isNull(this._model.getUpdatedAtColumn())) {
      return values;
    }

    let column = this._model.getUpdatedAtColumn();

    values = _.merge(
      {[column]: this._model.freshTimestampString()},
      values
    );

    let segments = this._query['from'].split(/\s+as\s+/i)

    let qualifiedColumn = segments[segments.length - 1] + '.' + column;

    values[qualifiedColumn] = values[column];

    delete values[column]

    return values;
  }

  /**
   * Delete a record from the database.
   *
   * @return {*}
   */
  delete()
  {
    if (this._onDelete) {
      return this._onDelete.call(this);
    }

    return this.toBase().delete();
  }

  /**
   * Run the default delete function on the builder.
   *
   * Since we do not apply scopes here, the row will actually be deleted.
   *
   * @return {*}
   */
  forceDelete()
  {
    return this._query['delete']();
  }

  /**
   * Register a replacement for the default delete function.
   *
   * @param  {Function}  callback
   * @return void
   */
  onDelete(callback)
  {
    this._onDelete = callback;
  }

  /**
   * Call the given local model scopes.
   *
   * @param  {Array}  scopes
   * @return {Builder}
   */
  scopes(scopes)
  {
    let builder = this;

    _.forEach(scopes, (parameters, scope) => {
      // If the scope key is an integer, then the scope was passed as the value and
      // the parameter list is empty, so we will format the scope name and these
      // parameters here. Then, we'll be ready to call the scope on the model.
      if (_.isInteger(scope)) {
        [scope, parameters] = [parameters, []];
      }

      // Next we'll pass the scope callback to the callScope method which will take
      // care of grouping the "wheres" properly so the logical order doesn't get
      // messed up when adding scopes. Then we'll return back out the builder.
      builder = builder._callScope(
          this._model['scope' + _.upperFirst(_.camelCase(scope))],
          parameters
      )
    })

    return builder;
  }

  /**
   * Apply the scopes to the Eloquent builder instance and return it.
   *
   * @return {Builder}
   */
  applyScopes()
  {
    if (_.isEmpty(this._scopes)) {
      return this;
    }

    let builder = BuilderInstanceProxy(Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this)));

    _.forEach(this._scopes, (scope, identifier) => {
      if (! (identifier in builder._scopes)) {
        return;
      }

      builder._callScope((builder) => {
        // If the scope is a Closure we will just go ahead and call the scope with the
        // builder instance. The "callScope" method will properly group the clauses
        // that are added to this query so "where" clauses maintain proper logic.
        if (scope instanceof Function) {
          scope(builder);
        }

        // If the scope is a scope object, we will call the apply method on this scope
        // passing in the builder and the model instance. After we run all of these
        // scopes we will return back the builder instance to the outside caller.
        if (scope instanceof Scope) {
          scope.apply(builder, this.getModel());
        }
      })
    })

    return builder;
  }

  /**
   * Apply the given scope on the current builder instance.
   *
   * @param  {Function}  scope
   * @param  {Object}  parameters
   * @return {*}
   */
  _callScope(scope, parameters = {})
  {
    parameters = {0: this, ...parameters}

    let query = this.getQuery();

    // We will keep track of how many wheres are on the query before running the
    // scope so that we can properly group the added scope constraints in the
    // query as their own isolated nested where statement and avoid issues.
    let originalWhereCount = _.isNull(query.wheres)
      ? 0 : query.wheres

    let result = scope(..._.values(parameters)) || this;

    if (query.wheres.length > originalWhereCount) {
      this._addNewWheresWithinGroup(query, originalWhereCount);
    }

    return result;
  }

  /**
   * Nest where conditions by slicing them at the given where count.
   *
   * @param  {QueryBuilder}  query
   * @param  {Number}  originalWhereCount
   * @return void
   */
  _addNewWheresWithinGroup(query, originalWhereCount)
  {
    // Here, we totally remove all of the where clauses since we are going to
    // rebuild them as nested queries by slicing the groups of wheres into
    // their own sections. This is to prevent any confusing logic order.
    let allWheres = query['wheres'];

    query['wheres'] = [];

    this._groupWhereSliceForScope(
      query, _.slice(allWheres, 0, originalWhereCount)
    );

    this._groupWhereSliceForScope(
      query, _.slice(allWheres, originalWhereCount)
    );
  }

  /**
   * Slice where conditions at the given offset and add them to the query as a nested condition.
   *
   * @param  {QueryBuilder}  query
   * @param  {Object}  whereSlice
   * @return void
   */
  _groupWhereSliceForScope(query, whereSlice)
  {
    let whereBooleans = _.map(whereSlice, (ws) => ws['boolean']);

    // Here we'll check if the given subset of where clauses contains any "or"
    // booleans and in this case create a nested where expression. That way
    // we don't add any unnecessary nesting thus keeping the query clean.
    if (whereBooleans.includes('or')) {
      query['wheres'].push(this._createNestedWhere(
        whereSlice, _.first(whereBooleans)
      ))
    } else {
      query['wheres'] = _.merge(query['wheres'], whereSlice);
    }
  }

  /**
   * Create a where array with nested where conditions.
   *
   * @param  {Object}  whereSlice
   * @param  {String}  boolean
   * @return {Object}
   */
  _createNestedWhere(whereSlice, boolean = 'and')
  {
    let whereGroup = this.getQuery().forNestedWhere();

    whereGroup.wheres = whereSlice;

    return {type: 'Nested', query: whereGroup, boolean: boolean};
  }

  /**
   * Set the relationships that should be eager loaded.
   *
   * @param  {Array}  relations
   * @return {Builder}
   */
  with(relations)
  {
    let eagerLoad = this._parseWithRelations(_.isString(relations) ? [...arguments] : relations);

    this._eagerLoad = {...this._eagerLoad, ...eagerLoad};

    return this;
  }

  /**
   * Prevent the specified relations from being eager loaded.
   *
   * @param  {Array}  relations
   * @return {Builder}
   */
  without(relations)
  {
    this._eagerLoad = _.filter(this._eagerLoad, (value, relation) => {
      return !relations.includes(relation);
    });

    return this;
  }

  /**
   * Create a new instance of the model being queried.
   *
   * @param  {Object}  attributes
   * @return {Model}
   */
  newModelInstance(attributes = {})
  {
    return this._model.newInstance(attributes).setConnection(
      this._query.getConnection().getName()
    )
  }

  /**
   * Parse a list of relations into individuals.
   *
   * @param  {Array|Object}  relations
   * @return {Array}
   */
  _parseWithRelations(relations)
  {
    let results = [];

    _.forEach(relations, (constraints, name) => {
      // If the "name" value is a numeric key, we can assume that no
      // constraints have been specified. We'll just put an empty
      // Closure there, so that we can treat them all the same.
      if (_.isNumber(name)) {
        name = constraints;

        [name, constraints] = _.includes(name, ':')
          ? this._createSelectWithConstraint(name)
          : [name, function () {}];
      }

      // We need to separate out any nested includes, which allows the developers
      // to load deep relationships using "dots" without stating each level of
      // the relationship with its own key in the array of eager-load names.
      results = this._addNestedWiths(name, results);

      results[name] = constraints;
    })

    return results;
  }

  /**
   * Create a constraint to select the given columns for the relation.
   *
   * @param  {String}  name
   * @return {Array}
   */
  _createSelectWithConstraint(name)
  {
    return [name.split(':')[0], (query) => {
      query.select(name.split(':')[1].split(','));
    }];
  }

  /**
   * Parse the nested relationships in a relation.
   *
   * @param  {String}  name
   * @param  {Object}  results
   * @return {Object}
   */
  _addNestedWiths(name, results)
  {
    let progress = [];

    // If the relation has already been set on the result array, we will not set it
    // again, since that would override any constraints that were already placed
    // on the relationships. We will only set the ones that are not specified.
    name.split('.').forEach((segment) => {
      progress.push(segment);

      let last = progress.join('.')
      if (! (results[last])) {
        results[last] = function () {
          //
        };
      }
    })

    return results;
  }

  /**
   * Get the underlying query builder instance.
   *
   * @return {QueryBuilder}
   */
  getQuery()
  {
    return this._query;
  }

  /**
   * Set the underlying query builder instance.
   *
   * @param  {QueryBuilder}  query
   * @return {Builder}
   */
  setQuery(query)
  {
    this._query = query;

    return this;
  }

  /**
   * Get a base query builder instance.
   *
   * @return {QueryBuilder}
   */
  toBase()
  {
    return this.applyScopes().getQuery();
  }

  /**
   * Get the relationships being eagerly loaded.
   *
   * @return {Object}
   */
  getEagerLoads()
  {
    return this._eagerLoad;
  }

  /**
   * Set the relationships being eagerly loaded.
   *
   * @param  {Object}  eagerLoad
   * @return {Builder}
   */
  setEagerLoads(eagerLoad)
  {
    this._eagerLoad = eagerLoad;

    return this;
  }

  /**
   * Get the model instance being queried.
   *
   * @return {Model}
   */
  getModel()
  {
    return this._model;
  }

  /**
   * Set a model instance for the model being queried.
   *
   * @param  {Model}  model
   * @return {Builder}
   */
  setModel(model)
  {
    this._model = model;

    this._query['table'](model.getTable());

    return this;
  }

  /**
   * Qualify the given column name by the model's table.
   *
   * @param  {String}  column
   * @return string
   */
  qualifyColumn(column)
  {
    return this._model.qualifyColumn(column);
  }

  /**
   * Get the given macro by name.
   *
   * @param  {String}  name
   * @return {Function}
   */
  getMacro(name)
  {
    return _.get(this._localMacros, name);
  }

  /**
   * Dynamically access builder proxies.
   *
   * @param  {String}  key
   * @return {*}
   *
   * @throws {Error}
   */
  __get(key)
  {
    if (key === 'orWhere') {
      return new HigherOrderBuilderProxy(this, key);
    }

    // throw new Error(`Property [${key}] does not exist on the Eloquent builder instance.`);
  }

  /**
   * Dynamically handle calls into the query instance.
   *
   * @param  {String}  method
   * @param  {Array}  parameters
   * @return {*}
   */
  __call(method, parameters)
  {
    if (method === 'macro') {
      this._localMacros = {
        ...this._localMacros,
        [parameters[0]]: parameters[1]
      };

      return;
    }

    if ((method in this._localMacros)) {
      parameters.unshift(this)

      return this._localMacros[method](...parameters);
    }

    if ((method in this.constructor._macros)) {
      if (this.constructor._macros[method] instanceof Function) {
        return this.constructor._macros[method].call(this, this.constructor, parameters)
      }

      return this.constructor._macros[method].call(this, parameters);
    }

    let scope = 'scope' + _.upperFirst(_.camelCase(method));
    if (scope in this._model) {
      return this._callScope(this._model[scope], parameters);
    }

    if (this._passthru.includes(method)) {
      return this.toBase()[method](...parameters);
    }

    this._query[method](...parameters)
    // this.forwardCallTo(this._query, method, parameters);

    return this;
  }

  /**
   * Dynamically handle calls into the query instance.
   *
   * @param  {String}  method
   * @param  {Array}  parameters
   * @return {*}
   *
   * @throws \BadMethodCallException
   */
  static __callStatic(method, parameters)
  {
    if (method === 'macro') {
      this._macros[parameters[0]] = parameters[1];

      return;
    }

    if (! (method in this._macros)) {
      this.throwBadMethodCallException(method);
    }

    if (this._macros[method] instanceof Function) {
      return this._macros[method](parameters);
    }

    return this._macros[method](parameters);
  }

  /**
   * Force a clone of the underlying query builder when cloning.
   *
   * @return void
   */
  clone()
  {
    this._query = Object.create(Object.getPrototypeOf(this._query), Object.getOwnPropertyDescriptors(this._query));
  }
}

BuildsQueries.call(Builder.prototype)

Builder = BuilderProxy(Builder);

/**
 * @class
 * @mixes Builder
 */
const ModelBuilder = Builder

export { Builder, ModelBuilder }
export default Builder
