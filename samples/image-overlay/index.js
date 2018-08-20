const ovr = require('../../index.js')
const ovrTools = require('../../tools')

class ImageOverlay {
  constructor () {
    this.system = null
    this.overlayHandle = null
  }

  init () {
    this.system = ovr.system.VR_Init(ovr.EVRApplicationType.VRApplication_Overlay)
    ovrTools.printAgent(this.system)
  }

  showImage () {

  }

}

async function run () {
  const io = new ImageOverlay()
  io.init()
  io.showImage()
  setTimeout(() => {}, 10000000)
}

run()
