const vr = require('../../index.js')
const vrTools = require('../../tools')
const VROverlay = require('../../overlay')
const path = require('path')

class ImageOverlay {
  constructor () {
    this.system = null
    this.overlay = null
  }

  init () {
    this.system = vr.system.VR_Init(vr.EVRApplicationType.VRApplication_Overlay)
    vrTools.printAgent(this.system)

    this.overlay = new VROverlay({ system: this.system, key: 'electronvr.sample' })
    console.debug('demo: vroverlay created')
    // this.overlay.width = 1
    // this.overlay.transformTrackedDeviceRelative(vr.k_unTrackedDeviceIndex_Hmd, { x: 0, y: 0, z: -1 })
    console.debug('demo: set transform')
    try {
      console.log(path.join(__dirname, 'sample.jpg'))
      this.overlay.setTextureFromFile(path.join(__dirname, 'sample.jpg'))
    } catch (e) {
      console.error(e)
    }
    console.debug('demo: set tex')

    console.debug('demo: show')
    this.overlay.show()
  }

}

async function run () {
  try {
    const io = new ImageOverlay()
    io.init()
    // io.showImage()
  } catch (e) {
    console.error(e)
  }
  setTimeout(() => {}, 10000000)
}

run()
