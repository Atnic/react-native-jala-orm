import _ from 'lodash'

/**
 * GuardsAttributes Trait
 *
 * @constructor
 * @mixin
 */
const GuardsAttributes = function () {
  /**
   * The attributes that are mass assignable.
   *
   * @var {Array}
   */
  this._fillable = []

  /**
   * The attributes that aren't mass assignable.
   *
   * @var {Array}
   */
  this._guarded = ['*']

  /**
   * Indicates if all mass assignment is enabled.
   *
   * @var {Boolean}
   */
  this.constructor._unguarded = false

  /**
   * Get the fillable attributes for the model.
   *
   * @return {Array}
   */
  this.getFillable = function () {
    return [...this._fillable]
  }

  /**
   * Set the fillable attributes for the model.
   *
   * @return $this
   * @param {Array} fillable
   */
  this.fillable = function (fillable) {
    this._fillable = [...fillable]

    return this
  }

  /**
   * Get the guarded attributes for the model.
   *
   * @return {Array}
   */
  this.getGuarded = function () {
    return [...this._guarded]
  }

  /**
   * Set the guarded attributes for the model.
   *
   * @return this
   * @param {Array} guarded
   */
  this.guard = function (guarded) {
    this._guarded = [...guarded]

    return this
  }

  /**
   * Disable all mass assignable restrictions.
   *
   * @return void
   * @param {Boolean} state
   */
  this.constructor.unguard = function (state = true) {
    this._unguarded = state
  }

  /**
   * Enable the mass assignment restrictions.
   *
   * @return void
   */
  this.constructor.reguard = function () {
    this._unguarded = false
  }

  /**
   * Determine if current state is "unguarded".
   *
   * @return bool
   */
  this.constructor.isUnguarded = function () {
    return this._unguarded
  }

  /**
   * Run the given callable while being unguarded.
   *
   * @return mixed
   * @param {Function} callback
   */
  this.constructor.unguarded = function (callback) {
    if (this._unguarded) {
      return callback()
    }

    this.unguard()

    try {
      return callback()
    } finally {
      this.reguard()
    }
  }

  /**
   * Determine if the given attribute may be mass assigned.
   *
   * @return {Boolean}
   * @param {String} key
   */
  this.isFillable = function (key) {
    if (this.constructor._unguarded) {
      return true
    }

    // If the key is in the "fillable" array, we can of course assume that it's
    // a fillable attribute. Otherwise, we will check the guarded array when
    // we need to determine if the attribute is black-listed on the model.
    if (this.getFillable().includes(key)) {
      return true
    }

    // If the attribute is explicitly listed in the "guarded" array then we can
    // return false immediately. This means this attribute is definitely not
    // fillable and there is no point in going any further in this method.
    if (this.isGuarded(key)) {
      return false
    }

    return !this.getFillable().length && !key.startsWith('_')
  }

  /**
   * Determine if the given key is guarded.
   *
   * @return {Boolean}
   * @param {String} key
   */
  this.isGuarded = function (key) {
    return this.getGuarded().includes(key) || this.getGuarded() === ['*']
  }

  /**
   * Determine if the model is totally guarded.
   *
   * @return {Boolean}
   */
  this.totallyGuarded = function () {
    return this.getFillable().length === 0 && this.getGuarded() === ['*']
  }

  /**
   * Get the fillable attributes of a given array.
   *
   * @return {Object}
   * @param {Object} attributes
   */
  this._fillableFromArray = function (attributes) {
    if (this.getFillable().length > 0 && !this.constructor._unguarded) {
      return _.pick(attributes, _.intersection(_.keys(attributes), this.getFillable()))
    }

    return attributes
  }
}

export { GuardsAttributes }
export default GuardsAttributes
