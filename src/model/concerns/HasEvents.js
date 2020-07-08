import _ from 'lodash'

/**
 * HasEvents Trait
 *
 * @constructor
 * @mixin
 */
const HasEvents = function () {
  /**
   * The event map for the model.
   *
   * Allows for object-based events for native Eloquent events.
   *
   * @var {Array}
   */
  this._dispatchesEvents = []

  /**
   * User exposed observable events.
   *
   * These are extra user-defined events observers may subscribe to.
   *
   * @var {Array}
   */
  this._observables = []

  /**
   * Register an observer with the Model.
   *
   * @return void
   * @param {Array|Class|Function} observers
   */
  this.constructor.observe = function (observers) {
    const instance = new this()

    observers = observers instanceof Array ? observers : [observers];
    observers.forEach((observer) => {
      instance._registerObserver(observer)
    })
  }

  /**
   * Register a single observer with the model.
   *
   * @param  {Object|String} observer
   * @return void
   *
   * @throws \RuntimeException
   */
  this._registerObserver = function(observer)
  {
    let observerName = this._resolveObserverClassName(observer);

    // When registering a model observer, we will spin through the possible events
    // and determine if this observer has that method. If it does, we will hook
    // it into the model's event system, making it convenient to watch these.
    this.getObservableEvents().forEach((event) => {
      if (event in observer && observer[event] instanceof Function) {
        this._registerModelEvent(event, observerName + '@' + event);
      }
    })
  }

  /**
   * Resolve the observer's class name from an object or string.
   *
   * @param  {Object|Function} observer
   * @return string
   *
   * @throws \InvalidArgumentException
   */
  this._resolveObserverClassName = function(observer)
  {
    if (observer instanceof Function) {
      return observer.name;
    }

    if (observer instanceof Object) {
      return observer.constructor.name;
    }

    throw new Error('Unable to find observer');
  }

  /**
   * Get the observable event names.
   *
   * @return array
   */
  this.getObservableEvents = function () {
    return [
      'retrieved', 'creating', 'created', 'updating',
      'updated', 'deleting', 'deleted', 'saving',
      'saved', 'restoring', 'restored', ...this._observables
    ]
  }

  /**
   * Set the observable event names.
   *
   * @return this
   * @param {Array} observables
   */
  this.setObservableEvents = function (observables) {
    this._observables = [...observables]

    return this
  }

  /**
   * Add an observable event name.
   *
   * @return void
   * @param {Array} observables
   */
  this.addObservableEvents = function (observables) {
    this._observables = _.uniq([...this._observables, ...(observables instanceof Array ? observables : [...arguments])])
  }

  /**
   * Remove an observable event name.
   *
   * @return void
   * @param {Array} observables
   */
  this.removeObservableEvents = function (observables) {
    this._observables = _.difference(
      this._observables, observables instanceof Array ? observables : [...arguments]
    )
  }

  /**
   * Register a model event with the dispatcher.
   *
   * @return void
   * @param {String} event
   * @param {Function} callback
   */
  this.constructor._registerModelEvent = function (event, callback) {
    if (this._dispatcher) {
      const name = this.name

      this._dispatcher.listen(`model.{${event}}: {${name}}`, callback)
    }
  }

  /**
   * Fire the given event for the model.
   *
   * @return boolean
   * @param {String} event
   * @param {Boolean} halt
   */
  this._fireModelEvent = function (event, halt = true) {
    if (this.constructor._dispatcher) {
      return true
    }

    // First, we will get the proper method to call on the event dispatcher, and then we
    // will attempt to fire a custom, object based event for the given event. If that
    // returns a result we can return that result, or we'll call the string events.
    const method = halt ? 'until' : 'fire'

    const result = this._filterModelEventResults(
      this._fireCustomModelEvent(event, method)
    )

    if (result === false) {
      return false
    }

    return result || (this.constructor._dispatcher && this.constructor._dispatcher[method](
      `model.{${event}}: ` + this.constructor.name, this
    ))
  }

  /**
   * Fire a custom model event for the given event.
   *
   * @return {Boolean|void}
   * @param {String} event
   * @param {String} method
   */
  this._fireCustomModelEvent = function (event, method) {
    if (!this._dispatchesEvents[event]) {
      return
    }

    const result = this.constructor._dispatcher[method](new this._dispatchesEvents[event](this))

    if (!(result == null)) {
      return result
    }
  }

  /**
   * Filter the model event results.
   *
   * @return mixed
   * @param result
   */
  this._filterModelEventResults = function (result) {
    if (result instanceof Array) {
      result = result.filter((response) => {
        return !(response == null)
      })
    }

    return result
  }

  /**
   * Register a retrieved model event with the dispatcher.
   *
   * @return void
   * @param {Function} callback
   */
  this.constructor.retrieved = function (callback) {
    this._registerModelEvent('retrieved', callback)
  }

  /**
   * Register a saving model event with the dispatcher.
   *
   * @return void
   * @param {Function} callback
   */
  this.constructor.saving = function (callback) {
    this._registerModelEvent('saving', callback)
  }

  /**
   * Register a saved model event with the dispatcher.
   *
   * @return void
   * @param {Function} callback
   */
  this.constructor.saved = function (callback) {
    this._registerModelEvent('saved', callback)
  }

  /**
   * Register an updating model event with the dispatcher.
   *
   * @return void
   * @param {Function} callback
   */
  this.constructor.updating = function (callback) {
    this._registerModelEvent('updating', callback)
  }

  /**
   * Register an updated model event with the dispatcher.
   *
   * @return void
   * @param {Function} callback
   */
  this.constructor.updated = function (callback) {
    this._registerModelEvent('updated', callback)
  }

  /**
   * Register a creating model event with the dispatcher.
   *
   * @return void
   * @param {Function} callback
   */
  this.constructor.creating = function (callback) {
    this._registerModelEvent('creating', callback)
  }

  /**
   * Register a created model event with the dispatcher.
   *
   * @return void
   * @param {Function} callback
   */
  this.constructor.created = function (callback) {
    this._registerModelEvent('created', callback)
  }

  /**
   * Register a deleting model event with the dispatcher.
   *
   * @return void
   * @param {Function} callback
   */
  this.constructor.deleting = function (callback) {
    this._registerModelEvent('deleting', callback)
  }

  /**
   * Register a deleted model event with the dispatcher.
   *
   * @return void
   * @param {Function} callback
   */
  this.constructor.deleted = function (callback) {
    this._registerModelEvent('deleted', callback)
  }

  /**
   * Remove all of the event listeners for the model.
   *
   * @return void
   */
  this.constructor.flushEventListeners = function () {
    if (!this._dispatcher) {
      return
    }

    const instance = new this()

    instance.getObservableEvents().forEach((event) => {
      this._dispatcher.forget(`model.{${event}}: ` + this.name)
    })

    _.values(instance._dispatchesEvents).forEach((event) => {
      this._dispatcher.forget(event)
    })
  }

  /**
   * Get the event dispatcher instance.
   *
   * @return {Dispatcher}
   */
  this.constructor.getEventDispatcher = function () {
    return this._dispatcher
  }

  /**
   * Set the event dispatcher instance.
   *
   * @return void
   * @param {Dispatcher} dispatcher
   */
  this.constructor.setEventDispatcher = function (dispatcher) {
    this._dispatcher = dispatcher
  }

  /**
   * Unset the event dispatcher for models.
   *
   * @return void
   */
  this.constructor.unsetEventDispatcher = function () {
    this._dispatcher = null
  }

  /**
   * Execute a callback without firing any model events for any model type.
   *
   * @param  {Function}  callback
   * @return {*}
   */
  this.constructor.withoutEvents = function(callback)
  {
    let dispatcher = this.getEventDispatcher();

    this.unsetEventDispatcher();

    try {
      return callback();
    } finally {
      if (dispatcher) {
        this.setEventDispatcher(dispatcher);
      }
    }
  }
}

export { HasEvents }
export default HasEvents
