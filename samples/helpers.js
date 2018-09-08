const { math: { Vector3, rad2deg } } = require('../~')

const PI2 = Math.PI * Math.PI

module.exports = {
  /**
     * Honestly this is just me showing off what's shader math in JS.
     * Generates a Japanese WWII war flag.
     * @param {Number} w width
     * @param {Number} h height
     * @returns {Uint8ClampedArray} A BGRA array between 0-255
     */
  generateImage (w, h) {
    const startColor = new Vector3(1, 0, 0)
    const circleColor = new Vector3(1, 0, 0)
    const endColor = new Vector3(1, 1, 1)
    const imgArray = [] // BGRA

    const center = {
      x: w / 2,
      y: h / 2
    }

    const maxDist = 0.25

    for (let yy = 0; yy < h; yy++) {
      for (let xx = 0; xx < w; xx++) {
        const cd = {
          x: Math.abs((xx - center.x) / center.x),
          y: Math.abs((yy - center.y) / center.y)
        }

        const dist = Math.sqrt(cd.x * cd.x + cd.y * cd.y)

        // does this pixel intersect the circle?
        if (dist < maxDist) {
          const { x, y, z } = circleColor
          imgArray.push(z, y, x, 1)
        } else {
          // generate the background
          const t = (1 + Math.sin(
            rad2deg(
              (Math.atan2(xx - center.x, yy - center.y) + (PI2)) / Math.PI
            )
          )) * 0.5

          const { x, y, z } = Vector3.lerp(endColor, startColor, t)
          imgArray.push(z, y, x, 1)
        }
      }
    }

    const image = Uint8ClampedArray.from(imgArray).map(v => v * 255)
    return image
  }
}
