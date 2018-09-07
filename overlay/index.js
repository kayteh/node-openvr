const vr = require('../src')
const { Vector3, Matrix3x4, Quaternion } = require('../tools')

class VROverlay {
  constructor ({system, key, name, skipChecks = false, handle = null}) {
    // checking for sanity

    if (!skipChecks) {
      if (system == null || (name == null && key == null)) {
        throw new TypeError('VROverlay needs a IVRSystem and a name and/or key argument.')
      }
    }

    this.system = system
    this.name = name || key
    this.key = key || name
    this.handle = handle
    this.renderer = vr.overlay.Internals()

    // probably okay for the user to mess with these
    this.positionMode = 'absolute' // or 'relative
    this.relativeDevice = vr.k_unTrackedDeviceIndex_Hmd

    if (!skipChecks) this.init()
  }

  init () {
    if (!vr.overlay.Check()) {
      throw new Error("Couldn't initialize a VROverlay. Are you in Scene or Overlay mode from VR_Init?")
    }
    // console.log('pre-create overlay')
    this.handle = vr.overlay.CreateOverlay(this.key, this.name)
    // console.log('post-create overlay')
    // console.log(vr.overlay.TestHandle(this.handle), this.handle)
  }

  show () {
    vr.overlay.ShowOverlay(this.handle)
  }

  hide () {
    vr.overlay.HideOverlay(this.handle)
  }

  get alpha () {
    return vr.overlay.GetOverlayAlpha(this.handle)
  }

  set alpha (v) {
    vr.overlay.SetOverlayAlpha(this.handle)
  }

  setTextureRaw (tex, {width, height, depth = 8}) {
    // if depth isn't defined, but it is a typed array, we can use the typed array bitness
    // otherwise, just 8 (0-255)
    vr.overlay.SetOverlayRaw(this.handle, tex, width, height, depth)
  }

  setTextureFromBuffer (tex, {width, height, depth = 8} = {}) {
    // if depth isn't defined, but it is a typed array, we can use the typed array bitness
    // otherwise, just 8 (0-255)
    // tex = Uint8ClampedArray.from(tex)

    if (tex.length !== width * height * 4) {
      console.warn(`Texture is not the correct number of elements for the size given. Got ${tex.length} bytes, looking for ${width * height * 4}.`)
    }

    // tex = Uint8Array.from(tex.map(x => x * 255))

    vr.overlay.SetOverlayTextureFromBuffer(this.handle, tex, width, height, depth)
  }

  setTextureFromFile (path) {
    vr.overlay.SetOverlayFromFile(this.handle, path)
  }

  transformAbsolute (matrix, origin = 1) {
    if (!(matrix instanceof Matrix3x4)) {
      if (!(matrix instanceof Vector3)) {
        matrix = Matrix3x4.fromTransform({ T: new Vector3(matrix.x, matrix.y, matrix.z) })
      } else {
        matrix = Matrix3x4.fromTransform({ T: matrix })
      }
    }

    vr.overlay.SetOverlayTransformAbsolute(this.handle, origin, matrix.HmdMatrix34)
  }

  transformTrackedDeviceRelative (trackedDevice, matrix) {
    if (!(matrix instanceof Matrix3x4)) {
      if (!(matrix instanceof Vector3)) {
        matrix = Matrix3x4.fromTransform({ T: new Vector3(matrix.x, matrix.y, matrix.z) })
      } else {
        matrix = Matrix3x4.fromTransform({ T: matrix })
      }
    }

    vr.overlay.SetOverlayTransformTrackedDeviceRelative(this.handle, trackedDevice, matrix.HmdMatrix34)
  }

  transform ({position = Vector3.zero, rotation = Quaternion.identity, scale = Vector3.one, mode = this.positionMode, relativeDevice = this.relativeDevice} = {}) {
    const m = Matrix3x4.fromTransform({ T: position, rotation, scale })

    if (mode === 'relative') {
      vr.overlay.SetOverlayTransformTrackedDeviceRelative(this.handle, relativeDevice, m.HmdMatrix34)
    } else {
      vr.overlay.SetOverlayTransformAbsolute(this.handle, m.HmdMatrix34)
    }
  }

  get width () {
    return vr.overlay.GetOverlayWidthInMeters(this.handle)
  }

  set width (v) {
    vr.overlay.SetOverlayWidthInMeters(this.handle, v)
  }
}

module.exports = VROverlay
