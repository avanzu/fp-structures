const Either = require('../lib/either')
//const claire = 
const {forAll, data: {Int, Any: BigAny}, sized} = require('claire')
const laws = require('laws')
const Any = sized(() => 10, BigAny)
const {curry$, deepEq$} = require('./helper')
const k = curry$((a, b) => a)

describe('Either', () => {
    const {Left, Right, fromNullable} = Either

    describe('Constructor', () => {
        test('Left', () => {
            forAll(Any)
                .satisfy((a) => 
                    Left(a).isLeft && !Left(a).isRight)
                .asTest({ verbose: true, times: 100 })()
        })
        test('Right', () => {
            forAll(Any)
                .satisfy(a =>  Right(a).isRight && !Right(a).isLeft)
                .asTest({ verbose: true, times: 100 })()
        })
        test('from-nullable', () => {
            forAll(Any)
                .satisfy(a  => a == null ? fromNullable(a).isLeft : fromNullable(a).isRight)
                .classify(a => a == null  ?  'Null' : 'Not null')
                .asTest({ verbose: true, times: 100 })()
        })

        test('of should always return a Right', () => {
            forAll(Any)
                .satisfy(a => Either.of(a).isEqual(Right(a)))
                .asTest({ verbose: true, times: 100 })()
        })

    })

    test('x.ap(b) should keep x for Lefts', () => {
        forAll(Int).satisfy(
            a => Left(a =>  a + 1).ap(Right(a)).isLeft
        ).asTest({ verbose: true, times: 100 })()  
    })

    test('map(f) should keep Lefts unchanged', () => {
        forAll(Any).satisfy(
            a => Left(a).map(() => [a, a]).isEqual(Left(a))
        ).asTest({ verbose: true, times: 100 })()
    })
    
    test('chain(f) should keep Lefts unchanged', () => {
        forAll(Any).satisfy(
            a => Left(a).chain(() => Right(a)).isEqual(Left(a))
        ).asTest({ verbose: true, times: 100 })()
    })
    test('Left.concat(Right) should keep the Left side', () => {
        forAll(Any).satisfy(
            a => Left(a).concat(Right(a)).isEqual(Left(a))
        ).asTest({ verbose: true, times: 100 })()
    })
    test('Right.concat(Left) should keep the Left side', () => {
        forAll(Any).satisfy(
            a => Right(a).concat(Left(a)).isEqual(Left(a))
        ).asTest({ verbose: true, times: 100 })()
    })

    test('Left.concat(Left) should keep the first Left', () => {
        forAll(Any).satisfy(
            (a, b) => Left(a).concat(Left(b)).isEqual(Left(a))
        ).asTest({ verbose: true, times: 100 })()
    })
    test('merge() should return any value', () => {
        forAll(Any)
            .satisfy(a => Right(a).merge() === Left(a).merge())
            .asTest({ verbose: true, times: 100 })()
    })

    test('swap', () => {
        forAll(Any)
            .satisfy(a => 
                Right(a).swap().isEqual(Left(a)) 
                &&
                Left(a).swap().isEqual(Right(a))
            ).asTest({ verbose: true, times: 100 })()
    })

    describe('to String', () => {
        test('Right', () => {
            forAll(Int)
                .satisfy(a => Right(a).toString() === `Right(${a})`)
                .asTest({ verbose: true, times: 100 })()
        })
        test('Left', () => {
            forAll(Int)
                .satisfy(a => Left(a).toString() === `Left(${a})`)
                .asTest({ verbose: true, times: 100 })()
        })
    })

    describe('is equal', () => {
        test('Rights are always equivalent to Rights, but not Lefts', () => {
            forAll(Any)
                .satisfy(a => Right(a).isEqual(Right(a)) && !Right(a).isEqual(Left(a)))
                .asTest({ verbose: true, times: 100 })()
        })

        test('Rights are never equal Rights with different values', () => {
            forAll(Any, Any).given((x, y) => ( x !== y)
                //curry$((x$, y$) => !deepEq$(x$, y$, '==='))
            ).satisfy(
                (a, b) => !Right(a).isEqual(Right(b))
            )
                .asTest({verbose: true, times: 1000})()
        })
    })

    describe('get', () => {
        test('For rights should return the value.', () => {
            forAll(Any)
                .satisfy(a => Right(a).get() === a)
                .asTest({verbose: true, times: 100})()
            
        })  
        test('For lefts should throw a type error ', () => {
            forAll(Any)
                .satisfy(a => {
                    expect(() => Left(a).get()).toThrow(TypeError)
                    return true
                })
                .asTest({verbose: true, times: 100})()
        })
    })

    describe('bimap', () => {
        test('For lefts should return a new left mapped by f ', () => {
            forAll(Any, Any, Any)
                .given((a, b, c) => (a !== c && b !== c))
                .satisfy((a, b, c) => Left(a).bimap(() => (b), () => (c)).isEqual(Left(b)))
                .asTest({verbose: true, times: 100})()
        })
        test('For rights should return a new right mapped by f ', () => {
            forAll(Any, Any, Any)
                .given((a, b, c) => (a !== c && b !== c))
                .satisfy((a, b, c) => Right(a).bimap(() => (b), () => (c)).isEqual(Right(c)))
                .asTest({verbose: true, times: 100})()
        })
    })

    describe('left map', () => {
        test('For lefts should return a new left mapped by f ', () => {
            forAll(Any, Any)
                .given((a, b) => a !== b)
                .satisfy((a, b) => Left(a)
                    .leftMap(() => (b))
                    .isEqual(Left(b)))
                .asTest({verbose: true, times: 100})()
        })
        test('For rights should return itself',() => {
            forAll(Any, Any)
                .given((a, b) => a !== b)
                .satisfy((a, b) => Right(a)
                    .leftMap(() => (b))
                    .isEqual(Right(a)))
                .asTest({verbose: true, times: 100})()
        })
    })

    describe('fold', () => {
        test('For lefts, should call f', () => {
            forAll(Any, Any, Any)
                .given((a, b) => (a !== b))
                .satisfy(
                    (a, b, c) => 
                        Left(a)
                            .fold(() => Right(b), () => Left(c))
                            .isEqual(Right(b))
                ).asTest({verbose: true, times: 100})()
        }) 
        test('For rights, should call g', () => {
            forAll(Any, Any, Any)
                .given((a, b) => (a !== b))
                .satisfy(
                    (a, b, c) => Right(a)
                        .fold(() => Right(b), () => Left(c))
                        .isEqual(Left(c))
                ).asTest({verbose: true, times: 100})()
        })
    })

    describe('algebraic laws', () => {

        const make = a => Right(a)

        describe(': Functor', () =>  {
            test('1. Identity', () =>  {laws.functor.identity(make).asTest({ verbose: true, times: 100 })()})
            test('2. Composition',() => {laws.functor.composition(make).asTest({ verbose: true, times: 100 })()})
        })
        describe(': Applicative', () => {
            test('1. Identity', () => {laws.applicative.identity(make).asTest({ verbose: true, times: 100 })()})
            test('2. Composition', () => {laws.applicative.composition(make).asTest({ verbose: true, times: 100 })()})
            test('3. Homomorphism', () => {laws.applicative.homomorphism(make).asTest({ verbose: true, times: 100 })()})
            test('4. Interchange', () => {laws.applicative.interchange(make).asTest({ verbose: true, times: 100 })()})
        })
        describe(': Chain', () => {
            test('1. Associativity', () =>  {laws.chain.associativity(make).asTest({ verbose: true, times: 100 })()})
        })
        describe(': Monad', () =>  {
            test('1. Left identity', () => {laws.monad.leftIdentity(make).asTest({ verbose: true, times: 100 })()})
            test('2. Right identity',() =>  {laws.monad.rightIdentity(make).asTest({ verbose: true, times: 100 })()})
        })


    })


})