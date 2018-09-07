const openvr = require('bindings')('openvr')
const headers = require('../headers')
const math = require('./math')

module.exports = {
  ...openvr,
  ...headers,
  math,

  keyFromEnum (enum_, val) {
    for (let en in enum_) {
      if (enum_[en] === val) return en
    }

    return undefined
  }
}