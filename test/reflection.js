/* global describe, it */
var assert = require('assert')
var protocol = require('../')

describe('reflection API', function () {
  describe('isDerivable', function () {
    it('returns true if all protocol methods have default impls', function () {
      var deriv = protocol({
        foo: [function () {}],
        bar: [function () {}],
        baz: [function () {}]
      })
      assert.ok(protocol.isDerivable(deriv), 'derivable protocol returns true')

      var oneMethod = protocol({
        foo: []
      })
      assert.ok(!protocol.isDerivable(oneMethod))

      var partialDefaults = protocol({
        foo: [],
        bar: [function () {}]
      })
      assert.ok(!protocol.isDerivable(partialDefaults))
    })
  })
  describe('hasImpl', function () {
    it('returns true for implemented method-style protocols', function () {
      var obj = {}
      var proto = protocol({
        foo: [],
        bar: []
      })
      assert.ok(!protocol.hasImpl(proto, obj))
      proto(obj, {
        foo: function () {},
        bar: function () {}
      })
      assert.ok(protocol.hasImpl(proto, obj))
      assert.ok(!protocol.hasImpl(proto, {}))
    })
    it('returns true for implemented static protocols', function () {
      var obj1 = {}
      var obj2 = {}
      var proto = protocol(['a', 'b'], {
        foo: ['a', 'b'],
        bar: ['a', 'b']
      })
      proto([obj1, obj2], {
        foo: function () {},
        bar: function () {}
      })
      assert.ok(protocol.hasImpl(proto, [obj1, obj2]))
      assert.ok(!protocol.hasImpl(proto, [obj2, obj1]))
      assert.ok(!protocol.hasImpl(proto, [obj1, {}]))
      assert.ok(!protocol.hasImpl(proto, [5, 'ok']))
    })
    it('returns true for implemented multimethod protocols', function () {
      var obj1 = {}
      var obj2 = {}
      var proto = protocol(['a'], {
        foo: ['a'],
        bar: ['a']
      })
      proto(obj1, [obj2], {
        foo: function () {},
        bar: function () {}
      })
      assert.ok(protocol.hasImpl(proto, obj1, [obj2]))
      assert.ok(!protocol.hasImpl(proto, obj2, [obj1]))
      assert.ok(!protocol.hasImpl(proto, 5, [obj1]))
      assert.ok(!protocol.hasImpl(proto, {}, [obj2]))
    })
  })
  describe('MOP', function () {
    describe('createGenfun', function () {
      it('is called when static methods are created')
      it('is called for individual method-style implementations')
      it('defaults to creating a genfun')
      it('defaults to adding the protocol-impl error message')
    })
    describe('addMethod', function () {
      it('is called when methods are added to method-style methods')
      it('is called when methods are added to static methods')
      it('defaults to calling .add on the respective genfun')
    })
  })
})
