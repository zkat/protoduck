'use strict'

const test = require('tap').test

const duck = require('..')

test('basic constraint definitions', t => {
  const Functor = duck.define(['f'], {
    map: ['f']
  }, { name: 'Functor' })

  const Apply = duck.define(['b'], {
    ap: ['b']
  }, {
    name: 'Apply',
    where: [
      Functor('this', ['f'])
    ]
  })

  class Thing {
    constructor (x) {
      this.val = x
    }
  }
  t.throws(() => {
    Apply.impl(Thing, {
      ap (b) {
        return this.map(b.val)
      }
    })
  }, /Implementations of Apply must first implement Functor/,
  'failed to implement Apply on a non-Functor')

  Functor.impl(Thing, {
    map (f) {
      return new Thing(f(this.val))
    }
  })
  Apply.impl(Thing, {
    ap (b) {
      return this.map(b.val)
    }
  })

  t.equal(new Thing('foo').map(x => x + 'o').val, 'fooo', 'Functor works')
  t.equal(
    new Thing('foo').ap(new Thing(x => x + 'o')).val,
    'fooo',
    'Apply works'
  )
  t.done()
})

test('`this` as type identifier', t => {
  const Foo = duck.define(['a'], {
    frob: ['a']
  }, { name: 'Foo' })
  const Bar = duck.define(['b'], {
    frab: ['b']
  }, {
    name: 'Bar',
    where: Foo('b', ['this'])
  })

  class ThingOne {}
  ThingOne.prototype.name = 'ThingOne'
  class ThingTwo {}
  ThingTwo.prototype.name = 'ThingTwo'

  Foo.impl(ThingOne, [ThingTwo], {
    frob () { return 'Foo!' }
  })
  try {
    Bar.impl(ThingOne, [ThingTwo], {
      frab () {}
    })
  } catch (err) {
    t.match(
      err.message,
      /Implementations of Bar must first implement Foo/,
      'Bar requires a ThingTwo#frob(ThingOne) impl'
    )
  }

  Bar.impl(ThingTwo, [ThingOne], {
    frab (one) { return one.frob(this) + 'Bar!' }
  })
  t.ok(Bar.hasImpl(ThingTwo, [ThingOne]), 'impl added!')
  t.equal((new ThingTwo()).frab(new ThingOne()), 'Foo!Bar!')
  t.done()
})

test('shorthand constraints', t => {
  const Functor = duck.define(['f'], {
    map: ['f']
  }, { name: 'Functor' })
  const Apply = duck.define(['f'], {
    ap: ['f']
  }, {
    name: 'Apply',
    where: Functor
  })
  const Alt = duck.define(['b'], {
    alt: ['b']
  }, {
    name: 'Alt',
    where: [
      Functor()
    ]
  })

  class Thing {}

  t.throws(() => {
    Apply.impl(Thing, {
      ap (b) {}
    })
  }, /Implementations of Apply must first implement Functor/,
  'failed to implement Apply on a non-Functor')
  t.throws(() => {
    Alt.impl(Thing, {
      alt (b) {}
    })
  }, /Implementations of Alt must first implement Functor/,
  'failed to implement Apply on a non-Functor')

  Functor.impl(Thing, { map (f) {} })

  Apply.impl(Thing, { ap (b) {} })
  Alt.impl(Thing, { alt (b) {} })

  const obj = new Thing()
  t.ok(Apply.hasImpl(obj), 'Apply impl worked')
  t.ok(Alt.hasImpl(obj), 'Alt impl worked')
  t.done()
})
