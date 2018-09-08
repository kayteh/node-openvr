const headers = require('./lib/openvr/headers/openvr_api.json')
const fs = require('fs')
const path = require('path')

const openvr = {
  enums: {},
  consts: {},
  constsFlat: {}
}

for (let { enumname, values } of headers.enums) {
  const enumOut = {}
  for (let { name, value } of values) {
    enumOut[name] = +value
  }

  openvr.enums[enumname.replace('vr::', '')] = enumOut
}

// export consts
for (let { constname, constval, consttype } of headers.consts) {
  openvr.consts[constname] = { val: (consttype.startsWith('const char')) ? constval : +constval, type: consttype }
  openvr.constsFlat[constname] = (!consttype.startsWith('const char')) ? +constval : constval
}

// const consts = Object.keys(openvr.consts).map(name => {
//   const c = openvr.consts[name]
//   return `  ${name}: ${(c.type.startsWith('const char')) ? 'string' : 'number'}`
// }).join(',\n')

// const enums = Object.keys(openvr.enums).map(name => {
//   const e = openvr.enums[name]
//   const vals = Object.keys(e).map(vn => `${e[vn]}`).join(' | ')
//   return `export type ${name} = ${vals}`
// }).join('\n\n')

// const enumsOverall = Object.keys(openvr.enums).map(name => {
//   const e = openvr.enums[name]
//   const vals = Object.keys(e).map(vn => `    ${vn}: ${e[vn]}`).join(',\n')
//   return `  ${name}: {
// ${vals}
//   }`
// }).join(',\n')

const file = `/* eslint-disable */
module.exports = ${JSON.stringify({ ...openvr.enums, ...openvr.constsFlat }, null, '  ')}
`

fs.writeFileSync(path.join(__dirname, 'src/headers.js'), file, { encoding: 'utf-8' })
