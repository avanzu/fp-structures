const right = x => new Right(x)
const left = x => new Left(x)
const identity = x => x
const fromNullable = x => (x != null ? right(x) : left(x))
const fromValidation = v => v.fold(left, right)
const eitherTry = f => (...args) => {
    try {
        return right(f.apply(null, args))
    } catch (e) {
        return left(e)
    }
}

class EitherType {
    constructor(value) {
        this.value = value
    }
    merge() {
        return this.value
    }
    of(a) {
        return right(a)
    }
}


class Right extends EitherType {
    
    get isRight() {
        return true
    }
    get isLeft() {
        return false
    }
    ap(b) {
        return b.map(this.value)
    }
    map(f) {
        return right(f(this.value))
    }
    chain(f) {
        return f(this.value)
    }
    concat(other) {
        return other.fold(() => other, v => right(this.value.concat(v)))
    }
    toString(){
        return `Right(${this.value})`
    }
    isEqual(a) {
        return a.isRight && (a.value === this.value)
    }
    get() {
        return this.value
    }
    fold(_, g) {
        return g(this.value)
    }
    cata({Right: fn = identity}){
        return fn(this.value)
    }
    swap() {
        return left(this.value)
    }
    bimap(_,g){
        return right(g(this.value))
    }
    
    leftMap() { return this }
}

class Left extends EitherType {
    
    get isRight() {
        return false
    }
    get isLeft() {
        return true
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
    
    concat() {
        return this
    }
    toString() {
        return `Left(${this.value})`
    }
    isEqual(b) {
        return b.isLeft && this.value == b.value
    }
    
    fold(f) {
        return f(this.value)
    }
    cata({Left:fn = identity}) {
        return fn(this.value)
    }
    swap() {
        return right(this.value)
    }
    
    bimap(f) {
        return left(f(this.value))
    }
    leftMap(f) {
        return left(f(this.value))
    }
    get() {
        throw new TypeError(`Can't extract the value of a Left(${this.value}).`)
    }
}

const Either = {
    fromNullable,
    fromValidation,
    Left : left,
    Right: right,
    of   : right,
    try  : eitherTry,
    
}

module.exports = Either