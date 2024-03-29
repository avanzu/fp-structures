function curry$(f, bound) {
    let context

    const _curry = args =>
        f.length > 1
            ? function() {
                const params = args ? args.concat() : []
                context = bound ? context || this : this
                return params.push(...arguments) < f.length && arguments.length
                    ? _curry.call(context, params)
                    : f.apply(context, params)
            }
            : f

    return _curry()
}
function deepEq$(x, y, type) {
    const toString = {}.toString,
        hasOwnProperty = {}.hasOwnProperty,
        has = (obj, key) => hasOwnProperty.call(obj, key)
    let first = true
    return eq(x, y, [])
    function eq(a, b, stack) {
        let className, length, size, result, alength, blength, r, key, ref, sizeB
        if (a == null || b == null) {
            return a === b
        }
        if (a.__placeholder__ || b.__placeholder__) {
            return true
        }
        if (a === b) {
            return a !== 0 || 1 / a == 1 / b
        }
        className = toString.call(a)
        if (toString.call(b) != className) {
            return false
        }
        switch (className) {
        case '[object String]':
            return a == String(b)
        case '[object Number]':
            return a != +a ? b != +b : a == 0 ? 1 / a == 1 / b : a == +b
        case '[object Date]':
        case '[object Boolean]':
            return +a == +b
        case '[object RegExp]':
            return (
                a.source == b.source &&
                    a.global == b.global &&
                    a.multiline == b.multiline &&
                    a.ignoreCase == b.ignoreCase
            )
        }
        if (typeof a != 'object' || typeof b != 'object') {
            return false
        }
        length = stack.length
        while (length--) {
            if (stack[length] == a) {
                return true
            }
        }
        stack.push(a)
        size = 0
        result = true
        if (className == '[object Array]') {
            alength = a.length
            blength = b.length
            if (first) {
                switch (type) {
                case '===':
                    result = alength === blength
                    break
                case '<==':
                    result = alength <= blength
                    break
                case '<<=':
                    result = alength < blength
                    break
                }
                size = alength
                first = false
            } else {
                result = alength === blength
                size = alength
            }
            if (result) {
                while (size--) {
                    if (!(result = size in a == size in b && eq(a[size], b[size], stack))) {
                        break
                    }
                }
            }
        } else {
            if ('constructor' in a != 'constructor' in b || a.constructor != b.constructor) {
                return false
            }
            for (key in a) {
                if (has(a, key)) {
                    size++
                    if (!(result = has(b, key) && eq(a[key], b[key], stack))) {
                        break
                    }
                }
            }
            if (result) {
                sizeB = 0
                for (key in b) {
                    if (has(b, key)) {
                        ++sizeB
                    }
                }
                if (first) {
                    if (type === '<<=') {
                        result = size < sizeB
                    } else if (type === '<==') {
                        result = size <= sizeB
                    } else {
                        result = size === sizeB
                    }
                } else {
                    first = false
                    result = size === sizeB
                }
            }
        }
        stack.pop()
        return result
    }
}

module.exports = { deepEq$, curry$ }
