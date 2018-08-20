const openvr = require('bindings')('openvr')
// const fs = require('fs-extra')
const headers = require('./lib/openvr/headers/openvr_api.json')

if (process.env.NODE_OVR_NOHEADERS !== '1') {
  // export enums
  for (let { enumname, values } of headers.enums) {
    const enumOut = {}
    for (let { name, value } of values) {
      enumOut[name] = +value
    }

    openvr[enumname.replace('vr::', '')] = enumOut
  }

  // export consts
  for (let { constname, constval, consttype } of headers.consts) {
    openvr[constname] = (consttype === 'const char *const') ? constval : +constval
  }
}

module.exports = openvr
