const vr = require('./index')

const { Vector3, Matrix3x4, Quaternion } = vr.math

class VROverlay {
  constructor ({ system, key, name, skipChecks = false, handle }) {
    // checking for sanity
    if (!skipChecks) {
      if (system == null || (name == null && key == null)) {
        throw new TypeError('VROverlay needs a IVRSystem and a name and/or key argument.')
      }
    }

    this.system = system
    this.name = name || key
    this.key = key || name

    if (handle != null) {
      this.handle = handle
    }
    // this.renderer = vr.overlay.Internals()

    // probably okay for the user to mess with these
    this.positionMode = 'absolute' // or 'relative
    this.relativeDevice = vr.k_unTrackedDeviceIndex_Hmd

    if (!skipChecks) this.init()
  }

  /**
   * Initialize the overlay system
   */
  init () {
    if (!vr.overlay.Check()) {
      throw new Error("Couldn't initialize a VROverlay. Are you in Scene or Overlay mode from VR_Init?")
    }
    // console.log('pre-create overlay')
    this.handle = vr.overlay.CreateOverlay(this.key, this.name)
    // console.log('post-create overlay')
    // console.log(vr.overlay.TestHandle(this.handle), this.handle)
  }

  /**
   * Show the overlay
   */
  show () {
    vr.overlay.ShowOverlay(this.handle)
  }

  /**
   * Hide the overlay
   */
  hide () {
    vr.overlay.HideOverlay(this.handle)
  }

  /**
   * Gets the alpha value, always between 0-1
   */
  get alpha () {
    return vr.overlay.GetOverlayAlpha(this.handle)
  }

  /**
   * Sets alpha value, always between 0-1
   */
  set alpha (v) {
    vr.overlay.SetOverlayAlpha(this.handle, v)
  }

  /**
   * This is a bad idea, don't use this method. It doesn't really work in OpenVR.
   * Valve even adamantly wants you not to use it. Please sure setTextureFromBuffer instead
   * @param {ArrayBuffer} tex RGBA texture
   * @param {Object} param1 width, height, and depth values
   */
  setTextureRaw (tex, { width, height, depth = 8 }) {
    // if depth isn't defined, but it is a typed array, we can use the typed array bitness
    // otherwise, just 8 (0-255)
    // vr.overlay.SetOverlayRaw(this.handle, tex, width, height, depth)
    throw new Error('OpenVR hates raw textures. Use setTextureFromBuffer instead.')
  }

  /**
   * Sets a the texture of the overlay.
   *
   * Some implementation notes, this is converted into a uint32_t array in the binding.
   * However, any precision beyond 8-bit will not be utilized.
   * Something to do in the future is accept and delineate a Float32Array and use float inputs instead.
   * This function will check if you over or undershoot the array size. It **must** be w*h*4.
   *
   * *Note this is BRGA and not RGBA, red and blue are flipped.*
   * @param {ArrayBuffer} tex BGRA array buffer, e.g. Uint8ClampedArray
   * @param {Object} param1 width and height
   */
  setTextureFromBuffer (tex, { width, height }) {
    if (tex.length !== width * height * 4) {
      console.warn(`Texture is not the correct number of elements for the size given. Got ${tex.length} bytes, looking for ${width * height * 4}.`)
    }

    // tex = Uint8Array.from(tex.map(x => x * 255))

    vr.overlay.SetOverlayTextureFromBuffer(this.handle, tex, width, height)
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

    vr.overlay.SetOverlayTransformAbsolute(this.handle, origin, matrix)
  }

  transformTrackedDeviceRelative (trackedDevice, matrix) {
    if (!(matrix instanceof Matrix3x4)) {
      if (!(matrix instanceof Vector3)) {
        matrix = Matrix3x4.fromTransform({ T: new Vector3(matrix.x, matrix.y, matrix.z) })
      } else {
        matrix = Matrix3x4.fromTransform({ T: matrix })
      }
    }

    vr.overlay.SetOverlayTransformTrackedDeviceRelative(this.handle, trackedDevice, matrix)
  }

  transform ({ position = Vector3.zero, rotation = Quaternion.identity, scale = Vector3.one, mode = this.positionMode, relativeDevice = this.relativeDevice } = {}) {
    const m = Matrix3x4.fromTransform({ T: position, rotation: (rotation), scale })

    if (mode === 'relative') {
      vr.overlay.SetOverlayTransformTrackedDeviceRelative(this.handle, relativeDevice, m)
    } else {
      vr.overlay.SetOverlayTransformAbsolute(this.handle, vr.ETrackingUniverseOrigin.TrackingUniverseStanding, m)
    }
  }

  // get width (): number {
  //   return vr.overlay.GetOverlayWidthInMeters(this.handle)
  // }

  // set width (v: number) {
  //   vr.overlay.SetOverlayWidthInMeters(this.handle, v)
  // }

  nextEvent () {
    const evt = vr.overlay.PollNextOverlayEvent(this.handle)
    if (evt != null && evt !== false) {
      return evt
    }

    return null
  }
}

module.exports = VROverlay
