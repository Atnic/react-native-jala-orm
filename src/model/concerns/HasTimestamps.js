import moment from 'moment'

/**
 * HasTimestamps Trait
 *
 * @constructor
 * @mixin
 */
const HasTimestamps = function () {
  /**
   * Indicates if the model should be timestamped.
   *
   * @var {Boolean}
   */
  this.timestamps = true

  /**
   * Update the model's update timestamp.
   *
   * @return {Boolean}
   */
  this.touch = function () {
    if (!this.usesTimestamps()) {
      return false
    }

    this._updateTimestamps()

    return this.save()
  }

  /**
   * Update the creation and update timestamps.
   *
   * @return void
   */
  this._updateTimestamps = function () {
    const time = this.freshTimestamp()

    if (!(this.constructor.UPDATED_AT == null) && !this.isDirty(this.constructor.UPDATED_AT)) {
      this.setUpdatedAt(time)
    }

    if (!this.exists && ! this.constructor.CREATED_AT == null && !this.isDirty(this.constructor.CREATED_AT)) {
      this.setCreatedAt(time)
    }
  }

  /**
   *
   *
   * @param value
   * @returns {*}
   */
  this.setCreatedAt = function (value) {
    this.setAttribute(this.constructor.CREATED_AT, value)

    return this
  }

  /**
   *
   *
   * @param value
   * @returns {*}
   */
  this.setUpdatedAt = function (value) {
    this.setAttribute(this.constructor.UPDATED_AT, value)

    return this
  }

  /**
   * Get a fresh timestamp for the model.
   *
   * @return moment.Moment
   */
  this.freshTimestamp = function () {
    return moment.utc()
  }

  /**
   * Get a fresh timestamp for the model.
   *
   * @return {String}
   */
  this.freshTimestampString = function () {
    return this.fromDateTime(this.freshTimestamp())
  }

  /**
   * Determine if the model uses timestamps.
   *
   * @return {Boolean}
   */
  this.usesTimestamps = function () {
    return this.timestamps
  }

  /**
   * Get the name of the "created at" column.
   *
   * @return {String}
   */
  this.getCreatedAtColumn = function () {
    return this.constructor.CREATED_AT
  }

  /**
   * Get the name of the "updated at" column.
   *
   * @return {String}
   */
  this.getUpdatedAtColumn = function () {
    return this.constructor.UPDATED_AT
  }
}

export { HasTimestamps }
export default HasTimestamps
