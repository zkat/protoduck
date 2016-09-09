# Protocols [![Travis](https://img.shields.io/travis/zkat/protocols.svg)](https://travis-ci.org/zkat/protocols) [![npm version](https://img.shields.io/npm/v/@zkat/protocols.svg)](https://npm.im/@zkat/protocols) [![license](https://img.shields.io/npm/l/@zkat/protocols.svg)](https://npm.im/@zkat/protocols)

[`protocols`](https://github.com/zkat/protocols) is a JavaScript library for
defining and implementing typeclass-like protocols that support dispatch across
multiple arguments. See also: [Clojure
protocols](http://clojure.org/reference/protocols) but on any number of types
across all arguments of the individual functions.

`protocols` is built on top of [`genfun`](npm.im/genfun), a fast,
prototype-based multimethod library, but this is mostly all behind the scenes.

On top of providing a nice, clear interface for defining interfaces, this
module makes the best effort to verify both protocols and implementations and
tries to provide clear, useful errors for common mistakes.

## Install

`$ npm install @zkat/protocols`

## Table of Contents

* [API](#api)
  * [`protocol()`](#protocol)
  * [`implementation`](#impl)

### API

#### <a name="protocol"></a> `protocol(<types>?, <spec>)`

Defines a new protocol on across arguments of types defined by `<types>`, which
will expect implementations for the functions specified in `<spec>`.

If `<types>` is missing, it will be treated the same as if it were an empty
array.


The types in `<spec>` must map, by string name, to the type names specified in
`<types>`, or be an empty array if `<types>` is omitted. The types in `<spec>`
will then be used to map between method implementations for the individual
functions, and the provided types in the impl.

##### Example

```javascript
const Eq = protocol(['a', 'b'], {
  eq: ['a', 'b']
})
```

#### <a name="impl"></a> `proto(<target>?, <types>?, <implementations>)`

Adds a new implementation to the given `proto` across `<types>`.

`<implementations>` must be an object with functions matching the protocol's
API. The types in `<types>` will be used for defining specific methods using
the function as the body.

Protocol implementations must include either `<target>`, `<types>`, or both:

* If only `<target>` is present, implementations will be defined the same as
  "traditional" methods -- that is, the definitions in `<implementations>`
  will add function properties directly to `<target>`.

* If only `<types>` is present, the protocol will keep all protocol functions as
  "static" methods on the protocol itself.

* If both are specified, protocol implementations will add methods to the `<target>`, and define multimethods using `<types>`.

If a protocol is derivable -- that is, all its functions have default impls,
then the `<implementations>` object can be omitted entirely, and the protocol
will be automatically derived for the given `<types>`

##### Example

```javascript
import protocol from '@zkat/protocols'

// Singly-dispatched protocols
const Show = protocol({
  show: []
})

class Foo {}

Show(Foo, {
  show () { return `[object Foo(${this.name})]` }
})

var f = new Foo()
f.name = 'alex'
f.show() === '[object Foo(alex)]'
```

```javascript
import protocol from '@zkat/protocols'

// Multi-dispatched protocols
const Comparable = protocol(['target'], {
  compare: ['target'],
})

class Foo {}
class Bar {}
class Baz {}

Comparable(Foo, [Bar], {
  compare (bar) { return 'bars are ok' }
})

Comparable(Foo, [Baz], {
  compare (baz) { return 'but bazzes are better' }
})

const foo = new Foo()
const bar = new Bar()
const baz = new Baz()

foo.compare(bar) // 'bars are ok'
foo.compare(baz) // 'but bazzes are better'
```
