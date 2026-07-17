"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventEmitter = exports.EventEmitterEvent = void 0;
const radashi_1 = require("radashi");
class EventEmitterEvent {
    constructor(name, args) {
        this.name = name;
        this.args = args;
        this.isPropagationStopped = false;
    }
    stopPropagation() {
        this.isPropagationStopped = true;
    }
}
exports.EventEmitterEvent = EventEmitterEvent;
class EventEmitter {
    /**
     * Constructor
     *
     * @param emitAsCallback If set to true, the callbacks will receive the arguments as function arguments, instead of a single event object
     */
    constructor(emitAsCallback) {
        this.events = {};
        this.emitAsCallback = emitAsCallback === true;
    }
    /**
     * Emits a given event which has the option to pass additional arguments.
     * @param event
     * @param args
     */
    emit(event, args) {
        args = args !== null && args !== void 0 ? args : {};
        // Check if we got an array of strings
        if ((0, radashi_1.isArray)(event)) {
            event.forEach(e => this.emit(e, args));
            return this;
        }
        // Loop through the events
        if (!(0, radashi_1.isUndefined)(this.events[event])) {
            const e = new EventEmitterEvent(event, args);
            this.events[event].forEach(definition => {
                if (this.emitAsCallback) {
                    if (definition.listener(...(0, radashi_1.castArray)(e.args)) === false) {
                        e.stopPropagation();
                    }
                }
                else {
                    definition.listener(e);
                }
                if (e.isPropagationStopped) {
                    return false;
                }
            });
        }
        return this;
    }
    /**
     * Hooks are quite similar to events and share the same namespace with them.
     * They however have one distinct difference when it comes to their handling.
     * Events are called async, you emit an event and go on. A hook however waits
     * for the registered listeners to finish and allows them to process the given arguments.
     * All listeners are executed in sequence, even if they are async and return a promise object.
     *
     * Therefore this method will always return a promise object you have to wait for.
     *
     * @param event
     * @param args
     */
    emitHook(event, args) {
        // Check if we got arguments
        if ((0, radashi_1.isUndefined)(args) || !(0, radashi_1.isPlainObject)(args)) {
            args = {};
        }
        // Check if we got an array of strings
        if ((0, radashi_1.isArray)(event)) {
            const promises = [];
            event.forEach(e => {
                promises.push(this.emitHook(e, args));
            });
            return Promise.all(promises);
        }
        // Skip if we don't know this event
        if ((0, radashi_1.isUndefined)(this.events[event])) {
            return Promise.resolve(args);
        }
        // Create the event instance
        const e = new EventEmitterEvent(event, args);
        // Loop through the event list using a promise list
        const eventList = this.events[event];
        let i = 0;
        // Create the promise which handles our async events
        return new Promise((resolve, reject) => {
            /**
             * Helper to iterate over the event list and check if we got a promise as result -> Wait for it if required.
             * @param next
             */
            const next = (next) => {
                // Check if we have a next listener or break the loop
                const definition = eventList[i++];
                if ((0, radashi_1.isUndefined)(definition) || e.isPropagationStopped) {
                    resolve(args);
                    return;
                }
                // Call the listener
                const result = this.emitAsCallback ?
                    definition.listener(...(0, radashi_1.castArray)(args)) :
                    definition.listener(e);
                // Check if the propagation was stopped the old way
                if (this.emitAsCallback && result === false) {
                    e.isPropagationStopped = true;
                }
                // Check if the listener returned a promise
                if ((0, radashi_1.isObject)(result) && (0, radashi_1.isFunction)(result.then) && (0, radashi_1.isFunction)(result.catch)) {
                    result.then(() => {
                        next(next);
                    }).catch(reject);
                    return;
                }
                // Go to next listener
                next(next);
            };
            // Start the listener loop
            next(next);
        });
    }
    /**
     * Binds a given listener to a certain event
     * @param event
     * @param listener
     * @param priority Default: 0, the lower the number, the earlier the execution. May be a negative value!
     */
    bind(event, listener, priority) {
        if ((0, radashi_1.isUndefined)(this.events[event])) {
            this.events[event] = [];
        }
        this.events[event].push({
            listener, priority: (0, radashi_1.isNumber)(priority) ? priority : 0
        });
        if (this.events[event].length > 1) {
            this.events[event] = (0, radashi_1.sort)(this.events[event], f => f.priority);
        }
        return this;
    }
    /**
     * Removes a given listener from a certain event
     * @param event
     * @param listener
     */
    unbind(event, listener) {
        if ((0, radashi_1.isUndefined)(this.events[event])) {
            return this;
        }
        this.events[event] = this.events[event].filter((v) => {
            return v.listener !== listener;
        });
        if (this.events[event].length === 0) {
            delete this.events[event];
        }
        return this;
    }
    /**
     * Unbinds either all listeners of a single event, or all listeners for all events
     * @param event
     */
    unbindAll(event) {
        if (!(0, radashi_1.isString)(event)) {
            this.events = {};
        }
        else {
            delete this.events[event];
        }
        return this;
    }
}
exports.EventEmitter = EventEmitter;
//# sourceMappingURL=EventEmitter.js.map