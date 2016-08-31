'use strict'

var genfun = require('genfun')

var Protocol = module.exports = function (types, spec) {
  var proto = function (types, impls) {
    return Protocol.impl(proto, types, impls)
  }
  proto._types = types
  proto._defaultImpls = {}
  proto._gfTypes = {}
  proto._derivable = true
  Object.keys(spec).forEach(function (name) {
    proto[name] = genfun()
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

function installMethodErrorMessage (proto, name) {
  genfun.noApplicableMethod.add([proto[name]], (gf, thisArg, args) => {
    let msg =
    'No ' + (proto.name || 'protocol') + ' impl for `' +
    name +
    '` found for arguments of types: (' +
    [].map.call(args, (arg) => {
      return (/\[object ([a-zA-Z0-9]+)\]/)
      .exec(({}).toString.call(arg))[1]
    }).join(', ') + ')'
    let err = new Error(msg)
    err.protocol = proto
    err.function = gf
    err.thisArg = thisArg
    err.args = args
    throw err
  })
}

Protocol.isDerivable = function (proto) { return proto._derivable }

Protocol.impl = function (proto, types, implementations) {
  Object.keys(proto).forEach(function (name) {
    if (name[0] !== '_' && !implementations[name]) {
      throw new Error('Implementation for ' + name + ' missing')
    }
  })
  if (!implementations && proto._derivable) {
    implementations = proto._defaultImpls
  }
  var pTypes = proto._types
  var gfTypes = proto._gfTypes
  Object.keys(implementations).forEach(function (name) {
    if (!proto[name]) {
      throw new Error(name + ' is not part of the protocol')
    }
    var fn = implementations[name]
    var methodTypes = calculateMethodTypes(name, proto, types)
    checkGfTypes(types, pTypes, gfTypes)
    proto[name].add(methodTypes, fn)
  })
}

function calculateMethodTypes (name, proto, types) {
  return proto._gfTypes[name].map(function (typeIdx) {
    return types[typeIdx]
  })
}

function checkGfTypes (implTypes, methodTypes, pTypes, gfTypes) {
  // TODO - validity checks
  return true
}
