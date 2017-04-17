'use strict'

const genfun = require('genfun')
const test = require('tap').test

const duck = require('..')

test('MOP: createGenfun', t => {
  const metaobject = Object.create(null)
  duck.impl(metaobject, {
    createGenfun (d, target, name, deflt) {
      const gf = genfun(deflt)
      gf.metaProp = 'hello'
      return gf
    }
  })
  const Show = duck.define({
    show: []
  }, {metaobject})
  const obj = {}
  Show.impl(obj, {show () { return 'ok' }})
  t.equal(obj.show(), 'ok', 'method defined correctly')
  t.deepEqual(obj.show.duck, null, 'no duck property')
  t.equal(obj.show.metaProp, 'hello', 'extra prop added to gf')
  t.done()
})

test('MOP: addMethod', t => {
  t.plan(2)
  const metaobject = Object.create(null)
  duck.impl(metaobject, {
    addMethod (duck, target, name, methodTypes, fn) {
      t.ok(true, 'inside addMethod method')
      target[name].add(methodTypes, fn)
    }
  })
  const Show = duck.define({
    show: []
  }, {metaobject})
  const obj = {}
  Show.impl(obj, {show () { return 'ok' }})
  t.equal(obj.show(), 'ok', 'method defined correctly')
})

test('MOP: Protoduck as metaobject', t => {
  const metaobject = duck
  duck.impl(metaobject, {
    createGenfun (duck, target, name, deflt, nextMethod) {
      throw new Error('should not execute')
    },
    addMethod () {
      throw new Error('should not execute')
    }
  })
  const Show = duck.define({
    show: []
  }, {metaobject})
  const obj = {}
  Show.impl(obj, {show () { return 'ok' }})
  t.equal(obj.show(), 'ok', 'method defined correctly')
  t.equal(obj.show.duck, Show, 'duck property is there')
  t.ok(true, 'none of the declared methods executed when meta === Protoduck')
  t.done()
})
