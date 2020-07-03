import _ from 'lodash'

/**
 * HidesAttributes Trait
 *
 * @constructor
 * @mixin
 */
const HidesAttributes = function () {
  /**
   * The attributes that should be hidden for serialization.
   *
   * @var {Array}
   */
  this._hidden = []

  /**
   * The attributes that should be visible in serialization.
   *
   * @var {Array}
   */
  this._visible = []

  /**
   * Get the hidden attributes for the model.
   *
   * @return {Array}
   */
  this.getHidden = function () {
    return this._hidden
  }

  /**
   * Set the hidden attributes for the model.
   *
   * @return this
   * @param {Array} hidden
   */
  this.setHidden = function (hidden) {
    this._hidden = [...hidden]

    return this
  }

  /**
   * Add hidden attributes for the model.
   *
   * @return void
   * @param {Array|null} attributes
   */
  this.addHidden = function (attributes = null) {
    this._hidden = _.union(this._hidden, attributes instanceof Array ? attributes : [...arguments])
  }

  /**
   * Get the visible attributes for the model.
   *
   * @return {Array}
   */
  this.getVisible = function () {
    return this._visible
  }

  /**
   * Set the visible attributes for the model.
   *
   * @return this
   * @param {Array} visible
   */
  this.setVisible = function (visible) {
    this._visible = [...visible]

    return this
  }

  /**
   * Add visible attributes for the model.
   *
   * @return void
   * @param {Array|null} attributes
   */
  this.addVisible = function (attributes = null) {
    this._visible = _.union(this._visible, attributes instanceof Array ? attributes : [...arguments])
  }

  /**
   * Make the given, typically hidden, attributes visible.
   *
   * @return this
   * @param {Array|string} attributes
   */
  this.makeVisible = function (attributes) {
    this._hidden = _.difference(this._hidden, attributes instanceof Array ? attributes : [attributes])

    if (!this._visible.length) {
      this.addVisible(attributes)
    }

    return this
  }

  /**
   * Make the given, typically visible, attributes hidden.
   *
   * @return this
   * @param {Array|String} attributes
   */
  this.makeHidden = function (attributes) {
    attributes = attributes instanceof Array ? attributes : [...arguments]

    this._visible = _.difference(this._visible, attributes)

    this._hidden = _.uniq(_.union(this._hidden, attributes))

    return this
  }
}

export { HidesAttributes }
export default HidesAttributes
