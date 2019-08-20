var Task = require('../lib/task')
const fail = message => () => { throw new Error(message) }
const expectValue = expected => actual => expect(actual).toEqual(expected)
const expectFinalValue = (expected, done) => actual => 
    (expectValue(expected)(actual), done())

test('Task#ap(aTask) starts both tasks concurrently', done => {
    var t1_status = 'pending'
    var t2_status = 'pending'

    var t1 = new Task((reject, resolve) => {
        t1_status = 'running'

        setTimeout(() => expect(t2_status).toEqual('running'))
        setTimeout(() => ((t1_status = 'done'), resolve(x => (expect(x).toEqual(1), x + 1))), 1000)
    })

    var t2 = new Task((reject, resolve) => {
        t2_status = 'running'

        setTimeout(() => expect(t1_status).toEqual('running'))
        setTimeout(() => ((t2_status = 'done'), resolve(1)), 1000)
    })

    t1.ap(t2).fork(
        () => done('.ap should succeed'), 
        value => (expect(value).toEqual(2), done())
    )
})

test('Task#ap(aTask) applicative function behaviour', done => {
    Task.of(x => x + 1)
        .ap(Task.of(1))
        .fork(
            () => done('.ap should succeed'), 
            value => (expect(value).toEqual(2), done())
        )
})

test('Task#ap(aTask) should fail once if one fails', done => {
    var failures = 0
    var rejections = 0

    var t1 = new Task(reject => (reject(2), ++rejections))
    var t2 = new Task(reject => (reject(1), ++rejections))

    t1.ap(t2).fork(
        () => ++failures, 
        () => null
    )

    setTimeout(() => (expect(failures).toEqual(1), done()), 100)
})


test('Task#cata shold resolve both sides', done => {
    const Rejected = () => false
    const Resolved = () => true

    const goodTask = Task.of('something').cata({ Rejected, Resolved })
    const badTask  = Task.rejected('nope').cata({ Rejected, Resolved })

    goodTask.fork(fail('Should not be rejected'), expectValue(true))
    badTask.fork(fail('Should not be rejected'), expectFinalValue(false, done) )

})