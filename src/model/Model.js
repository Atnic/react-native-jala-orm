import _ from 'lodash'
import pluralize from 'pluralize'
import HasAttributes from './concerns/HasAttributes'
import HasEvents from './concerns/HasEvents'
import HasGlobalScopes from './concerns/HasGlobalScopes'
import HasRelationships from './concerns/HasRelationships'
import HasTimestamps from './concerns/HasTimestamps'
import HidesAttributes from './concerns/HidesAttributes'
import GuardsAttributes from './concerns/GuardsAttributes'
import { ModelBuilder } from './Builder'
import { QueryBuilder } from '../query/Builder'
import { MassAssignmentError } from './MassAssignmentError'
import ConnectionResolver from '../ConnectionResolver'
import RNSQLiteConnection from '../RNSQLiteConnection'

const ModelProxy = function (cls) {
  return new Proxy(cls, {
    get (target, p) {
      if (p in target) return target[p];
      if ((p in target.prototype && target.prototype[p] instanceof Function) ||
        ['increment', 'decrement'].includes(p) ||
        ModelBuilder.prototype[p] instanceof Function
      )
        return new Proxy(target.__callStatic, {
          apply (target, thisArg, argArray) {
            return target.call(thisArg, p, argArray)
          }
        });
      return null
    }
  })
}

const ModelInstanceProxy = function (cls) {
  return new Proxy(cls, {
    get (target, p) {
      if (p in target) return target[p];
      if (['increment', 'decrement'].includes(p) || ModelBuilder.prototype[p] instanceof Function)
        return new Proxy(target.__call, {
          apply (target, thisArg, argArray) {
            return target.call(thisArg, p, argArray)
          }
        });
      return target.__get(p)
    },
    set (target, p, value) {
      if (p in target) target[p] = value;
      else target.__set(p, value)
      return true
    },
    deleteProperty (target, p) {
      target.__unset(p)
    }
  })
}

/**
 * @mixes HasAttributes
 * @mixes HasEvents
 * @mixes HasGlobalScopes
 * @mixes HasRelationships
 * @mixes HasTimestamps
 * @mixes HidesAttributes
 * @mixes GuardsAttributes
 */
class Model {
  /**
   * The connection name for the model.
   *
   * @var {String|null}
   */
  _connection = null

  /**
   * The table associated with the model.
   *
   * @var {String|null}
   */
  _table = null

  /**
   * The primary key for the model.
   *
   * @var {String}
   */
  _primaryKey = 'id'

  /**
   * The "type" of the auto-incrementing ID.
   *
   * @var {String}
   */
  _keyType = 'int'

  /**
   * Indicates if the IDs are auto-incrementing.
   *
   * @var {Boolean}
   */
  incrementing = true

  /**
   * The relations to eager load on every query.
   *
   * @var {Array}
   */
  _with = []

  /**
   * The relationship counts that should be eager loaded on every query.
   *
   * @var {Array}
   */
  _withCount = []

  /**
   * The number of models to return for pagination.
   *
   * @var {Number}
   */
  _perPage = 15

  /**
   * Indicates if the model exists.
   *
   * @var {Boolean}
   */
  exists = false

  /**
   * Indicates if the model was inserted during the current request lifecycle.
   *
   * @var {Boolean}
   */
  wasRecentlyCreated = false

  /**
   * The connection resolver instance.
   *
   * @var {ConnectionResolver|null}
   */
  static _resolver = null

  /**
   * The event dispatcher instance.
   *
   * @var Dispatcher
   */
  static _dispatcher = null

  /**
   * The array of booted models.
   *
   * @var {Object}
   */
  static _booted = {}

  /**
   * The array of global scopes on the model.
   *
   * @var {Object}
   */
  static _globalScopes = {}

  /**
   * The list of models classes that should not be affected with touch.
   *
   * @var {Array}
   */
  static _ignoreOnTouch = [];

  /**
   * The name of the "created at" column.
   *
   * @var string
   */
  static CREATED_AT = 'created_at'

  /**
   * The name of the "updated at" column.
   *
   * @var string
   */
  static UPDATED_AT = 'updated_at'

  /**
   * Trait used
   *
   * @var {Array}
   */
  static _traits = [
    HasAttributes,
    HasEvents,
    HasRelationships,
    HasGlobalScopes,
    HasTimestamps,
    HidesAttributes,
    GuardsAttributes
  ]

  /**
   * Create a new Eloquent model instance.
   *
   * @return void
   * @param {Object} attributes
   */
  constructor (attributes = {}) {
    // if (this.constructor === Model) {
    //   throw new Error('Cannot construct Abstract instances directly')
    // }
    this._bootIfNotBooted()

    this.syncOriginal()

    this.fill(attributes)

    return ModelInstanceProxy(this);
  }

  /**
   * Check if the model needs to be booted and if so, do it.
   *
   * @return void
   */
  _bootIfNotBooted () {
    if (!(this.constructor.name in this.constructor._booted)) {
      this.constructor._booted = {
        ...this.constructor._booted,
        [this.constructor.name]: true
      }

      this._fireModelEvent('booting', false)

      this.constructor._boot()

      this._fireModelEvent('booted', false)
    }
  }

  /**
   * The "booting" method of the model.
   *
   * @return void
   */
  static _boot () {
    this._bootTraits()
  }

  /**
   * Apply Trait
   *
   * @param {Function} trait
   */
  static applyTrait (trait) {
    if (!this._traits || !this._traits.includes(trait)) {
      if (!this._traits) this._traits = []
      this._traits = [...this._traits, trait]
      trait.call(this.prototype)
    }
  }

  /**
   * @returns {Array<Function>}
   */
  static getTraits () {
    return [...this._traits]
  }

  /**
   * Boot all of the bootable traits on the model.
   *
   * @return void
   */
  static _bootTraits () {
    this.getTraits().forEach((trait) => {
      let method = 'boot' + trait.name
      if (method in this) {
        this[method]()
      }
    })
  }

  /**
   * Clear the list of booted models so they will be re-booted.
   *
   * @return void
   */
  static clearBootedModels () {
    this._booted = []

    this._globalScopes = {}
  }

  /**
   * Disables relationship model touching for the current class during given callback scope.
   *
   * @param  {Function}  callback
   * @return void
   */
  static withoutTouching(callback)
  {
    this.withoutTouchingOn([this], callback);
  }

  /**
   * Disables relationship model touching for the given model classes during given callback scope.
   *
   * @param  {Array}  models
   * @param  {Function}  callback
   * @return void
   */
  static withoutTouchingOn(models, callback)
  {
    this._ignoreOnTouch = _.uniq([...this._ignoreOnTouch, ...models]);

    try {
      callback();
    } finally {
      this._ignoreOnTouch = _.difference(this._ignoreOnTouch, models);
    }
  }

  /**
   * Determine if the given model is ignoring touches.
   *
   * @param  {Function|null}  cls
   * @return {Boolean}
   */
  static isIgnoringTouch(cls = null)
  {
    cls = cls || this;

    if (! cls['timestamps'] || ! cls['UPDATED_AT']) {
      return true;
    }

    this._ignoreOnTouch.forEach((ignoredClass) => {
      if (cls === ignoredClass || cls instanceof ignoredClass) {
        return true;
      }
    })

    return false;
  }

  /**
   * Fill the model with an array of attributes.
   *
   * @return {Model}
   *
   * @throws MassAssignmentException
   * @param {Object} attributes
   */
  fill (attributes) {
    let totallyGuarded = this.totallyGuarded()

    _.forEach(this._fillableFromArray(attributes), (value, key) => {
      key = this._removeTableFromKey(key)

      // The developers may choose to place some attributes in the "fillable" array
      // which means only those attributes may be set through mass assignment to
      // the model, and all others will just get ignored for security reasons.
      if (this.isFillable(key)) {
        this.setAttribute(key, value)
      } else if (totallyGuarded) {
        throw new MassAssignmentError(key)
      }
    })

    return this
  }

  /**
   * Fill the model with an array of attributes. Force mass assignment.
   *
   * @return {Model}
   * @param {Array} attributes
   */
  forceFill (attributes) {
    return this.constructor.unguarded(() => {
      return this.fill(attributes)
    })
  }

  /**
   * Qualify the given column name by the model's table.
   *
   * @return string
   * @param {String} column
   */
  qualifyColumn (column) {
    if (column.includes('.')) {
      return column
    }

    return this.getTable() + '.' + column
  }

  // noinspection JSMethodCanBeStatic
  /**
   * Remove the table name from a given key.
   *
   * @return string
   * @param {String} key
   */
  _removeTableFromKey (key) {
    return key.includes('.') ? key.split('.').pop() : key
  }

  /**
   * Create a new instance of the given model.
   *
   * @return Model
   * @param {Object} attributes
   * @param {Boolean} exists
   */
  newInstance (attributes = {}, exists = false) {
    // This method just provides a convenient way for us to generate fresh model
    // instances of this current model. It is particularly useful during the
    // hydration of new objects via the Eloquent query builder instances.
    let model = new this.constructor(attributes)

    model.exists = exists

    model.setConnection(
      this.getConnectionName()
    )

    return model
  }

  /**
   * Create a new model instance that is existing.
   *
   * @return Model
   * @param {Object} attributes
   * @param {Boolean} connection
   */
  newFromBuilder (attributes = {}, connection = null) {
    let model = this.newInstance({}, true)

    model.setRawAttributes(attributes, true)

    model.setConnection(connection || this.getConnectionName())

    model._fireModelEvent('retrieved', false)

    return model
  }

  /**
   * Begin querying the model on a given connection.
   *
   * @return {ModelBuilder}
   * @param {String} connection
   */
  static on (connection = null) {
    // First we will just create a fresh instance of this model, and then we can
    // set the connection on the model so that it is be used for the queries
    // we execute, as well as being set on each relationship we retrieve.
    let instance = new this()

    instance.setConnection(connection)

    return instance.newQuery()
  }

  /**
   * Begin querying the model on the write connection.
   *
   * @return {QueryBuilder}
   */
  static onWriteConnection () {
    let instance = new this()

    return instance.newQuery().useWritePdo() // TODO
  }

  /**
   * Get all of the models from the database.
   *
   * @return {Array<Model>}
   * @param {Array|Object} columns
   */
  static all (columns = ['*']) {
    return (new this()).newQuery().get(
      (columns instanceof Array || columns instanceof Object) ? columns : [...arguments]
    )
  }

  /**
   * Begin querying a model with eager loading.
   *
   * @return {ModelBuilder}
   * @param {String|Array<String>} relations
   */
  static with (relations) {
    return (new this()).newQuery().with(
      _.isString(relations) ? [...arguments] : relations
    )
  }

  /**
   * Eager load relations on the model.
   *
   * @return {Model}
   * @param {String|Array<String>} relations
   */
  load (relations) {
    let query = this.newQueryWithoutRelationships().with(
      _.isString(relations) ? [...arguments] : relations
    )

    query.eagerLoadRelations([this]) // TODO

    return this
  }

  /**
   * Eager load relations on the model if they are not already eager loaded.
   *
   * @return {Model}
   * @param {String|Array<String>} relations
   */
  loadMissing (relations) {
    relations = _.isString(relations) ? [...arguments] : relations

    return this.load(relations.filter((relation) => {
      return !this.relationLoaded(relation)
    }))
  }

  /**
   * Increment a column's value by a given amount.
   *
   * @param {String} column
   * @param {Number} amount
   * @param {Array} extra
   * @return int
   */
  _increment (column, amount = 1, extra = []) {
    return this._incrementOrDecrement(column, amount, extra, 'increment')
  }

  /**
   * Decrement a column's value by a given amount.
   *
   * @param {String} column
   * @param {Number} amount
   * @param {Array} extra
   * @return int
   */
  _decrement (column, amount = 1, extra = []) {
    return this._incrementOrDecrement(column, amount, extra, 'decrement')
  }

  /**
   * Run the increment or decrement method on the model.
   *
   * @return int
   * @param {String} column
   * @param {Number} amount
   * @param {Array} extra
   * @param {String} method
   */
  _incrementOrDecrement (column, amount, extra, method) {
    let query = this.newQuery()

    if (!this.exists) {
      return query[method](column, amount, extra)
    }

    this._incrementOrDecrementAttributeValue(column, amount, extra, method)

    return query.where(
      this.getKeyName(), this.getKey()
    )[method](column, amount, extra)
  }

  /**
   * Increment the underlying attribute value and sync with original.
   *
   * @return void
   * @param {String} column
   * @param {Number} amount
   * @param {Array} extra
   * @param {String} method
   */
  _incrementOrDecrementAttributeValue (column, amount, extra, method) {
    this[column] = this[column] + (method === 'increment' ? amount : amount * -1)

    this.forceFill(extra)

    this.syncOriginalAttribute(column)
  }

  /**
   * Update the model in the database.
   *
   * @return {Boolean}
   * @param {Object} attributes
   * @param {Object} options
   */
  update (attributes = {}, options = {}) {
    if (!this.exists) {
      return false
    }

    return this.fill(attributes).save(options)
  }

  /**
   * Save the model and all of its relationships.
   *
   * @return {Boolean}
   */
  async push () {
    if (!(await this.save())) {
      return false
    }

    // To sync all of the relationships to the database, we will simply spin through
    // the relationships and save each model via this "push" method, which allows
    // us to recurse into all of these nested relations for the model instance.
    _.forEach(this._relations, (models) => {
      models = models instanceof Array
        ? models : [models]

      models.forEach((model) => {
        if (!model.push()) {
          return false
        }
      })
    })

    return true
  }

  /**
   * Save the model to the database.
   *
   * @return {Boolean}
   * @param {Object} options
   */
  async save (options = {}) {
    let query = this.newModelQuery()

    // If the "saving" event returns false we'll bail out of the save and return
    // false, indicating that the save failed. This provides a chance for any
    // listeners to cancel save operations if validations fail or whatever.
    if (this._fireModelEvent('saving') === false) {
      return false
    }

    let saved = false
    // If the model already exists in the database we can just update our record
    // that is already in this database using the current IDs in this "where"
    // clause to only update this model. Otherwise, we'll just insert them.
    if (this.exists) {
      saved = this.isDirty() ?
        (await this._performUpdate(query)) : true
    }

    // If the model is brand new, we'll insert it into our database and set the
    // ID attribute on the model to the value of the newly inserted row's ID
    // which is typically an auto-increment value managed by the database.
    else {
      saved = (await this._performInsert(query))
      let connection = query.getConnection()

      if (!this.getConnectionName() && connection) {
        this.setConnection(connection.getName())
      }
    }

    // If the model is successfully saved, we need to do a few more things once
    // that is done. We will call the "saved" method here to run any actions
    // we need to happen after a model gets successfully saved right here.
    if (saved) {
      this._finishSave(options)
    }

    return saved
  }

  /**
   * Save the model to the database using transaction.
   *
   * @return {Boolean}
   *
   * @throws \Throwable
   * @param {Object} options
   */
  saveOrFail (options = {}) {
    return this.getConnection().transaction(async () => {
      return (await this.save(options))
    })
  }

  /**
   * Perform any actions that are necessary after the model is saved.
   *
   * @return void
   * @param {Object} options
   */
  _finishSave (options) {
    this._fireModelEvent('saved', false)

    if (this.isDirty() && (options['touch'] || true)) {
      this.touchOwners()
    }

    this.syncOriginal()
  }

  /**
   * Perform a model update operation.
   *
   * @return {Boolean}
   * @param {ModelBuilder} query
   */
  async _performUpdate (query) {
    // If the updating event returns false, we will cancel the update operation so
    // developers can hook Validation systems into their models and cancel this
    // operation if the model does not pass validation. Otherwise, we update.
    if (this._fireModelEvent('updating') === false) {
      return false
    }

    // First we need to create a fresh query instance and touch the creation and
    // update timestamp on the model which are maintained by us for developer
    // convenience. Then we will just continue saving the model instances.
    if (this.usesTimestamps()) {
      this._updateTimestamps()
    }

    // Once we have run the update operation, we will fire the "updated" event for
    // this model instance. This will allow developers to hook into these after
    // models are updated, giving them a chance to do any special processing.
    let dirty = this.getDirty()

    if (!_.isEmpty(dirty)) {
      await this._setKeysForSaveQuery(query).update(dirty)

      this._fireModelEvent('updated', false)

      this.syncChanges()
    }

    return true
  }

  /**
   * Set the keys for a save update query.
   *
   * @return {ModelBuilder}
   * @param {ModelBuilder} query
   */
  _setKeysForSaveQuery (query) {
    query.where(this.getKeyName(), '=', this._getKeyForSaveQuery())

    return query
  }

  /**
   * Get the primary key value for a save query.
   *
   * @return mixed
   */
  _getKeyForSaveQuery () {
    return this._original[this.getKeyName()]
      || this.getKey()
  }

  /**
   * Perform a model insert operation.
   *
   * @return {Boolean}
   * @param {ModelBuilder} query
   */
  async _performInsert (query) {
    if (this._fireModelEvent('creating') === false) {
      return false
    }

    // First we'll need to create a fresh query instance and touch the creation and
    // update timestamps on this model, which are maintained by us for developer
    // convenience. After, we will just continue saving these model instances.
    if (this.usesTimestamps()) {
      this._updateTimestamps()
    }

    // If the model has an incrementing key, we can use the "insertGetId" method on
    // the query builder, which will give us back the final inserted ID for this
    // table from the database. Not all tables have to be incrementing though.
    let attributes = this.getAttributes()

    if (this.getIncrementing()) {
      await this._insertAndSetId(query, attributes)
    }

    // If the table isn't incrementing we'll simply insert these attributes as they
    // are. These attribute arrays must contain an "id" column previously placed
    // there by the developer as the manually determined key for these models.
    else {
      if (!attributes) {
        return true
      }

      await query.insert(attributes)
    }

    // We will go ahead and set the exists property to true, so that it is set when
    // the created event is fired, just in case the developer tries to update it
    // during the event. This will allow them to do so and run an update here.
    this.exists = true

    this.wasRecentlyCreated = true

    this._fireModelEvent('created', false)

    return true
  }

  /**
   * Insert the given attributes and set the ID on the model.
   *
   * @return void
   * @param {ModelBuilder} query
   * @param {Object} attributes
   */
  async _insertAndSetId (query, attributes) {
    let keyName = this.getKeyName()
    let id = await query.insertGetId(attributes, keyName)

    this.setAttribute(keyName, id)
  }

  /**
   * Destroy the models for the given IDs.
   *
   * @return int
   * @param {Array|String|Number} ids
   */
  static async destroy (ids) {
    // We'll initialize a count here so we will return the total number of deletes
    // for the operation. The developers can then check this number as a boolean
    // type value or get this total count of records deleted for logging, etc.
    let count = 0

    ids = ids instanceof Array ? ids : [...arguments]

    // We will actually pull the models from the database table and call delete on
    // each of them individually so that their events get fired properly with a
    // correct set of attributes in case the developers wants to check these.
    let instance = (new this())
    let key = instance.getKeyName()

    await Promise.all(instance.whereIn(key, ids).get().map((model) => (async () => {
      if (await model.delete()) {
        count++
      }
    })()))

    return count
  }

  /**
   * Delete the model from the database.
   *
   * @return {Boolean}
   *
   * @throws \Exception
   */
  async delete () {
    if (this.getKeyName() == null) {
      throw new Error('No primary key defined on model.')
    }

    // If the model doesn't exist, there is nothing to delete so we'll just return
    // immediately and not do anything else. Otherwise, we will continue with a
    // deletion process on the model, firing the proper events, and so forth.
    if (!this.exists) {
      return false
    }

    if (this._fireModelEvent('deleting') === false) {
      return false
    }

    // Here, we'll touch the owning models, verifying these timestamps get updated
    // for the models. This will allow any caching to get broken on the parents
    // by the timestamp. Then we will go ahead and delete the model instance.
    this.touchOwners()

    await this._performDeleteOnModel()

    // Once the model has been deleted, we will fire off the deleted event so that
    // the developers may hook into post-delete operations. We will then return
    // a boolean true as the delete is presumably successful on the database.
    this._fireModelEvent('deleted', false)

    return true
  }

  /**
   * Force a hard delete on a soft deleted model.
   *
   * This method protects developers from running forceDelete when trait is missing.
   *
   * @return {Boolean}
   */
  forceDelete () {
    return this.delete()
  }

  /**
   * Perform the actual delete query on this model instance.
   *
   * @return void
   */
  async _performDeleteOnModel () {
    await this._setKeysForSaveQuery(this.newModelQuery()).delete()

    this.exists = false
  }

  /**
   * Begin querying the model.
   *
   * @return {ModelBuilder}
   */
  static query () {
    return (new this()).newQuery()
  }

  /**
   * Get a new query builder for the model's table.
   *
   * @return {ModelBuilder}
   */
  newQuery () {
    return this.registerGlobalScopes(this.newQueryWithoutScopes())
  }

  /**
   * Get a new query builder that doesn't have any global scopes or eager loading.
   *
   * @return {ModelBuilder}
   */
  newModelQuery () {
    return this.newModelBuilder(
      this._newBaseQueryBuilder()
    ).setModel(this)
  }

  /**
   * Get a new query builder with no relationships loaded.
   *
   * @return {ModelBuilder}
   */
  newQueryWithoutRelationships () {
    return this.registerGlobalScopes(
      this.newModelBuilder(this._newBaseQueryBuilder()).setModel(this)
    )
  }

  /**
   * Register the global scopes for this builder instance.
   *
   * @return {ModelBuilder}
   * @param {ModelBuilder} builder
   */
  registerGlobalScopes (builder) {
    _.forEach(this.getGlobalScopes(), (scope, identifier) => {
      builder.withGlobalScope(identifier, scope)
    })

    return builder
  }

  /**
   * Get a new query builder that doesn't have any global scopes.
   *
   * @return {ModelBuilder}
   */
  newQueryWithoutScopes () {
    return this.newModelQuery().with(this._with)
    // return this.newModelQuery().with(this._with).withCount(this._withCount) // TODO
  }

  /**
   * Get a new query instance without a given scope.
   *
   * @return {ModelBuilder}
   * @param scope
   */
  newQueryWithoutScope (scope) {
    let builder = this.newQuery()

    return builder.withoutGlobalScope(scope)
  }

  /**
   * Get a new query to restore one or more models by their queueable IDs.
   *
   * @return {ModelBuilder}
   * @param {Array|String|Number} ids
   */
  newQueryForRestoration (ids) {
    if (ids instanceof Array) {
      return this.newQueryWithoutScopes().whereIn(this.getQualifiedKeyName(), ids)
    }

    return this.newQueryWithoutScopes().whereKey(ids)
  }

  // noinspection JSMethodCanBeStatic
  /**
   * Create a new Eloquent query builder for the model.
   *
   * @return {ModelBuilder}
   * @param {QueryBuilder} query
   */
  newModelBuilder (query) {
    return new ModelBuilder(query)
  }

  /**
   * Get a new query builder instance for the connection.
   *
   * @return {QueryBuilder}
   */
  _newBaseQueryBuilder () {
    let connection = this.getConnection()

    return new QueryBuilder(
      connection, connection.getQueryGrammar(), connection.getPostProcessor()
    )
  }

  /**
   * Create a new Eloquent Collection instance.
   *
   * @return {Array<Model>}
   * @param {Array} models
   */
  newCollection (models = []) {
    return models
  }

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
  newPivot (parent, attributes, table, exists, using = null) { // TODO
    return using ? using.fromRawAttributes(parent, attributes, table, exists)
      : Pivot.fromAttributes(parent, attributes, table, exists)
  }

  /**
   * Convert the model instance to an array.
   *
   * @return {Object}
   */
  toArray () {
    return {...this.attributesToArray(), ...this.relationsToArray()}
  }

  /**
   * Convert the model instance to JSON.
   *
   * @return string
   *
   * @throws \Illuminate\Database\Eloquent\JsonEncodingException
   */
  toJson () {
    let json = JSON.stringify(this.jsonSerialize())

    // if (JSON_ERROR_NONE !== json_last_error()) {
    //   throw JsonEncodingException::forModel(this, json_last_error_msg())
    // } // TODO

    return json
  }

  /**
   * Convert the object into something JSON serializable.
   *
   * @return {Object}
   */
  jsonSerialize () {
    return this.toArray()
  }

  /**
   * Reload a fresh model instance from the database.
   *
   * @return {Model}
   */
  fresh (withs = []) {
    if (!this.exists) {
      return null
    }

    return this.newQueryWithoutScopes()
      .with(withs instanceof Array ? withs : [...arguments])
      .where(this.getKeyName(), this.getKey())
      .first()
  }

  /**
   * Reload the current model instance with fresh attributes from the database.
   *
   * @return {Model}
   */
  refresh () {
    if (!this.exists) {
      return this
    }

    this.setRawAttributes(
      {...this.newQueryWithoutScopes().findOrFail(this.getKey())._attributes}
    )

    this.load(this._relations.filter((relation) => !relation['pivot']).keys().toArray())

    return this
  }

  /**
   * Clone the model into a new, non-existing instance.
   *
   * @return {ModelBuilder}
   * @param {Array|null} except
   */
  replicate (except = null) {
    let defaults = [
      this.getKeyName(),
      this.getCreatedAtColumn(),
      this.getUpdatedAtColumn(),
    ]

    let attributes = this._attributes.filter((attribute) => {
      return !(except ? _.uniq(except.concat(defaults)) : defaults).includes(attribute)
    })

    return _.tap(new this(), (instance) => {
      instance.setRawAttributes(attributes)

      instance.setRelations({...this._relations})
    })
  }

  /**
   * Determine if two models have the same ID and belong to the same table.
   *
   * @return {Boolean}
   * @param  {Model|null}  model
   */
  is (model) {
    return !(model == null) &&
      this.getKey() === model.getKey() &&
      this.getTable() === model.getTable() &&
      this.getConnectionName() === model.getConnectionName()
  }

  /**
   * Determine if two models are not the same.
   *
   * @return {Boolean}
   * @param {Model|null} model
   */
  isNot (model) {
    return !this.is(model)
  }

  /**
   * Get the database connection for the model.
   *
   * @return {Connection}
   */
  getConnection () {
    return this.constructor.resolveConnection(this.getConnectionName())
  }

  /**
   * Get the current connection name for the model.
   *
   * @return string
   */
  getConnectionName () {
    return this._connection
  }

  /**
   * Set the connection associated with the model.
   *
   * @return {Model}
   * @param {String} name
   */
  setConnection (name) {
    this._connection = name

    return this
  }

  /**
   * Resolve a connection instance.
   *
   * @return {Connection}
   * @param {String} connection
   */
  static resolveConnection (connection = null) {
    if (!this._resolver)
      this._resolver = new ConnectionResolver({
        'rn-sqlite': new RNSQLiteConnection()
      })
    return this._resolver.connection(connection)
  }

  /**
   * Get the connection resolver instance.
   *
   * @return ConnectionResolver
   */
  static getConnectionResolver () {
    return this._resolver
  }

  /**
   * Set the connection resolver instance.
   *
   * @param  {ConnectionResolver} resolver
   * @return void
   */
  static setConnectionResolver (resolver) {
    this._resolver = resolver
  }

  /**
   * Unset the connection resolver for models.
   *
   * @return void
   */
  static unsetConnectionResolver () {
    this._resolver = null
  }

  /**
   * Get the table associated with the model.
   *
   * @return {String}
   */
  getTable () {
    if (!this._table) {
      return pluralize(_.snakeCase(this.constructor.name))
    }

    return this._table
  }

  /**
   * Set the table associated with the model.
   *
   * @return {Model}
   * @param {String} table
   */
  setTable (table) {
    this._table = table

    return this
  }

  /**
   * Get the primary key for the model.
   *
   * @return {String}
   */
  getKeyName () {
    return this._primaryKey
  }

  /**
   * Set the primary key for the model.
   *
   * @return {Model}
   * @param {String} key
   */
  setKeyName (key) {
    this._primaryKey = key

    return this
  }

  /**
   * Get the table qualified key name.
   *
   * @return {String}
   */
  getQualifiedKeyName () {
    return this.qualifyColumn(this.getKeyName())
  }

  /**
   * Get the auto-incrementing key type.
   *
   * @return {String}
   */
  getKeyType () {
    return this._keyType
  }

  /**
   * Set the data type for the primary key.
   *
   * @return {Model}
   * @param {String} type
   */
  setKeyType (type) {
    this._keyType = type

    return this
  }

  /**
   * Get the value indicating whether the IDs are incrementing.
   *
   * @return {Boolean}
   */
  getIncrementing () {
    return this.incrementing
  }

  /**
   * Set whether IDs are incrementing.
   *
   * @return {Model}
   * @param {Boolean} value
   */
  setIncrementing (value) {
    this.incrementing = value

    return this
  }

  /**
   * Get the value of the model's primary key.
   *
   * @return {*}
   */
  getKey () {
    return this.getAttribute(this.getKeyName())
  }

  /**
   * Get the queueable identity for the entity.
   *
   * @return {*}
   */
  getQueueableId () {
    return this.getKey()
  }

  /**
   * Get the queueable connection for the entity.
   *
   * @return {String}
   */
  getQueueableConnection () {
    return this.getConnectionName()
  }

  /**
   * Get the value of the model's route key.
   *
   * @return {String}
   */
  getRouteKey () {
    return this.getAttribute(this.getRouteKeyName())
  }

  /**
   * Get the route key for the model.
   *
   * @return {String}
   */
  getRouteKeyName () {
    return this.getKeyName()
  }

  /**
   * Retrieve the model for a bound value.
   *
   * @return {ModelBuilder|null}
   * @param {*} value
   */
  resolveRouteBinding (value) {
    return this['where'](this.getRouteKeyName(), value).first()
  }

  /**
   * Get the default foreign key name for the model.
   *
   * @return {String}
   */
  getForeignKey () {
    return _.snakeCase(this.constructor.name) + '_' + this.getKeyName()
  }

  /**
   * Get the number of models to return per page.
   *
   * @return int
   */
  getPerPage () {
    return this._perPage
  }

  /**
   * Set the number of models to return per page.
   *
   * @return {Model}
   * @param {Number} perPage
   */
  setPerPage (perPage) {
    this._perPage = perPage

    return this
  }

  /**
   * Dynamically retrieve attributes on the model.
   *
   * @return {*}
   * @param {String} key
   */
  __get (key) {
    return this.getAttribute(key)
  }

  /**
   * Dynamically set attributes on the model.
   *
   * @return void
   * @param {String} key
   * @param {*} value
   */
  __set (key, value) {
    this.setAttribute(key, value)
  }

  /**
   * Determine if the given attribute exists.
   *
   * @return {Boolean}
   * @param offset
   */
  offsetExists (offset) {
    return !(this.getAttribute(offset) == null)
  }

  /**
   * Get the value for a given offset.
   *
   * @return mixed
   * @param {String} offset
   */
  offsetGet (offset) {
    return this.getAttribute(offset)
  }

  /**
   * Set the value for a given offset.
   *
   * @return void
   * @param {String} offset
   * @param {*} value
   */
  offsetSet (offset, value) {
    this.setAttribute(offset, value)
  }

  /**
   * Unset the value for a given offset.
   *
   * @return void
   * @param {String} offset
   */
  offsetUnset (offset) {
    let attributes = {...this._attributes};
    let relations = {...this._relations};

    delete attributes[offset]
    delete relations[offset]

    this._attributes = {...attributes}
    this._relations = {...relations};
  }

  /**
   * Determine if an attribute or relation exists on the model.
   *
   * @return {Boolean}
   * @param {String} key
   */
  __isset (key) {
    return this.offsetExists(key)
  }

  /**
   * Unset an attribute on the model.
   *
   * @return void
   * @param {String} key
   */
  __unset (key) {
    this.offsetUnset(key)
  }

  /**
   * Handle dynamic method calls into the model.
   *
   * @return mixed
   * @param {String} method
   * @param {Array} parameters
   */
  __call (method, parameters) {
    if (['increment', 'decrement'].includes(method)) {
      return this['_' + method](...parameters)
    }

    return this.newQuery()[method](...parameters)
  }

  /**
   * Handle dynamic static method calls into the method.
   *
   * @return mixed
   * @param method
   * @param parameters
   */
  static __callStatic (method, parameters) {
    return (new this())[method](...parameters)
  }

  /**
   * Convert the model to its string representation.
   *
   * @return string
   */
  toString () {
    return this.toJson()
  }

  /**
   * When a model is being unserialized, check if it needs to be booted.
   *
   * @return void
   */
  __wakeup () {
    this._bootIfNotBooted()
  }
}

HasAttributes.call(Model.prototype)
HasEvents.call(Model.prototype)
HasRelationships.call(Model.prototype)
HasGlobalScopes.call(Model.prototype)
HasTimestamps.call(Model.prototype)
HidesAttributes.call(Model.prototype)
GuardsAttributes.call(Model.prototype)

Model = ModelProxy(Model)

export { Model, ModelProxy }
export default Model
