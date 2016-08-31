/* global describe, it */
var assert = require('assert')
var protocol = require('../')

describe('types', function () {
  var Eq = protocol(['a', 'b'], {
    eq: ['a', 'b'],
    neq: ['b', 'a']
  })
  it('collects the protocol types', function () {
    assert.deepEqual(Eq._types, ['a', 'b'])
  })
  it('collects the genfun types and their positions', function () {
    assert.deepEqual(Eq._gfTypes, {
      eq: [0, 1],
      neq: [1, 0]
    })
  })
  it('errors if a typespec is invalid', function () {
    assert.throws(function () {
      protocol(['a'], {
        x: ['b']
      }, /type `b` for function `x` does not match any protocol types/)
    })
  })
})

describe('derivation', function () {
  describe('isDerivable', function () {
    var Eq = protocol(['a', 'b'], {
      eq: ['a', 'b', function (a, b) { return a === b }],
      neq: ['a', 'b', function (a, b) { return !Eq.eq(a, b) }]
    })
    it('allows derivation if all functions have default impls', function () {
      assert.ok(protocol.isDerivable(Eq))
    })

    var Show = protocol(['data', 'exemplar'], {
      show: ['data', 'exemplar'],
      meh: ['data', function () {}]
    })
    it('disallows derivation if any of the gfs have no defaults', function () {
      assert.ok(!protocol.isDerivable(Show))
    })
  })
})

describe('implementations', function () {
  describe('protocol implementation', function () {
    it('defines implementations for protocol functions', function () {
      var Eq = protocol(['a', 'b'], {
        eq: ['a', 'b']
      })
      Eq([Number, Number], {
        eq: function (a, b) { return a === b }
      })
      assert.ok(Eq.eq(1, 1))
      assert.throws(function () {
        Eq.eq({}, {})
      }, /no protocol impl/i)
    })
  })
  it('fails if no matching implementation', function () {
    var Eq = protocol(['a'], { eq: ['a', 'a'] })
    assert.throws(function () {
      Eq.eq(1, 1)
    }, /no protocol impl/i)
  })
  it('errors if number of types don\'t match', function () {
    var Eq = protocol(['a', 'b'], {
      eq: ['a', 'b']
    })
    assert.throws(function () {
      Eq([Number], { eq: function () {} })
    })
    assert.throws(function () {
      Eq([Number, String, Number], { eq: function () {} })
    })
  })
})
