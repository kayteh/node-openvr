const headers = require('./lib/openvr/headers/openvr_api.json')
const fs = require('fs')
const path = require('path')

const openvr = {}

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

fs.writeFileSync(path.join(__dirname, 'headers.js'), `module.exports=${JSON.stringify(openvr)}`, {encoding: 'utf-8'})
