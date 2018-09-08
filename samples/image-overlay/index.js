const vr = require('../../~/index')
const VROverlay = require('../../~/VROverlay')
// const path = require('path')

class ImageOverlay {
  constructor () {
    this.system = null
    this.overlay = null
  }

  generateGradient (w, h) {
    const out = []

    for (let y = 0; y < h; y++) {
      const colorBase = y / h
      for (let x = 0; x < w; x++) {
        out.push(
          (Math.cos(colorBase * h / x) + 0.33) % 1,
          (Math.cos(colorBase * h / x) + 0.66) % 1,
          Math.cos(colorBase * h / x),
          1
        )
      }
    }

    // throw it out as the typedarray it always wanted to be.
    // and scale it up because our math is based on 0-1 www
    console.log('done generating')
    return Uint8ClampedArray.from(out.map(x => x * 255))
    // return Float32Array.from(out)
  }

  init () {
    this.system = vr.system.VR_Init(vr.EVRApplicationType.VRApplication_Overlay)
    // vrTools.printAgent(this.system)

    this.overlay = new VROverlay({ system: this.system, key: 'electronvr.sample' })
    // this.overlay.width = 1
    console.log('pre-transform')
    this.overlay.transformTrackedDeviceRelative(vr.k_unTrackedDeviceIndex_Hmd, { x: 0, y: 0, z: -1 })
    console.log('post-transform')

    const size = 1024
    this.overlay.setTextureFromBuffer(this.generateGradient(size, size), { width: size, height: size })
    console.log('set texture done')

    // this.testEvent()

    this.overlay.show()
  }

  async testEvent () {
    while (true) {
      const d = await this.overlay.nextEvent()
      if (d == null) {
        await wait(1000 / 15)
        continue
      }
      d.eventType = vr.keyFromEnum(vr.EVREventType, d.eventType)
      console.log(d)
    }
  }
}

function wait (time) {
  return new Promise((resolve) => {
    setTimeout(() => { resolve() }, time)
  })
}

async function run () {
  try {
    const io = new ImageOverlay()
    io.init()
    // io.showImage()
    console.log('rendering. waiting forever.')
    setTimeout(() => {}, 10000000)
  } catch (e) {
    console.error(e)
  }
}

run()
