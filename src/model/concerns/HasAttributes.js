import _ from 'lodash'
import moment from 'moment'
import { Relation } from '../relations/Relation'

/**
 * HasAttributes Trait
 *
 * @constructor
 * @mixin
 */
const HasAttributes = function () {
  /**
   * The model's attributes.
   *
   * @var {Object}
   */
  this._attributes = {}

  /**
   * The model attribute's original state.
   *
   * @var {Object}
   */
  this._original = {}

  /**
   * The changed model attributes.
   *
   * @var {Object}
   */
  this._changes = {}

  /**
   * The attributes that should be cast to native types.
   *
   * @var {Object}
   */
  this._casts = {}

  /**
   * The attributes that should be mutated to dates.
   *
   * @var {Array}
   */
  this._dates = []

  /**
   * The storage format of the model's date columns.
   *
   * @var {String}
   */
  this._dateFormat = undefined

  /**
   * The accessors to append to the model's array form.
   *
   * @var {Array}
   */
  this._appends = []

  /**
   * Indicates whether attributes are snake cased on arrays.
   *
   * @var {Boolean}
   */
  this.constructor.snakeAttributes = true

  /**
   * The cache of the mutated attributes for each class.
   *
   * @var {Object}
   */
  this.constructor._mutatorCache = {}

  /**
   * Convert the model's attributes to an array.
   *
   * @return {Object}
   */
  this.attributesToArray = function () {
    // If an attribute is a date, we will cast it to a string after converting it
    // to a DateTime / Carbon instance. This is so we will get some consistent
    // formatting while accessing attributes vs. arraying / JSONing a model.
    let attributes = this._getArrayableAttributes()
    attributes = this._addDateAttributesToArray(
      attributes
    )

    const mutatedAttributes = this.getMutatedAttributes()
    attributes = this._addMutatedAttributesToArray(
      attributes, mutatedAttributes
    )

    // Next we will handle any casts that have been setup for this model and cast
    // the values to their appropriate type. If the attribute has a mutator we
    // will not perform the cast on those attributes to avoid any confusion.
    attributes = this._addCastAttributesToArray(
      attributes, mutatedAttributes
    )

    // Here we will grab all of the appended, calculated attributes to this model
    // as these attributes are not really in the attributes array, but are run
    // when we need to array or JSON the model for convenience to the coder.
    _.keys(this._getArrayableAppends()).forEach((key) => {
      attributes[key] = this._mutateAttributeForArray(key, null)
    })

    return attributes
  }

  /**
   * Add the date attributes to the attributes array.
   *
   * @return {Object}
   * @param {Object} attributes
   */
  this._addDateAttributesToArray = function (attributes) {
    this.getDates().forEach((key) => {
      if (!attributes[key]) {
        return
      }
      attributes[key] = this._serializeDate(
        this._asDateTime(attributes[key])
      )
    })
    return attributes
  }

  /**
   * Add the mutated attributes to the attributes array.
   *
   * @return {Object}
   * @param {Object} attributes
   * @param {Object} mutatedAttributes
   */
  this._addMutatedAttributesToArray = function (attributes, mutatedAttributes) {
    mutatedAttributes.forEach((key) => {
      // We want to spin through all the mutated attributes for this model and call
      // the mutator for the attribute. We cache off every mutated attributes so
      // we don't have to constantly check on attributes that actually change.
      if (!(key in attributes)) {
        return
      }

      // Next, we will call the mutator for this attribute so that we can get these
      // mutated attribute's actual values. After we finish mutating each of the
      // attributes we will return this final array of the mutated attributes.
      attributes[key] = this._mutateAttributeForArray(
        key, attributes[key]
      )
    })

    return attributes
  }

  /**
   * Add the casted attributes to the attributes array.
   *
   * @return {Object}
   * @param {Object} attributes
   * @param {Object} mutatedAttributes
   */
  this._addCastAttributesToArray = function (attributes, mutatedAttributes) {
    _.forEach(this.getCasts()).forEach((value, key) => {
      if (!(key in attributes) || mutatedAttributes.includes(key)) {
        return
      }

      // Here we will cast the attribute. Then, if the cast is a date or datetime cast
      // then we will serialize the date for the array. This will convert the dates
      // to strings based on the date format specified for these Eloquent models.
      attributes[key] = this._castAttribute(
        key, attributes[key]
      )

      // If the attribute cast was a date or a datetime, we will serialize the date as
      // a string. This allows the developers to customize how dates are serialized
      // into an array without affecting how they are persisted into the storage.
      if (attributes[key] &&
        (value === 'date' || value === 'datetime')) {
        attributes[key] = this._serializeDate(attributes[key])
      }

      if (attributes[key] && this._isCustomDateTimeCast(value)) {
        attributes[key] = attributes[key].format(value.split(':')[1]);
      }
    })

    return attributes
  }

  /**
   * Get an attribute array of all arrayable attributes.
   *
   * @return {Object}
   */
  this._getArrayableAttributes = function () {
    return this._getArrayableItems(this._attributes)
  }

  /**
   * Get all of the appendable values that are arrayable.
   *
   * @return {Object}
   */
  this._getArrayableAppends = function () {
    if (!this._appends.length) {
      return {}
    }

    return this._getArrayableItems(
      this._appends.flatMap((v) => {
        const append = {}
        append[v] = v
        return append
      })
    )
  }

  /**
   * Get the model's relationships in array form.
   *
   * @return {Object}
   */
  this.relationsToArray = function () {
    const attributes = {}
    let relation

    this._getArrayableRelations().forEach((value, key) => {
      // If the values implements the Arrayable interface we can just call this
      // toArray method on the instances which will convert both models and
      // collections to their proper array form and we'll set the values.
      if ('toArray' in value) {
        relation = value.toArray()
      }

      // If the value is null, we'll still go ahead and set it in this list of
      // attributes since null is used to represent empty relationships if
      // if it a has one or belongs to type relationships on the models.
      else if (value === null) {
        relation = value
      }

      // If the relationships snake-casing is enabled, we will snake case this
      // key so that the relation attribute is snake cased in this returned
      // array to the developers, making this consistent with attributes.
      if (this.constructor.snakeAttributes) {
        key = _.snakeCase(key)
      }

      // If the relation value has been set, we will set it on this attributes
      // list for returning. If it was not arrayable or null, we'll not set
      // the value on the array because it is some type of invalid value.
      if (!(typeof relation === 'undefined') || value === null) {
        attributes[key] = relation
      }

      relation = undefined
    })

    return attributes
  }

  /**
   * Get an attribute array of all arrayable relations.
   *
   * @return {Object}
   */
  this._getArrayableRelations = function () {
    return this._getArrayableItems(this._relations)
  }

  /**
   * Get an attribute array of all arrayable values.
   *
   * @return {Object}
   * @param {Object} values
   */
  this._getArrayableItems = function (values) {
    if (this.getVisible().length > 0) {
      const keys = _.intersection(_.keys(values), this.getVisible())
      values = _.pick(values, keys)
    }

    if (this.getHidden().length > 0) {
      const keys = _.difference(_.keys(values), this.getHidden())
      values = _.pick(values, keys)
    }

    return values
  }

  /**
   * Get an attribute from the model.
   *
   * @return {*}
   * @param {String} key
   */
  this.getAttribute = function (key) {
    if (!key) {
      return
    }

    // If the attribute exists in the attribute array or has a "get" mutator we will
    // get the attribute's value. Otherwise, we will proceed as if the developers
    // are asking for a relationship's value. This covers both types of values.
    if (key in this._attributes ||
      this.hasGetMutator(key)) {
      return this.getAttributeValue(key)
    }

    // Here we will determine if the model base class itself contains this given key
    // since we don't want to treat any of those methods as relationships because
    // they are all intended as helper methods and none of these are relations.
    if (key in this.constructor && typeof this.constructor[key] === 'function') {
      return
    }

    return this.getRelationValue(key)
  }

  /**
   * Get a plain attribute (not a relationship).
   *
   * @return {*}
   * @param {String} key
   */
  this.getAttributeValue = function (key) {
    const value = this._getAttributeFromArray(key)

    // If the attribute has a get mutator, we will call that then return what
    // it returns as the value, which is useful for transforming values on
    // retrieval from the model to a form that is more useful for usage.
    if (this.hasGetMutator(key)) {
      return this._mutateAttribute(key, value)
    }

    // If the attribute exists within the cast array, we will convert it to
    // an appropriate native PHP type dependant upon the associated value
    // given with the key in the pair. Dayle made this comment line up.
    if (this.hasCast(key)) {
      return this._castAttribute(key, value)
    }

    // If the attribute is listed as a date, we will convert it to a DateTime
    // instance on retrieval, which makes it quite convenient to work with
    // date fields without having to create a mutator for each property.
    if (this.getDates().includes(key) &&
      !(value === null)) {
      return this._asDateTime(value)
    }

    return value
  }

  /**
   * Get an attribute from the $attributes array.
   *
   * @return {*}
   * @param {String} key
   */
  this._getAttributeFromArray = function (key) {
    if (key in this._attributes) {
      return this._attributes[key]
    }
  }

  /**
   * Get a relationship.
   *
   * @return {*}
   * @param {String} key
   */
  this.getRelationValue = function (key) {
    // If the key already exists in the relationships array, it just means the
    // relationship has already been loaded, so we'll just return it out of
    // here because there is no need to query within the relations twice.
    if (this.relationLoaded(key)) {
      return this._relations[key]
    }

    // If the "attribute" exists as a method on the model, we will just assume
    // it is a relationship and will load and return results from the query
    // and hydrate the relationship's value on the "relationships" array.
    if (key in this && typeof this[key] === 'function') {
      return this._getRelationshipFromMethod(key)
    }
  }

  /**
   * Get a relationship value from a method.
   *
   * @return {*}
   *
   * @param {String} method
   */
  this._getRelationshipFromMethod = function (method) {
    const relation = this[method]()

    if (!(relation instanceof Relation)) {
      if (relation === null) {
        throw new Error(`${method} must return a relationship instance, but "null" was returned. Was the "return" keyword used`)
      }
      throw new Error(`${method} must return a relationship instance.`)
    }

    return _.tap(relation.getResults(), (results) => {
      this.setRelation(method, results)
    })
  }

  /**
   * Determine if a get mutator exists for an attribute.
   *
   * @return {Boolean}
   * @param {String} key
   */
  this.hasGetMutator = function (key) {
    return `get${_.upperFirst(_.camelCase(key))}Attribute` in this
  }

  /**
   * Get the value of an attribute using its mutator.
   *
   * @return {*}
   * @param {String} key
   * @param value
   */
  this._mutateAttribute = function (key, value) {
    return this[`get${_.upperFirst(_.camelCase(key))}Attribute`](value)
  }

  /**
   * Get the value of an attribute using its mutator for array conversion.
   *
   * @return {*}
   * @param {String} key
   * @param value
   */
  this._mutateAttributeForArray = function (key, value) {
    value = this._mutateAttribute(key, value)

    return 'toArray' in value ? value.toArray() : value
  }

  /**
   * Cast an attribute to a native PHP type.
   *
   * @return {*}
   * @param {String} key
   * @param value
   */
  this._castAttribute = function (key, value) {
    if (value === null) {
      return value
    }

    switch (this._getCastType(key)) {
      case 'int':
      case 'integer':
        return parseInt(value)
      case 'real':
      case 'float':
      case 'double':
        return parseFloat(value)
      case 'string':
        return value.toString()
      case 'bool':
      case 'boolean':
        return !!value
      case 'object':
      case 'json':
        return this.fromJson(value, true)
      case 'array':
        return this.fromJson(value)
      case 'collection':
        return this.fromJson(value)
      // return new BaseCollection(this.fromJson(value)); // TODO
      case 'date':
        return this._asDate(value)
      case 'datetime':
      case 'custom_datetime':
        return this._asDateTime(value)
      case 'timestamp':
        return this._asTimestamp(value)
      default:
        return value
    }
  }

  /**
   * Get the type of cast for a model attribute.
   *
   * @return {String}
   * @param {String} key
   */
  this._getCastType = function (key) {
    if (this._isCustomDateTimeCast(this.getCasts()[key]))
      return 'custom_datetime';

    if (this._isDecimalCast(this.getCasts()[key]))
      return 'decimal';

    return this.getCasts()[key].toLowerCase().trim()
  }

  /**
   * Determine if the cast type is a custom date time cast.
   *
   * @param  {String}  cast
   * @return bool
   */
  this._isCustomDateTimeCast = function (cast)
  {
    return _.includes(cast, 'date:') ||
      _.includes(cast, 'datetime:');
  }

  /**
   * Determine if the cast type is a decimal cast.
   *
   * @param  {String}  cast
   * @return bool
   */
  this._isDecimalCast = function(cast)
  {
    return _.includes(cast, 'decimal:');
  }

  /**
   * Set a given attribute on the model.
   *
   * @return this
   * @param {String} key
   * @param value
   */
  this.setAttribute = function (key, value) {
    // First we will check for the presence of a mutator for the set operation
    // which simply lets the developers tweak the attribute as it is set on
    // the model, such as "json_encoding" an listing of data for storage.
    if (this.hasSetMutator(key)) {
      return this._setMutatedAttributeValue(key, value)
    }

    // If an attribute is listed as a "date", we'll convert it from a DateTime
    // instance into a form proper for storage on the database tables using
    // the connection grammar's date format. We will auto set the values.
    else if (value && this._isDateAttribute(key)) {
      value = this.fromDateTime(value)
    }

    if (this._isJsonCastable(key) && !(value === null)) {
      value = this._castAttributeAsJson(key, value)
    }

    // If this attribute contains a JSON ->, we'll set the proper value in the
    // attribute's underlying array. This takes care of properly nesting an
    // attribute in the array's value in the case of deeply nested items.
    if (key.includes('->')) {
      return this.fillJsonAttribute(key, value)
    }

    this._attributes[key] = value

    return this
  }

  /**
   * Determine if a set mutator exists for an attribute.
   *
   * @return {Boolean}
   * @param {String} key
   */
  this.hasSetMutator = function (key) {
    return `set${_.upperFirst(_.camelCase(key))}Attribute` in this
  }

  /**
   * Set the value of an attribute using its mutator.
   *
   * @param  {String}  key
   * @param  {*}  value
   * @return mixed
   */
  this._setMutatedAttributeValue = function(key, value) {
    return this[`set${_.upperFirst(_.camelCase(key))}Attribute`](value)
  }

  /**
   * Determine if the given attribute is a date or date castable.
   *
   * @return {Boolean}
   * @param {String} key
   */
  this._isDateAttribute = function (key) {
    return this.getDates().includes(key) ||
      this._isDateCastable(key)
  }

  /**
   * Set a given JSON attribute on the model.
   *
   * @return this
   * @param {String} key
   * @param value
   */
  this.fillJsonAttribute = function (key, value) {
    let path;
    [key, path] = key.split('->', 2)
    this._attributes[key] = this._asJson(this._getArrayAttributeWithValue(
      path, key, value
    ))

    return this
  }

  /**
   * Get an array attribute with the given key and value set.
   *
   * @return {Object}
   * @param {String} path
   * @param {String} key
   * @param value
   */
  this._getArrayAttributeWithValue = function (path, key, value) {
    const array = this._getArrayAttributeByKey(key)
    _.set(array, path.replace('->', '.'), value)
    return array
  }

  /**
   * Get an array attribute or return an empty array if it is not set.
   *
   * @return {Object}
   * @param {String} key
   */
  this._getArrayAttributeByKey = function (key) {
    return key in this._attributes
      ? this.fromJson(this._attributes[key]) : {}
  }

  /**
   * Cast the given attribute to JSON.
   *
   * @return {String}
   * @param {String} key
   * @param value
   */
  this._castAttributeAsJson = function (key, value) {
    try {
      value = this._asJson(value)
    } catch (e) {
      throw e
    }

    return value
  }

  /**
   * Encode the given value as JSON.
   *
   * @return string
   * @param {Object} value
   */
  this._asJson = function (value) {
    return JSON.stringify(value)
  }

  /**
   * Decode the given JSON back into an array or object.
   *
   * @return {*}
   * @param value
   * @param {Boolean} asObject
   */
  this.fromJson = function (value, asObject = false) {
    return JSON.parse(value)
  }

  /**
   * Decode the given float.
   *
   * @param  {*}  value
   * @return {Number}
   */
  this.fromFloat = function(value)
  {
    switch (String(value)) {
    case 'Infinity':
      return Infinity;
    case '-Infinity':
      return -Infinity;
    case 'NaN':
      return NaN;
    default:
      return Number(value);
    }
  }

  /**
   * Return a decimal as string.
   *
   * @param  {Number}  value
   * @param  {Number}  decimal
   * @return {String}
   */
  this._asDecimal = function(value, decimal)
  {
    return value.toPrecision(decimal);
  }

  /**
   * Return a timestamp as DateTime object with time set to 00:00:00.
   *
   * @return moment.Moment
   * @param value
   */
  this._asDate = function (value) {
    return this._asDateTime(value).startOf('day')
  }

  /**
   * Return a timestamp as DateTime object.
   *
   * @return moment.Moment
   * @param value
   */
  this._asDateTime = function (value) {
    // If this value is already a Carbon instance, we shall just return it as is.
    // This prevents us having to re-instantiate a Carbon instance when we know
    // it already is one, which wouldn't be fulfilled by the DateTime check.
    if (moment.isMoment(value)) {
      return value
    }

    // If the value is already a DateTime instance, we will just skip the rest of
    // these checks since they will be a waste of time, and hinder performance
    // when checking the field. We will just return the DateTime right away.
    if (value instanceof Date) {
      return moment.utc(value)
    }

    // If this value is an integer, we will assume it is a UNIX timestamp's value
    // and format a Carbon object from this timestamp. This allows flexibility
    // when defining your date fields as they might be UNIX timestamps here.
    if (!isNaN(parseFloat(value)) && isFinite(value)) {
      return moment.utc(value, 'X')
    }

    // If the value is in simply year, month, day format, we will instantiate the
    // Carbon instances from that format. Again, this provides for simple date
    // fields on the database, while still supporting Carbonized conversion.
    if (this._isStandardDateFormat(value)) {
      return moment.utc(value, 'YYYY-MM-DD').startOf('day')
    }

    let format = this._getDateFormat()

    // Finally, we will just assume this date is in the format used by default on
    // the database connection and use that format to create the Carbon object
    // that is returned back out to the developers after we convert it here.
    return moment.utc(value, format)
  }

  /**
   * Determine if the given value is a standard date format.
   *
   * @return {Boolean}
   * @param {String} value
   */
  this._isStandardDateFormat = function (value) {
    return !!value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  }

  /**
   * Convert a DateTime to a storable string.
   *
   * @return {String}
   * @param {Date|moment.Moment|null} value
   */
  this.fromDateTime = function (value) {
    return !value ? value : this._asDateTime(value).format(
      this._getDateFormat()
    )
  }

  /**
   * Return a timestamp as unix timestamp.
   *
   * @return {Number}
   * @param value
   */
  this._asTimestamp = function (value) {
    return this._asDateTime(value).unix()
  }

  /**
   * Prepare a date for array / JSON serialization.
   *
   * @return {String}
   * @param {moment.Moment|Date} date
   */
  this._serializeDate = function (date) {
    return date.format(this._getDateFormat())
  }

  /**
   * Get the attributes that should be converted to dates.
   *
   * @return {Array}
   */
  this.getDates = function () {
    const defaults = [this.constructor['CREATED_AT'], this.constructor['UPDATED_AT']]

    return this.usesTimestamps()
      ? _.uniq(this._dates.concat(defaults))
      : this._dates
  }

  /**
   * Get the format for database stored dates.
   *
   * @return string
   */
  this._getDateFormat = function () {
    return this._dateFormat || this.getConnection().getQueryGrammar().getDateFormat();
  }

  /**
   * Set the date format used by the model.
   *
   * @return this
   * @param {String} format
   */
  this.setDateFormat = function (format) {
    this._dateFormat = format

    return this
  }

  /**
   * Determine whether an attribute should be cast to a native type.
   *
   * @return {Boolean}
   * @param {String} key
   * @param {Array|String|null} types
   */
  this.hasCast = function (key, types = null) {
    if (key in this.getCasts()) {
      return types ? this._getCastType(key).includes(types) : true
    }

    return false
  }

  /**
   * Get the casts array.
   *
   * @return {Object}
   */
  this.getCasts = function () {
    if (this.getIncrementing()) {
      const casts = {}
      casts[this.getKeyName()] = this.getKeyType()
      return {
        ...casts,
        ...this._casts
      }
    }

    return this._casts
  }

  /**
   * Determine whether a value is Date / DateTime castable for inbound manipulation.
   *
   * @return {Boolean}
   * @param {String} key
   */
  this._isDateCastable = function (key) {
    return this.hasCast(key, ['date', 'datetime'])
  }

  /**
   * Determine whether a value is JSON castable for inbound manipulation.
   *
   * @return {Boolean}
   * @param {String} key
   */
  this._isJsonCastable = function (key) {
    return this.hasCast(key, ['array', 'json', 'object', 'collection'])
  }

  /**
   * Get all of the current attributes on the model.
   *
   * @return {Object}
   */
  this.getAttributes = function () {
    return this._attributes
  }

  /**
   * Set the array of model attributes. No checking is done.
   *
   * @return this
   * @param {Object} attributes
   * @param {Boolean} sync
   */
  this.setRawAttributes = function (attributes, sync = false) {
    this._attributes = {...attributes}

    if (sync) {
      this.syncOriginal()
    }

    return this
  }

  /**
   * Get the model's original attribute values.
   *
   * @return {*|Object}
   * @param {String|null} key
   * @param {*|null} defaultValue
   */
  this.getOriginal = function (key = null, defaultValue = null) {
    return key ? _.get(this._original, key, defaultValue) : this._original
  }

  /**
   * Get a subset of the model's attributes.
   *
   * @return {Object}
   * @param {Array|String|null} attributes
   */
  this.only = function (attributes) {
    const results = {}

    attributes = (attributes instanceof Array) ? attributes : arguments
    attributes.forEach((attribute) => {
      results[attribute] = this.getAttribute(attribute)
    })

    return results
  }

  /**
   * Sync the original attributes with the current.
   *
   * @return this
   */
  this.syncOriginal = function () {
    this._original = {...this._attributes}

    return this
  }

  /**
   * Sync a single original attribute with its current value.
   *
   * @return this
   * @param {String} attribute
   */
  this.syncOriginalAttribute = function (attribute) {
    return this.syncOriginalAttributes(attribute);
  }

  /**
   * Sync multiple original attribute with their current values.
   *
   * @param  {Array|String}  attributes
   * @return $this
   */
  this.syncOriginalAttributes = function (attributes)
  {
    attributes = attributes instanceof Array ? attributes : [attributes];

    attributes.forEach((attribute) => {
      this._original[attribute] = this._attributes[attribute];
    })

    return this;
  }

  /**
   * Sync the changed attributes.
   *
   * @return this
   */
  this.syncChanges = function () {
    this._changes = this.getDirty()

    return this
  }

  /**
   * Determine if the model or given attribute(s) have been modified.
   *
   * @return {Boolean}
   * @param {Array|String|null} attributes
   */
  this.isDirty = function (attributes) {
    if (attributes !== null) attributes = attributes instanceof Array ? attributes : arguments
    return this._hasChanges(
      this.getDirty(), attributes
    )
  }

  /**
   * Determine if the model or given attribute(s) have remained the same.
   *
   * @return {Boolean}
   * @param {Array|String|null} attributes
   */
  this.isClean = function (attributes) {
    if (attributes !== null) attributes = attributes instanceof Array ? attributes : arguments
    return !this.isDirty(attributes)
  }

  /**
   * Determine if the model or given attribute(s) have been modified.
   *
   * @return {Boolean}
   * @param {Array|String|null} attributes
   */
  this.wasChanged = function (attributes) {
    if (attributes !== null) attributes = attributes instanceof Array ? attributes : arguments
    return this._hasChanges(
      this.getChanges(), attributes
    )
  }

  /**
   * Determine if the given attributes were changed.
   *
   * @return {Boolean}
   * @param {Object} changes
   * @param {Array|String|null} attributes
   */
  this._hasChanges = function (changes, attributes = null) {
    attributes = (!(attributes instanceof Array)) ? attributes : [attributes]

    // If no specific attributes were provided, we will just see if the dirty array
    // already contains any attributes. If it does we will just return that this
    // count is greater than zero. Else, we need to check specific attributes.
    if (!attributes || !attributes.length) {
      return !_.isEmpty(changes)
    }

    // Here we will spin through every attribute and see if this is in the array of
    // dirty attributes. If it is, we will return true and if we make it through
    // all of the attributes for the entire array we will return false at end.
    for (let i = 0; i < attributes.length; i++) {
      if (attributes[i] in changes) return true
    }

    return false
  }

  /**
   * Get the attributes that have been changed since last sync.
   *
   * @return {Object}
   */
  this.getDirty = function () {
    const dirty = {}

    _.forEach(this.getAttributes(), (value, key) => {
      if (!this._originalIsEquivalent(key, value)) {
        dirty[key] = value
      }
    })

    return dirty
  }

  /**
   * Get the attributes that were changed.
   *
   * @return {Object}
   */
  this.getChanges = function () {
    return this._changes
  }

  /**
   * Determine if the new and old values for a given key are equivalent.
   *
   * @return {Boolean}
   * @param {String} key
   * @param current
   */
  this._originalIsEquivalent = function (key, current) {
    if (!(key in this._original)) {
      return false
    }

    const original = this.getOriginal(key)

    if (current === original) {
      return true
    } else if (current === null) {
      return false
    } else if (this._isDateAttribute(key)) {
      return this.fromDateTime(current) === this.fromDateTime(original)
    } else if (this.hasCast(key)) {
      return this._castAttribute(key, current) === this._castAttribute(key, original)
    }

    return !isNaN(parseFloat(current)) && isFinite(current) &&
      !isNaN(parseFloat(original)) && isFinite(original) &&
      current.toString() === original.toString()
  }

  /**
   * Append attributes to query when building a query.
   *
   * @return this
   * @param {Array|String} attributes
   */
  this.append = function (attributes) {
    attributes = (attributes instanceof Array) ? attributes : [attributes]
    this._appends = _.uniq(
      this._appends.concat(attributes)
    )

    return this
  }

  /**
   * Set the accessors to append to model arrays.
   *
   * @return this
   * @param {Array} appends
   */
  this.setAppends = function (appends) {
    this._appends = [...appends]

    return this
  }

  /**
   * Get the mutated attributes for a given instance.
   *
   * @return {Object}
   */
  this.getMutatedAttributes = function () {
    const name = this.constructor.name

    if (!(name in this.constructor._mutatorCache)) {
      this.constructor.cacheMutatedAttributes(name)
    }

    return this.constructor._mutatorCache[name]
  }

  /**
   * Extract and cache all the mutated attributes of a class.
   *
   * @return void
   * @param {String} name
   */
  this.constructor.cacheMutatedAttributes = function (name) {
    this._mutatorCache[name] = this._getMutatorMethods(name).map((match) => {
      return _.lowerFirst(this.snakeAttributes ? _.snakeCase(match) : match)
    })
  }

  /**
   * Get all of the attribute mutator methods.
   *
   * @return {Array}
   * @param {String} name
   */
  this.constructor._getMutatorMethods = function (name) {
    return (Object.getOwnPropertyNames(this.prototype).join(';').match(/(^|;)get([^;]+?)Attribute(;|$)/gi) || []).map((m) => {
      return m.match(/(^|;)get([^;]+?)Attribute(;|$)/)
    }).map((m) => m[1])
  }
}

export { HasAttributes }
export default HasAttributes
