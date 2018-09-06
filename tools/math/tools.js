const ARCPI = 0.017453292519943295 // Math.PI / 180

module.exports = {
  deg2rad (val) {
    return val * ARCPI
  },

  rad2deg (val) {
    return val / ARCPI
  },

  // copysign (a, b) {
  //   return Math.abs(a) * Math.sign(b)
  // },

  clamp (x, f, c) {
    return Math.min(c, Math.max(f, x))
  }
}
