const vr = require('../~')
const { generateImage } = require('./helpers')

// Some math libraries that'll help us
const { Matrix3x4, Vector3 } = vr.math

// Create a system (required step for setting up the overlay system)
vr.system.VR_Init(vr.EVRApplicationType.VRApplication_Overlay)

if (!vr.overlay.Check()) {
  throw new Error('Overlay system failed to set itself up!')
}

console.log('Get the overlay handle')
const overlayHandle = vr.overlay.CreateOverlay('test-app-key', 'Test App Name')

console.log('Generate the image!')
// this doesn't need to be power of two, but it's definitely not going to hurt.
const imgSize = 1024
const image = generateImage(imgSize, imgSize)

console.log('Commit the image!')
vr.overlay.SetOverlayTextureFromBuffer(overlayHandle, image, imgSize, imgSize)

console.log("Let's set a position that's just forward of the device")
const transform = Matrix3x4.fromTransform({
  translation: new Vector3(0, 0, -1)
})

console.log('Bind the overlay to the HMD')
vr.overlay.SetOverlayTransformTrackedDeviceRelative(overlayHandle, vr.k_unTrackedDeviceIndex_Hmd, transform)

console.log('Show the overlay!')
vr.overlay.ShowOverlay(overlayHandle)

// Block for a long time
setTimeout(() => {}, 1e6)
