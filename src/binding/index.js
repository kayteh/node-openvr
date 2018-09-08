const { system, overlay, compositor } = require('bindings')('openvr')

const e = {
  system,
  overlay,
  compositor
}

module.exports = e
