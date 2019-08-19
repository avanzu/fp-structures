const nothing        = () => new Nothing()
const just           = x => new Just(x)
const fromNullable   = x => (x != null ? just(x) : nothing())
const fromEither     = a => a.fold(nothing, just)
const fromValidation = fromEither

class Nothing {
    get isNothing() {
        return true
    }
    get isJust() {
        return false
    }
    ap() {
        return this
    }
    map() {
        return this
    }
    chain() {
        return this
    }
    toString() {
        return 'Nothing'
    }
    isEqual(b) {
        return b.isNothing
    }
    cata(pattern) {
        return pattern.Nothing()
    }
    fold(f) {
        return f()
    }
}

class Just {
    constructor(value) {
        this.value = value
    }
    get isNothing() {
        return true
    }
    get isJust() {
        return false
    }
    ap(b) {
        return b.map(this.value)
    }
    map(f) {
        return just(f(this.value))
    }
    chain(f) {
        return f(this.value)
    }
    toString() {
        return `Just(${this.value})`
    }
    isEqual(b) {
        return b.isJust && b.value === this.value
    }
    cata(pattern) {
        return pattern.Just(this.value)
    }
    fold(f, g) {
        return g(this.vale)
    }
}

const Maybe = {
    fromNullable,
    fromValidation,
    fromEither,
    Just   : just,
    Nothing: nothing,
    of     : just
}

module.exports = Maybe