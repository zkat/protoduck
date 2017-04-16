/* global describe, it */
var assert = require('assert')
var protocol = require('../')

describe('protocol definitions', function () {
  it('collects the protocol types', function () {
    var Eq = protocol(['a', 'b'], {
      eq: ['a', 'b'],
      neq: ['b', 'a']
    })
    assert.deepEqual(Eq._types, ['a', 'b'])
  })
  it('collects the genfun types and their positions', function () {
    var Eq = protocol(['a', 'b'], {
      eq: ['a', 'b'],
      neq: ['b', 'a']
    })
    assert.deepEqual(Eq._gfTypes, {
      eq: [0, 1],
      neq: [1, 0]
    })
  })
  it('allows omission of types array', function () {
    var Show = protocol({ show: [] })
    assert.deepEqual(Show._types, [])
  })
  it('adds the protocol itself to its functions', function () {
    var Show = protocol({ show: [] })
    assert.equal(Show.show.protocol, Show, '`.show()` has a reference to Show')
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
      Eq([Number, Number])
      assert.ok(Eq.eq(1, 1))
      assert.ok(Eq.neq(2, 3))
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
    }, /no proto impl/i)
  })
  it('fails if no matching implementation', function () {
    var Eq = protocol(['a'], { eq: ['a', 'a'] })
    assert.throws(function () {
      Eq.eq(1, 1)
    }, /no proto impl/i)
  })
  it('errors if too many types specified', function () {
    var Eq = protocol(['a', 'b'], {
      eq: ['a', 'b']
    })
    assert.throws(function () {
      Eq([Number, String, Number], { eq: function () {} })
    })
  })
  it('treats missing types in impls as Object', function () {
    var Foo = protocol(['a', 'b'], {
      frob: ['a', 'b']
    })
    Foo([Number], { frob: function (n, anything) { return n + anything } })
    assert.equal(Foo.frob(1, 'two'), '1two')
    assert.equal(Foo.frob(1, 2), 3)
    assert.throws(function () {
      Foo.frob('str', 1)
    }, /no proto impl/i)
  })
  it('errors if an extra function is implemented', function () {
    var Eq = protocol(['a'], { eq: ['a', 'a'] })
    assert.throws(function () {
      Eq([Number], { eq: function () {}, extra: function () {} })
    }, /`extra` is not part of the protocol/i)
  })
  it('errors if a function without a default is not implemented', function () {
    var Eq = protocol(['a'], { eq: ['a', 'a'] })
    assert.throws(function () {
      Eq([Number], { })
    }, /missing implementation for `eq`/i)
  })
})
