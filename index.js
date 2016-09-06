'use strict'

var genfun = require('genfun')

var Protocol = module.exports = function (types, spec, opts) {
  var proto = function (types, impls) {
    return Protocol.impl(proto, types, impls)
  }
  proto._metaobject = opts && opts.metaobject
  proto._types = types
  proto._defaultImpls = {}
  proto._gfTypes = {}
  proto._derivable = true
  Object.keys(spec).forEach(function (name) {
    proto[name] = proto._metaobject
    ? Protocol.meta.createGenfun(proto._metaobject, proto, name)
    : _metaCreateGenfun(null, proto, name)
    var gfTypes = spec[name]
    // genfun specs can have a fn attached to the end as a default impl
    if (typeof gfTypes[gfTypes.length - 1] === 'function') {
      proto._defaultImpls[name] = gfTypes.pop()
    } else {
      proto._derivable = false
    }
    installMethodErrorMessage(proto, name)
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

function installMethodErrorMessage (proto, name) {
  Protocol.noImplFound.add([proto[name]], function (gf, thisArg, args) {
    var msg =
    'No ' + (proto.name || 'protocol') + ' impl for `' +
    name +
    '` found for arguments of types: (' +
    [].map.call(args, function (arg) {
      return (/\[object ([a-zA-Z0-9]+)\]/)
      .exec(({}).toString.call(arg))[1]
    }).join(', ') + ')'
    var err = new Error(msg)
    err.protocol = proto
    err.function = gf
    err.thisArg = thisArg
    err.args = args
    throw err
  })
}

Protocol.isDerivable = function (proto) { return proto._derivable }

Protocol.impl = function (proto, types, implementations) {
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
  if (types.length !== pTypes.length) {
    throw new Error('protocol expects to be defined across ' +
                     pTypes.length + ' types, but ' + types.length +
                     ' were specified.')
  }
  Object.keys(implementations).forEach(function (name) {
    if (!proto[name]) {
      throw new Error('`' + name + '` is not part of the protocol')
    }
    var fn = implementations[name] || proto._defaultImpls[name]
    var methodTypes = calculateMethodTypes(name, proto, types)
    if (proto._metaobject) {
      Protocol.meta.addMethod(proto._metaobject, proto, name, methodTypes, fn)
    } else {
      _metaAddMethod(null, proto, name, methodTypes, fn)
    }
  })
}

function calculateMethodTypes (name, proto, types) {
  return proto._gfTypes[name].map(function (typeIdx) {
    return types[typeIdx]
  })
}

// MOP
function _metaCreateGenfun (_mo, proto, name) {
  return genfun()
}
function _metaAddMethod (_mo, proto, name, methodTypes, fn) {
  return proto[name].add(methodTypes, fn)
}

Protocol.meta = Protocol(['a'], {
  createGenfun: ['a'],
  addMethod: ['a']
})

// There's a bug in genfun that doesn't allow cnm() to [] methods
Protocol.meta.createGenfun.add([Object], _metaCreateGenfun)
Protocol.meta.addMethod.add([Object], _metaAddMethod)
