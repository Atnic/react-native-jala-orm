import _ from 'lodash'
import pluralize from 'pluralize'
import Builder from '../Builder'
import Model from '../Model'
import HasOne from '../relations/HasOne'
import HasOneThrough from '../relations/HasOneThrough'
import MorphOne from '../relations/MorphOne'
import BelongsTo from '../relations/BelongsTo'
import MorphTo from '../relations/MorphTo'
import Relation from '../relations/Relation'
import HasMany from '../relations/HasMany'
import { HasManyThrough } from '../relations/HasOneThrough'
import { MorphMany } from '../relations/MorphMany'
import { BelongsToMany } from '../relations/BelongsToMany'
import { MorphToMany } from '../relations/MorphToMany'

/**
 * HasRelationships Trait
 *
 * @constructor
 * @mixin
 */
const HasRelationships = function () {
  /**
   * The loaded relationships for the model.
   *
   * @var {Object}
   */
  this._relations = {}

  /**
   * The relationships that should be touched on save.
   *
   * @var {Array}
   */
  this._touches = []

  /**
   * The many to many relationship methods.
   *
   * @var {Array}
   */
  this.constructor.manyMethods = [
    'belongsToMany', 'morphToMany', 'morphedByMany',
  ]

  /**
   * Define a one-to-one relationship.
   *
   * @return {HasOne}
   * @param {Function|Model} related
   * @param {String|null} foreignKey
   * @param {String|null} localKey
   */
  this.hasOne = function (related, foreignKey = null, localKey = null) {
    const instance = this._newRelatedInstance(related)

    foreignKey = foreignKey || this.getForeignKey()

    localKey = localKey || this.getKeyName()

    return this._newHasOne(instance.newQuery(), this, instance.getTable() + '.' + foreignKey, localKey)
  }

  /**
   * Instantiate a new HasOne relationship.
   *
   * @return {HasOne}
   * @param {Builder} query
   * @param {Model} parent
   * @param {String} foreignKey
   * @param {String} localKey
   */
  this._newHasOne = function (query, parent, foreignKey, localKey) {
    return new HasOne(query, parent, foreignKey, localKey)
  }

  /**
   * Define a has-one-through relationship.
   *
   * @param  {Function|Model}  related
   * @param  {Function|Model}  through
   * @param  {String|null}  firstKey
   * @param  {String|null}  secondKey
   * @param  {String|null}  localKey
   * @param  {String|null}  secondLocalKey
   * @return {HasOneThrough}
   */
  this.hasOneThrough = function (related, through, firstKey = null, secondKey = null, localKey = null, secondLocalKey = null)
  {
    through = new through;

    firstKey = firstKey || this.getForeignKey();

    secondKey = secondKey || through.getForeignKey();

    return this._newHasOneThrough(
      this._newRelatedInstance(related).newQuery(), this, through,
      firstKey, secondKey, localKey || this.getKeyName(),
      secondLocalKey || through.getKeyName()
    );
  }

  /**
   * Instantiate a new HasOneThrough relationship.
   *
   * @param  {Builder}  query
   * @param  {Model}  farParent
   * @param  {Model}  throughParent
   * @param  {String}  firstKey
   * @param  {String}  secondKey
   * @param  {String}  localKey
   * @param  {String}  secondLocalKey
   * @return {HasOneThrough}
   */
  this._newHasOneThrough = function(query, farParent, throughParent, firstKey, secondKey, localKey, secondLocalKey)
  {
    return new HasOneThrough(query, farParent, throughParent, firstKey, secondKey, localKey, secondLocalKey);
  }

  /**
   * Define a polymorphic one-to-one relationship.
   *
   * @return {MorphOne}
   * @param {Function|Model} related
   * @param {String} name
   * @param {String|null} type
   * @param {String|null} id
   * @param {String|null} localKey
   */
  this.morphOne = function (related, name, type = null, id = null, localKey = null) {
    const instance = this._newRelatedInstance(related);

    [type, id] = this._getMorphs(name, type, id)

    const table = instance.getTable()

    localKey = localKey || this.getKeyName()

    return this._newMorphOne(instance.newQuery(), this, table + '.' + type, table + '.' + id, localKey)
  }

  /**
   * Instantiate a new MorphOne relationship.
   *
   * @return {MorphOne}
   * @param {Builder} query
   * @param {Model} parent
   * @param {String} type
   * @param {String} id
   * @param {String} localKey
   */
  this._newMorphOne = function (query, parent, type, id, localKey) {
    return new MorphOne(query, parent, type, id, localKey)
  }

  /**
   * Define an inverse one-to-one or many relationship.
   *
   * @return {BelongsTo}
   * @param {Function|Model} related
   * @param {String|null} foreignKey
   * @param {String|null} ownerKey
   * @param {String|null} relation
   */
  this.belongsTo = function (related, foreignKey = null, ownerKey = null, relation = null) {
    // If no relation name was given, we will use this debug backtrace to extract
    // the calling method's name and use that as the relationship name as most
    // of the time this will be what we desire to use for the relationships.
    if (relation == null) {
      relation = this._guessBelongsToRelation()
    }

    const instance = this._newRelatedInstance(related)

    // If no foreign key was supplied, we can use a backtrace to guess the proper
    // foreign key name by using the name of the relationship function, which
    // when combined with an "_id" should conventionally match the columns.
    if (foreignKey == null) {
      foreignKey = _.snakeCase(relation) + '_' + instance.getKeyName()
    }

    // Once we have the foreign key names, we'll just create a new Eloquent query
    // for the related models and returns the relationship instance which will
    // actually be responsible for retrieving and hydrating every relations.
    ownerKey = ownerKey || instance.getKeyName()

    return this._newBelongsTo(
      instance.newQuery(), this, foreignKey, ownerKey, relation
    )
  }

  /**
   * Instantiate a new BelongsTo relationship.
   *
   * @return {BelongsTo}
   * @param {Builder} query
   * @param {Model} child
   * @param {String} foreignKey
   * @param {String} ownerKey
   * @param {String} relation
   */
  this._newBelongsTo = function (query, child, foreignKey, ownerKey, relation) {
    return new BelongsTo(query, child, foreignKey, ownerKey, relation)
  }

  /**
   * Define a polymorphic, inverse one-to-one or many relationship.
   *
   * @return {MorphTo}
   * @param {String|null} name
   * @param {String|null} type
   * @param {String|Number|null} id
   */
  this.morphTo = function (name = null, type = null, id = null) {
    // If no name is provided, we will use the backtrace to get the function name
    // since that is most likely the name of the polymorphic interface. We can
    // use that to get both the class and foreign key that will be utilized.
    name = name || this._guessBelongsToRelation();

    [type, id] = this._getMorphs(
      _.snakeCase(name), type, id
    )

    // If the type value is null it is probably safe to assume we're eager loading
    // the relationship. In this case we'll just pass in a dummy query where we
    // need to remove any eager loads that may already be defined on a model.
    const typeClass = this[type]
    return !typeClass
      ? this._morphEagerTo(name, type, id)
      : this._morphInstanceTo(typeClass, name, type, id)
  }

  /**
   * Define a polymorphic, inverse one-to-one or many relationship.
   *
   * @return {MorphTo}
   * @param {String} name
   * @param {String} type
   * @param {String|Number} id
   */
  this._morphEagerTo = function (name, type, id) {
    return this._newMorphTo(
      this.newQuery().setEagerLoads([]), this, id, null, type, name
    )
  }

  /**
   * Define a polymorphic, inverse one-to-one or many relationship.
   *
   * @return {MorphTo}
   * @param {String} target
   * @param {String} name
   * @param {String} type
   * @param {String|Number} id
   */
  this._morphInstanceTo = function (target, name, type, id) {
    const instance = this._newRelatedInstance(
      this.constructor.getActualClassNameForMorph(target)
    )

    return this._newMorphTo(
      instance.newQuery(), this, id, instance.getKeyName(), type, name
    )
  }

  /**
   * Instantiate a new MorphTo relationship.
   *
   * @return {MorphTo}
   * @param {Builder} query
   * @param {Model} parent
   * @param {String} foreignKey
   * @param {String} ownerKey
   * @param {String} type
   * @param {String} relation
   */
  this._newMorphTo = function (query, parent, foreignKey, ownerKey, type, relation) {
    return new MorphTo(query, parent, foreignKey, ownerKey, type, relation)
  }

  /**
   * Retrieve the actual class name for a given morph class.
   *
   * @return {String}
   * @param name
   */
  this.constructor.getActualClassNameForMorph = function (name) {
    return _.get(Relation.morphMap() || [], name, name)
  }

  /**
   * Guess the "belongs to" relationship name.
   *
   * @return {String}
   */
  this._guessBelongsToRelation = function () {
    let caller = this._guessBelongsToRelation.caller

    return caller.name
  }

  /**
   * Define a one-to-many relationship.
   *
   * @return {HasMany}
   * @param {Function|Model} related
   * @param {String} foreignKey
   * @param {String} localKey
   */
  this.hasMany = function (related, foreignKey = null, localKey = null) {
    const instance = this._newRelatedInstance(related)

    foreignKey = foreignKey || this.getForeignKey()

    localKey = localKey || this.getKeyName()

    return this._newHasMany(
      instance.newQuery(), this, instance.getTable() + '.' + foreignKey, localKey
    )
  }

  /**
   * Instantiate a new HasMany relationship.
   *
   * @return {HasMany}
   * @param {Builder} query
   * @param {Model} parent
   * @param {String} foreignKey
   * @param {String} localKey
   */
  this._newHasMany = function (query, parent, foreignKey, localKey) {
    return new HasMany(query, parent, foreignKey, localKey)
  }

  /**
   * Define a has-many-through relationship.
   *
   * @return {HasManyThrough}
   * @param {Function|Model} related
   * @param {String} through
   * @param {String|null} firstKey
   * @param {String|null} secondKey
   * @param {String|null} localKey
   * @param {String|null} secondLocalKey
   */
  this.hasManyThrough = function (related, through, firstKey = null, secondKey = null, localKey = null, secondLocalKey = null) {
    through = new related()

    firstKey = firstKey || this.getForeignKey()

    secondKey = secondKey || through.getForeignKey()

    return this._newHasManyThrough(
      this._newRelatedInstance(related).newQuery(), this, through,
      firstKey, secondKey, localKey || this.getKeyName(),
      secondLocalKey || through.getKeyName()
    )
  }

  /**
   * Instantiate a new HasManyThrough relationship.
   *
   * @return {HasManyThrough}
   * @param {Builder} query
   * @param {Model} farParent
   * @param {Model} throughParent
   * @param {String} firstKey
   * @param {String} secondKey
   * @param {String} localKey
   * @param {String} secondLocalKey
   */
  this._newHasManyThrough = function (query, farParent, throughParent, firstKey, secondKey, localKey, secondLocalKey) {
    return new HasManyThrough(query, farParent, throughParent, firstKey, secondKey, localKey, secondLocalKey)
  }

  /**
   * Define a polymorphic one-to-many relationship.
   *
   * @return {MorphMany}
   * @param {Function|Model} related
   * @param {String} name
   * @param {String|null} type
   * @param {String|null} id
   * @param {String|null} localKey
   */
  this.morphMany = function (related, name, type = null, id = null, localKey = null) {
    const instance = this._newRelatedInstance(related);

    // Here we will gather up the morph type and ID for the relationship so that we
    // can properly query the intermediate table of a relation. Finally, we will
    // get the table and create the relationship instances for the developers.
    [type, id] = this._getMorphs(name, type, id)

    const table = instance.getTable()

    localKey = localKey || this.getKeyName()

    return this._newMorphMany(instance.newQuery(), this, table + '.' + type, table + '.' + id, localKey)
  }

  /**
   * Instantiate a new MorphMany relationship.
   *
   * @return {MorphMany}
   * @param {Builder} query
   * @param {Model} parent
   * @param {String} type
   * @param {String} id
   * @param {String} localKey
   */
  this._newMorphMany = function (query, parent, type, id, localKey) {
    return new MorphMany(query, parent, type, id, localKey)
  }

  /**
   * Define a many-to-many relationship.
   *
   * @return {BelongsToMany}
   * @param {Function|Model} related
   * @param {String|null} table
   * @param {String|null} foreignPivotKey
   * @param {String|null} relatedPivotKey
   * @param {String|null} parentKey
   * @param {String|null} relatedKey
   * @param {String|null} relation
   */
  this.belongsToMany = function (related, table = null, foreignPivotKey = null, relatedPivotKey = null,
                                 parentKey = null, relatedKey = null, relation = null) {
    // If no relationship name was passed, we will pull backtraces to get the
    // name of the calling function. We will use that function name as the
    // title of this relation since that is a great convention to apply.
    if (relation == null) {
      relation = this._guessBelongsToManyRelation()
    }

    // First, we'll need to determine the foreign key and "other key" for the
    // relationship. Once we have determined the keys we'll make the query
    // instances as well as the relationship instances we need for this.
    const instance = this._newRelatedInstance(related)

    foreignPivotKey = foreignPivotKey || this.getForeignKey()

    relatedPivotKey = relatedPivotKey || instance.getForeignKey()

    // If no table name was provided, we can guess it by concatenating the two
    // model using underscores in alphabetical order. The two model names
    // are transformed to snake case from their default CamelCase also.
    if (table == null) {
      table = this.joiningTable(related)
    }

    return this._newBelongsToMany(
      instance.newQuery(), this, table, foreignPivotKey,
      relatedPivotKey, parentKey || this.getKeyName(),
      relatedKey || instance.getKeyName(), relation
    )
  }

  /**
   * Instantiate a new BelongsToMany relationship.
   *
   * @return {BelongsToMany}
   * @param {Builder} query
   * @param {Model} parent
   * @param {String} table
   * @param {String} foreignPivotKey
   * @param {String} relatedPivotKey
   * @param {String} parentKey
   * @param {String} relatedKey
   * @param {String} relationName
   */
  this._newBelongsToMany = function (query, parent, table, foreignPivotKey, relatedPivotKey,
                                     parentKey, relatedKey, relationName = null) {
    return new BelongsToMany(query, parent, table, foreignPivotKey, relatedPivotKey, parentKey, relatedKey, relationName)
  }

  /**
   * Define a polymorphic many-to-many relationship.
   *
   * @return {MorphToMany}
   * @param {Function|Model} related
   * @param {String|null} name
   * @param {String|null} table
   * @param {String|null} foreignPivotKey
   * @param {String|null} relatedPivotKey
   * @param {String|null} parentKey
   * @param {String|null} relatedKey
   * @param {Boolean} inverse
   */
  this.morphToMany = function (related, name, table = null, foreignPivotKey = null,
                               relatedPivotKey = null, parentKey = null,
                               relatedKey = null, inverse = false) {
    const caller = this._guessBelongsToManyRelation()

    // First, we will need to determine the foreign key and "other key" for the
    // relationship. Once we have determined the keys we will make the query
    // instances, as well as the relationship instances we need for these.
    const instance = this._newRelatedInstance(related)

    foreignPivotKey = foreignPivotKey || name + '_id'

    relatedPivotKey = relatedPivotKey || instance.getForeignKey()

    // Now we're ready to create a new query builder for this related model and
    // the relationship instances for this relation. This relations will set
    // appropriate query constraints then entirely manages the hydrations.
    table = table || pluralize(name)

    return this._newMorphToMany(
      instance.newQuery(), this, name, table,
      foreignPivotKey, relatedPivotKey, parentKey || this.getKeyName(),
      relatedKey || instance.getKeyName(), caller, inverse
    )
  }

  /**
   * Instantiate a new HasManyThrough relationship.
   *
   * @return {MorphToMany}
   * @param {Builder} query
   * @param {Model} parent
   * @param {String} name
   * @param {String} table
   * @param {String} foreignPivotKey
   * @param {String} relatedPivotKey
   * @param {String} parentKey
   * @param {String} relatedKey
   * @param {String} relationName
   * @param {Boolean} inverse
   */
  this._newMorphToMany = function (query, parent, name, table, foreignPivotKey,
                                   relatedPivotKey, parentKey, relatedKey,
                                   relationName = null, inverse = false) {
    return new MorphToMany(query, parent, name, table, foreignPivotKey, relatedPivotKey, parentKey, relatedKey,
      relationName, inverse)
  }

  /**
   * Define a polymorphic, inverse many-to-many relationship.
   *
   * @return {MorphToMany}
   * @param {Function|Model} related
   * @param {String|null} name
   * @param {String|null} table
   * @param {String|null} foreignPivotKey
   * @param {String|null} relatedPivotKey
   * @param {String|null} parentKey
   * @param {String|null} relatedKey
   */
  this.morphedByMany = function (related, name, table = null, foreignPivotKey = null,
                                 relatedPivotKey = null, parentKey = null, relatedKey = null) {
    foreignPivotKey = foreignPivotKey || this.getForeignKey()

    // For the inverse of the polymorphic many-to-many relations, we will change
    // the way we determine the foreign and other keys, as it is the opposite
    // of the morph-to-many method since we're figuring out these inverses.
    relatedPivotKey = relatedPivotKey || name + '_id'

    return this.morphToMany(
      related, name, table, foreignPivotKey,
      relatedPivotKey, parentKey, relatedKey, true
    )
  }

  /**
   * Get the relationship name of the belongs to many.
   *
   * @return {String}
   */
  this._guessBelongsToManyRelation = function () {
    const caller = _.first([this._guessBelongsToManyRelation.caller], (trace) => {
      return !this.constructor.manyMethods.includes(trace.name)
    })

    return caller ? caller.name : null
  }

  /**
   * Get the joining table name for a many-to-many relation.
   *
   * @return {String}
   * @param {Function|Model} related
   * @param {Model|null} instance
   */
  this.joiningTable = function (related, instance) {
    // The joining table name, by convention, is simply the snake cased model
    // sorted alphabetically and concatenated with an underscore, so we can
    // just sort the model and join them together to get the table name.
    const segments = [
      instance ? instance.joiningTableSegment() : _.snakeCase((new related()).constructor.name),
      this.joiningTableSegment()
    ]

    // Now that we have the model names in an array we can just sort them and
    // use the implode function to join them together with an underscores,
    // which is typically used by convention within the database system.
    _.sort(segments)

    return segments.join('_').toLowerCase()
  }

  /**
   * Get this model's half of the intermediate table name for belongsToMany relationships.
   *
   * @return string
   */
  this.joiningTableSegment = function()
  {
    return _.snakeCase(this.name);
  }

  /**
   * Determine if the model touches a given relation.
   *
   * @return {Boolean}
   * @param {String} relation
   */
  this.touches = function (relation) {
    return this._touches.includes(relation)
  }

  /**
   * Touch the owning relations of the model.
   *
   * @return void
   */
  this.touchOwners = function () {
    this._touches.forEach((relation) => {
      this[relation]().touch()
      if (this[relation] instanceof Model) {
        this[relation]._fireModelEvent('saved', false)

        this[relation].touchOwners()
      } else if (this[relation] instanceof Array) { // Original is Collection
        this[relation].forEach((relation) => {
          relation.touchOwners()
        })
      }
    })
  }

  /**
   * Get the polymorphic relationship columns.
   *
   * @return array
   * @param {String} name
   * @param {String} type
   * @param {String} id
   */
  this._getMorphs = function (name, type, id) {
    return [type || name + '_type', id || name + '_id']
  }

  /**
   * Get the class name for polymorphic relations.
   *
   * @return {String}
   */
  this.getMorphClass = function () {
    const morphMap = Relation.morphMap()

    if (!!morphMap && morphMap.includes(this.constructor.name)) {
      return _.find(morphMap, this.constructor.name, true)
    }

    return this.constructor.name
  }

  /**
   * Create a new model instance for a related model.
   *
   * @return {Model}
   * @param {Function|Model} related
   */
  this._newRelatedInstance = function (related) {
    return _.tap(new related(), (instance) => {
      if (!instance.getConnectionName()) {
        instance.setConnection(this._connection)
      }
    })
  }

  /**
   * Get all the loaded relations for the instance.
   *
   * @return {Object}
   */
  this.getRelations = function () {
    return {...this._relations}
  }

  /**
   * Get a specified relationship.
   *
   * @param  {String}  relation
   * @return {*}
   */
  this.getRelation = function (relation) {
    return this._relations[relation]
  }

  /**
   * Determine if the given relation is loaded.
   *
   * @return bool
   * @param {String} key
   */
  this.relationLoaded = function (key) {
    return (key in this._relations)
  }

  /**
   * Set the specific relationship in the model.
   *
   * @return {Model}
   * @param {String} relation
   * @param {*} value
   */
  this.setRelation = function (relation, value) {
    this._relations = {
      ...this._relations,
      [relation]: value
    }

    return this
  }

  /**
   * Unset a loaded relationship.
   *
   * @param  {String}  relation
   * @return {Model}
   */
  this.unsetRelation = function(relation)
  {
    let relations = {...this._relations}
    delete relations[relation];
    this._relations = {...relations}

    return this;
  }

  /**
   * Set the entire relations array on the model.
   *
   * @return {Model}
   * @param {Object} relations
   */
  this.setRelations = function (relations) {
    this._relations = {...relations}

    return this
  }

  /**
   * Get the relationships that are touched on save.
   *
   * @return {Array}
   */
  this.getTouchedRelations = function () {
    return this._touches
  }

  /**
   * Set the relationships that are touched on save.
   *
   * @return {Model}
   * @param {Array} touches
   */
  this.setTouchedRelations = function (touches) {
    this._touches = [...touches]

    return this
  }
}

export { HasRelationships }
export default HasRelationships
