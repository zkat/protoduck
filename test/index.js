'use strict'

const test = require('tap').test

const duck = require('../')

test('protocol definitions', t => {
  const Eq = duck.define(['a', 'b'], {
    eq: ['a', 'b'],
    neq: ['b', 'a']
  })
  t.deepEqual(Eq._types, ['a', 'b'], 'collects the protocol types')
  t.deepEqual(Eq._gfTypes, {
    eq: [0, 1],
    neq: [1, 0]
  }, 'collects the genfun types and their positions')

  const Show = duck.define({ show: [] })
  t.deepEqual(Show._types, [], 'allows omission of types array')
  t.throws(function () {
    duck.define(['a'], {
      x: ['b']
    }, /type `b` for function `x` does not match any protocol types/)
  }, 'errors if a typespec is invalid')
  t.done()
})

test('derivation', t => {
  const Eq = duck.define(['a'], {
    eq: ['a', function (a) { return this === a }],
    neq: ['a', function (a) { return !this.eq(a) }]
  })
  const obj = {}
  t.ok(Eq.isDerivable, 'isDerivable is true')
  Eq.impl(obj, [obj])
  t.ok(obj.eq(obj), '.eq() was derived!')
  t.ok(obj.neq(Object.create(obj)), '.neq() was derived!')

  const Show = duck.define(['exemplar'], {
    show: ['exemplar'],
    meh: [function () {}]
  }, {name: 'Show'})
  t.notOk(Show.isDerivable, 'disallows derivation if any fns have no defaults')
  t.throws(() => {
    Show.impl(obj, [obj])
  }, /Missing implementation for Show#show\(exemplar\)/)

  const withShow = {show () { return 'success' }}
  Show.impl(withShow)
  t.equal(withShow.show(), 'success', 'default method used')
  t.ok(withShow.show.isGenfun, 'method converted to genfun')
  t.done()
})

test('defines implementations for protocol functions', t => {
  const Eq = duck.define(['a'], {
    eq: ['a']
  }, {name: 'Eq'})
  class Obj {}
  Eq.impl(Obj, [Obj], {
    eq (a) { return this === a }
  })
  const obj = new Obj()
  t.ok(obj.eq(obj), 'Eq(Obj) implemented!')
  t.throws(() => {
    obj.eq(1)
  }, /No Object impl for Eq#eq\(Number\)/,
  'gives a useful error on dispatch failure')
  t.done()
})

test('errors if too many types specified', t => {
  const Eq = duck.define(['a'], {
    eq: ['a']
  })
  t.throws(() => {
    Eq.impl(Number, [Number, String], { eq () {} })
  }, /expects to be defined across 1 type, but 2 were specified/i,
  'useful error message on too-many-types')
  t.done()
})

test('treats missing types in impls as Object', t => {
  const Foo = duck.define(['a', 'b'], {
    frob: ['a', 'b']
  }, {name: 'Foo'})
  Foo.impl(Number, [Number], {
    frob (n, anything) {
      return this + n + anything
    }
  })
  t.equal((1).frob(3, '???'), '4???')
  t.equal((1).frob(2, 3), 6)
  t.throws(() => {
    (1).frob('str', 1)
  }, /No Number impl for Foo#frob\(String, Number\)/i)
  t.done()
})

test('errors if an extra function is implemented', t => {
  const Eq = duck.define(['a'], { eq: ['a'] }, {name: 'Eq'})
  t.throws(() => {
    Eq.impl(Number, [Number], { eq () {}, extra () {} })
  }, /extra\(\) was included in the impl, but is not part of Eq/i)
  t.done()
})

test('errors if a function without a default is not implemented', t => {
  const Eq = duck.define(['a'], { eq: ['a'] }, {name: 'Eq'})
  const obj = {}
  t.throws(function () {
    Eq.impl(obj, [obj], { })
  }, /Missing implementation for Eq#eq\(a\)/)
  t.done()
})

test('exposes next-method mechanism on native method impls', t => {
  const Eq = duck.define(['target'], { equals: ['target'] })
  const parent = {}
  const child = Object.create(parent)
  Eq.impl(parent, [parent], {
    equals () { return 'parent#equals(parent)' }
  })
  Eq.impl(parent, [child], {
    equals (c, nextMethod) {
      const parentReturn = nextMethod()
      return parentReturn.replace(/\(parent\)/, '(child)')
    }
  })
  t.equal(
    parent.equals(parent),
    'parent#equals(parent)',
    'top method called'
  )
  t.equal(
    parent.equals(child),
    'parent#equals(child)',
    'callNextMethod() worked!'
  )
  t.done()
})

test('adds the protocol itself to the methods', t => {
  const Show = duck.define({ show: [] })
  const obj = {}
  Show.impl(obj, [], {
    show () {
      t.equal(this.show.duck, Show, 'has a reference to Show')
    }
  })
  obj.show()
  t.done()
})

test('includes `this` type in `no-impl` error message', t => {
  const Eq = duck.define(['a'], { eq: ['a'] })
  const obj = {}
  Eq.impl(obj, [String], { eq (s) { return this === s } })
  t.throws(() => {
    obj.eq(5)
  }, /Object#eq\(Number\)/i)
  t.done()
})

test('hasImpl', t => {
  const obj1 = {}
  const obj2 = {}
  const proto = duck.define(['a'], {
    foo: ['a'],
    bar: ['a']
  })
  proto.impl(obj1, [obj2], {
    foo () {},
    bar () {}
  })
  t.ok(proto.hasImpl(obj1, [obj2]), 'found impl')
  t.notOk(proto.hasImpl(obj1), 'no impl')
  t.notOk(proto.hasImpl(obj2, [obj1]), 'no impl')
  t.notOk(proto.hasImpl(5, [obj1]), 'no impl')
  t.notOk(proto.hasImpl({}, [obj2]), 'no impl')
  t.done()
})
