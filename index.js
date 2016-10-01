'use strict'

var genfun = require('genfun')

var Protocol = module.exports = function (types, spec, opts) {
  if (!isArray(types)) {
    // protocol(spec, opts?) syntax for method-based protocols
    opts = spec
    spec = types
    types = []
  }
  var proto = function (target, types, impls) {
    return Protocol.impl(proto, target, types, impls)
  }
  proto._metaobject = opts && opts.metaobject
  proto._private = opts && opts.private
  proto._types = types
  proto._defaultImpls = {}
  proto._gfTypes = {}
  proto._derivable = true
  proto._methodNames = Object.keys(spec)
  proto._methodNames.forEach(function (name) {
    proto[name] = proto._metaobject
    ? Protocol.meta.createGenfun(proto._metaobject, proto, null, name)
    : _metaCreateGenfun(null, proto, null, name)
    var gfTypes = spec[name]
    // genfun specs can have a fn attached to the end as a default impl
    if (typeof gfTypes[gfTypes.length - 1] === 'function') {
      proto._defaultImpls[name] = gfTypes.pop()
    } else {
      proto._derivable = false
    }
    proto._gfTypes[name] = gfTypes.map(function (typeId) {
      var idx = proto._types.indexOf(typeId)
      if (idx === -1) {
        throw new Error('type `' + typeId + '` for function `' + name +
                        '` does not match any protocol types')
      } else {
        return idx
      }
    })
  })
  return proto
}

Protocol.noImplFound = genfun.noApplicableMethod

function typeName (obj) {
  return (/\[object ([a-zA-Z0-9]+)\]/)
  .exec(({}).toString.call(obj))[1]
}

function installMethodErrorMessage (proto, gf, target, name) {
  Protocol.noImplFound.add([gf], function (gf, thisArg, args) {
    var msg =
    'No ' + (proto.name || 'protocol') + ' impl for `' +
    (target ? typeName(thisArg) + '#' : '') +
    name +
    '(' +
    [].map.call(args, typeName).join(', ') + ')`'
    msg += '\n\n'
    msg += 'You must implement '
    msg += (proto.name || 'the protocol `' + name + '` belongs to')
    msg += ' in order to call `' + name + '` with these arguments.\n'
    var err = new Error(msg)
    err.protocol = proto
    err.function = gf
    err.thisArg = thisArg
    err.args = args
    throw err
  })
}

Protocol.isDerivable = function (proto) { return proto._derivable }

Protocol.hasImpl = function (proto, arg, args) {
  args = args || []
  if (isArray(arg)) {
    args = arg
    arg = null
  }
  var fns = proto._methodNames
  var gf
  for (var i = 0; i < fns.length; i++) {
    if (arg) {
      gf = arg[fns[i]]
    } else {
      gf = proto[fns[i]]
    }
    if (!gf ||
        (gf.hasMethod
        ? !gf.hasMethod.apply(gf, args)
        : typeof gf === 'function')) {
      return false
    }
  }
  return true
}

Protocol.impl = function (proto, target, types, implementations) {
  if (isArray(target)) {
    // Proto([Array], { map() { ... } })
    implementations = types
    types = target
    target = null
  } else if (types && !isArray(types)) {
    // Proto(Array, { map() { ... } })
    implementations = types
    types = []
  }
  if (typeof target === 'function') {
    target = target.prototype
  }
  if (!implementations && proto._derivable) {
    implementations = proto._defaultImpls
  }
  Object.keys(proto).forEach(function (name) {
    if (name[0] !== '_' &&
        !implementations[name] &&
        !proto._defaultImpls[name]) {
      throw new Error('missing implementation for `' + name + '`')
    }
  })
  var pTypes = proto._types
  if (types.length > pTypes.length) {
    throw new Error('protocol expects to be defined across at least ' +
                     pTypes.length + ' types, but ' + types.length +
                     ' were specified.')
  } else if (types.length < pTypes.length) {
    for (var i = 0; i < pTypes.length - types.length; i++) {
      types.push(Object)
    }
  }
  Object.keys(implementations).forEach(function (name) {
    if (proto._methodNames.indexOf(name) === -1) {
      throw new Error('`' + name + '` is not part of the protocol')
    }
  })
  proto._methodNames.forEach(function (name) {
    var fn = implementations[name] || proto._defaultImpls[name]
    var methodTypes = calculateMethodTypes(name, proto, types)
    if (target != null && !{}.hasOwnProperty.call(target, proto[name].symbol)) {
      var gf = proto._metaobject
      ? Protocol.meta.createGenfun(proto._metaobject, proto, target, name)
      : _metaCreateGenfun(null, proto, target, name)
      target[gf.symbol] = gf
      if (!proto._private) {
        target[name] = gf
      }
    }

    proto._metaobject
    ? Protocol.meta.addMethod(proto._metaobject, proto, target, name, methodTypes, fn)
    : _metaAddMethod(null, proto, target, name, methodTypes, fn)
  })
}

function calculateMethodTypes (name, proto, types) {
  return proto._gfTypes[name].map(function (typeIdx) {
    return types[typeIdx]
  })
}

// MOP
function _metaCreateGenfun (_mo, proto, target, name) {
  var gf = genfun()
  installMethodErrorMessage(proto, gf, target, name)
  gf.protocol = proto
  if (proto[name] && proto[name].symbol) {
    gf.symbol = proto[name].symbol
  } else {
    gf.symbol = typeof Symbol === 'undefined'
    ? ('__protoduck_label_' + name + '_' + proto.toString() + '__')
    : Symbol(name)
  }
  return gf
}
function _metaAddMethod (_mo, proto, target, name, methodTypes, fn) {
  var gf
  if (target) {
    gf = target[proto[name].symbol]
  } else {
    gf = proto[name]
  }
  return gf.add(methodTypes, fn)
}

Protocol.meta = Protocol(['a'], {
  createGenfun: ['a'],
  addMethod: ['a']
})

Protocol.meta([], {
  createGenfun: _metaCreateGenfun,
  addMethod: _metaAddMethod
})

function isArray (x) {
  return Object.prototype.toString.call(x) === '[object Array]'
}
