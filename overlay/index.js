const vr = require('..')
const { VRVec3 } = require('../tools')

console.log(vr.overlay)

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

    if (!skipChecks) this.init()
  }

  init () {
    if (!vr.overlay.Check()) {
      throw new Error("Couldn't initialize a VROverlay. Are you in Scene or Overlay mode from VR_Init?")
    }
    console.log('pre-create overlay')
    this.handle = vr.overlay.CreateOverlay(this.key, this.name)
    console.log('post-create overlay')
  }

  show () {
    vr.overlay.ShowOverlay(this.handle)
  }

  get alpha () {
    return vr.overlay.GetOverlayAlpha(this.handle)
  }

  set alpha (v) {
    vr.overlay.SetOverlayAlpha(this.handle)
  }

  setTextureRaw (tex, {width, height, depth}) {
    // if depth isn't defined, but it is a typed array, we can use the typed array bitness
    // otherwise, just 8 (0-255)
    depth = depth || (tex.BYTES_PER_ELEMENT != null) ? tex.BYTES_PER_ELEMENT * 8 : 8
    vr.overlay.SetOverlayRaw(this.handle, tex, width, height, depth)
  }

  setTextureFromFile (path) {
    console.log(vr.overlay.SetOverlayFromFile(this.handle, path))
  }

  transformTrackedDeviceRelative (trackedDevice, {x, y, z}) {
    vr.overlay.SetOverlayTransformTrackedDeviceRelative(this.handle, trackedDevice, VRVec3.HmdMatrix34(x, y, z))
  }

  transformAbsolute ({x, y, z}) {
    vr.overlay.SetOverlayTransformAbsolute(this.handle, VRVec3.HmdMatrix34(x, y, z))
  }

  get width () {
    return vr.overlay.GetOverlayWidthInMeters(this.handle)
  }

  set width (v) {
    vr.overlay.SetOverlayWidthInMeters(this.handle, v)
  }
}

module.exports = VROverlay
