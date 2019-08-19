const delayed =
    typeof setImmediate !== 'undefined'
        ? setImmediate
        : typeof process !== 'undefined'
            ? process.nextTick
            : setTimeout

const noop = function(){}
const when = (predicate, isTrue = noop, isFalse = noop) => 
    predicate ? isTrue() : isFalse()


const initApplicativeState = (self, other) => ({
    func      : false,
    funcLoaded: false,
    val       : false,
    valLoaded : false,
    rejected  : false,
    allState  : undefined,
    forkSelf  : self.fork,
    forkOther : other.fork,
    purge     : ([a, b]) => (self.purge(a), other.purge(b))
})

const initConcatState = (self, other) => ({
    done     : false,
    allState : undefined,
    forkSelf : self.fork,
    forkOther: other.fork,
    purge    : ([a, b]) => (self.purge(a), other.purge(b))
})


class Task {
    constructor(fork, purge = noop ){
        this.fork = fork
        this.purge = purge
    }
    static of(b) {
        return new Task((_, resolve) => resolve(b))
    }
    static rejected(b) {
        return new Task(rejected => rejected(b))
    }
    map(f) {
        return new Task((reject,resolve) => 
            this.fork(reject, b => resolve(f(b))), this.purge)
    }
    chain(f) {
        return new Task((reject, resolve) =>
            this.fork(reject, b => f(b).fork(reject, resolve)), this.purge)
    }
    ap(otherTask) {

        const state = initApplicativeState(this, otherTask)

        return new Task((reject, resolve) => {

            const guardReject = value => when(!state.rejected, () => ( state.rejected = true, reject(value)))

            const guardResolve = setter => value => {

                const setValueAndThen = next => (setter(value), next())
                const idOfValue       = () => value
                const delayedPurge    = () => delayed(() => state.purge(state.allState))
                const resolveState    = () => resolve(state.func(state.val))
                const purgeAndResolve = () => (delayedPurge(), resolveState())
                const resolveWhenBothLoaded = () => 
                    when(state.funcLoaded && state.valLoaded, purgeAndResolve, idOfValue)

                return when( state.rejected, idOfValue, () => setValueAndThen(resolveWhenBothLoaded) )
                
            }
            
            const registerFunction = func => (state.funcLoaded = true, state.func = func)
            const registerValue    = val  => (state.valLoaded = true, state.val = val)

            const thisState = state.forkSelf(guardReject, guardResolve(registerFunction))
            const thatState = state.forkOther(guardReject, guardResolve(registerValue))

            return state.allState = [thisState, thatState]

        }, state.purge)

    }
    concat(that) {
        const state        = initConcatState(this, that)
        
        const delayedPurge = () => delayed(() => state.purge(state.allState))
        const complete     = () => state.done = true
        const guard        = f => x => when(!state.done, () => (complete(), delayedPurge(), f(x)))

        return new Task((reject, resolve) => {

            const selfState  = state.forkSelf(guard(reject), guard(resolve))
            const otherState = state.forkOther(guard(reject), guard(resolve))
        
            return state.allState = [selfState, otherState]

        }, state.purge)
    }
    empty(){
        return new Task(function(){})
    }
    toString() {
        return 'Task'
    }
    fold(f, g) {
        return new Task((reject, resolve) =>
            this.fork(a => resolve(f(a)), b => resolve(g(b))), this.purge)
    }
    cata(pattern){
        return this.fold(pattern.Reject, pattern.Resolved)
    }
    swap(){
        return new Task((reject, resolve) => this.fork(resolve, reject), this.purge)
    }
    bimap(f, g){
        return new Task((reject, resolve) => this.fork(a => reject(f(a)), b => resolve(g(b))), this.purge)
    }
    rejectedMap(f){
        return new Task((reject, resolve) => this.fork(a => reject(f(a)), resolve), this.purge)
    }
}

module.exports = Task