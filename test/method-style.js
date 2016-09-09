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
    var obj2 = {}
    p(obj1, { map: function () { return 'one' } })
    p(obj2, { map: function () { return 'two' } })
    assert.equal(obj1.map(), 'one')
    assert.equal(obj2.map(), 'two')
  })
  it('uses "default" genfun objects when only types specified', function () {
    var p = protocol(['f'], { map: ['f'] })
    var obj = {}
    p(obj, [Function], { map: function (f) { return 'method' } })
    p([Function], { map: function (f) { return 'plain' } })
    assert.equal(obj.map(function () {}), 'method')
    assert.equal(p.map(function () {}), 'plain')
  })
})
