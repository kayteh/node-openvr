const ovr = require('./src/binding')
const headers = require('./headers')

const math = require('./math')

module.exports = {
  ...ovr,
  ...headers,
  math,

  keyFromEnum (enum_, val) {
    for (let en in enum_) {
      const t = enum_[en]
      if (t === val) return en
    }

    return undefined
  }
}
