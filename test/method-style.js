/* global describe, it */
var assert = require('assert')
var protocol = require('../')

describe('method-style protocols', function () {
  it('allows typeless definitions', function () {
    assert.doesNotThrow(function () {
      protocol({ map: [] })
    })
  })
  it('adds genfuns as methods if a target is specified', function () {
    var p = protocol({ map: [] })
    var obj1 = {}
    var obj2 = { map: function () { return 'wrong' } }
    p(obj1, { map: function () { return 'one' } })
    p(obj2, { map: function () { return 'two' } })
    assert.equal(obj1.map(), 'one', 'defines a new method-genfun')
    assert.equal(obj2.map(), 'two', 'overrides existing methods by default')
  })
  it('defines unambiguous reference names for methods', function () {
    var p = protocol({ map: [] })
    var obj = {}
    p(obj, { map: function () { return 'success' } })
    assert.equal(obj[p.map.symbol](), 'success', 'method works normally')
    assert.equal(obj[p.map.symbol], obj.map, 'same genfun')
  })
  it('allows private definitions, to only use symbols', function () {
    var p = protocol({ map: [], empty: [] }, { private: true })
    var obj = { empty: 'yup' }
    p(obj, {
      map: function () { return 'map' },
      empty: function () { return 'empty' }
    })
    assert.equal(obj[p.map.symbol](), 'map', 'map works normally')
    assert.equal(obj[p.empty.symbol](), 'empty', 'empty works normally')
    assert.equal(obj.map, undefined, 'map not defined directly')
    assert.equal(obj.empty, 'yup', 'empty not overridden')
  })
  it('uses "default" genfun objects when only types specified', function () {
    var p = protocol(['f'], { map: ['f'] })
    var obj = {}
    p(obj, [Function], { map: function (f) { return 'method' } })
    p([Function], { map: function (f) { return 'plain' } })
    assert.equal(obj.map(function () {}), 'method')
    assert.equal(p.map(function () {}), 'plain')
  })
  it('includes `this` type in `no-impl` error message', function () {
    var Eq = protocol(['a'], { eq: ['a'] })
    Eq(Number, [String], { eq: function (s) { return this === s } })
    assert.throws(function () {
      (1).eq(5)
    }, /Number#eq\(Number\)/i)
  })
  it('adds the protocol itself to the methods', function () {
    var Show = protocol({ show: [] })
    var obj = {}
    Show(obj, [], {
      show: function () {
        assert.equal(this.show.protocol, Show, 'has a reference to Show')
      }
    })
    obj.show()
  })
  it('allows native method-style impls', function () {
    var Show = protocol({ show: [] })
    var obj = {}
    var child = Object.create(obj)
    Show(obj, { show: function () { return 'worked!' } })

    assert.equal(obj.show(), 'worked!', 'method successfully installed')
    assert.equal(child.show(), 'worked!', 'descendants see method fine')
    assert.equal(obj.show, child.show, 'standard inheritance rules in place')
  })
  it('allows native method-style impls to omit type array', function () {
    var Show = protocol({ show: [] })
    var obj = {}
    Show(obj, { show: function () { return 'worked!' } })
    assert.equal(obj.show(), 'worked!', 'method successfully installed')
  })
  it('creates separate genfuns for native method-style impls', function () {
    var Show = protocol([], { show: [] })
    var parent = {}
    var child = Object.create(parent)

    Show(parent, { show: function () { return 'parent' } })
    Show(child, { show: function () { return 'child' } })

    assert.equal(parent.show(), 'parent', 'parent method dispatches ok')
    assert.equal(child.show(), 'child', 'child method dispatches ok')
    assert.notEqual(
      parent.show, child.show, 'actual method objects should be distinct')
  })
  it('handles multiple dispatch on native method-style impls', function () {
    var Eq = protocol(['target'], { equals: ['target'] })
    Eq(Number, [String], {
      equals: function () { return 'numstr' }
    })
    Eq(Number, [Number], {
      equals: function () { return 'numnum' }
    })
    assert.equal(
      Number(1).equals(String('foo')),
      'numstr',
      'Number#equals(String) called'
    )
    assert.equal(
      Number(1).equals(Number(1)),
      'numnum',
      'Number#equals(Number) called'
    )
  })
  it('exposes next-method mechanism on native method impls', function () {
    var Eq = protocol(['target'], { equals: ['target'] })
    var parent = {}
    var child = Object.create(parent)
    Eq(parent, [parent], {
      equals: function () { return 'parent#equals(parent)' }
    })
    Eq(parent, [child], {
      equals: function (c, nextMethod) {
        var parentReturn = nextMethod()
        return parentReturn.replace(/\(parent\)/, '(child)')
      }
    })
    assert.equal(
      parent.equals(parent),
      'parent#equals(parent)',
      'top method called'
    )
    assert.equal(
      parent.equals(child),
      'parent#equals(child)',
      'callNextMethod() worked!'
    )
  })
})
