import _ from 'lodash'
import hash from 'object-hash'
import Scope from '../Scope'

/**
 * HasGlobalScopes Trait
 *
 * @constructor
 * @mixin
 */
const HasGlobalScopes = function () {
  /**
   * Register a new global scope on the model.
   *
   * @return Function
   *
   * @throws {TypeError}
   * @param {Scope|Function|String} scope
   * @param {Function} implementation
   */
  this.constructor.addGlobalScope = function (scope, implementation = null) {
    if (_.isString(scope) && !(implementation == null)) {
      return this._globalScopes = {
        ...this._globalScopes,
        [this.name]: {
          ...this._globalScopes[this.name],
          [scope]: implementation
        }
      }
    } else if (scope instanceof Function) {
      return this._globalScopes = {
        ...this._globalScopes,
        [this.name]: {
          ...this._globalScopes[this.name],
          [hash(scope)]: scope
        }
      }
    } else if (scope instanceof Scope) {
      return this._globalScopes = {
        ...this._globalScopes,
        [this.name]: {
          ...this._globalScopes[this.name],
          [scope.constructor.name]: scope
        }
      }
    }

    throw new TypeError('Global scope must be an instance of Closure or Scope.')
  }

  /**
   * Determine if a model has a global scope.
   *
   * @return {Boolean}
   * @param {Scope|Function} scope
   */
  this.constructor.hasGlobalScope = function (scope) {
    return !(this.getGlobalScope(scope) == null)
  }

  /**
   * Get a global scope registered with the model.
   *
   * @return {Scope|Function|String}
   * @param {Scope|String} scope
   */
  this.constructor.getGlobalScope = function (scope) {
    if (_.isString(scope) ) {
      return _.get(this._globalScopes, this.name + '.' + scope)
    }

    return _.get(
      this._globalScopes, this.name + '.' + scope.constructor.name
    )
  }

  /**
   * Get the global scopes for this class instance.
   *
   * @return {Object}
   */
  this.getGlobalScopes = function () {
    return _.get(this.constructor._globalScopes, this.constructor.name, {})
  }
}

export { HasGlobalScopes }
export default HasGlobalScopes
