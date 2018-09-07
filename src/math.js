// @flow
// so this is a megafile to prevent circular dependencies.

/**
 * Number.EPSILON is too accurate, this is less accurate but close enough.
 */
const EPSILON: number = 1e-5

/**
 * ARCPI is badly named, but is Math.PI / 180
 */
const ARCPI: number = 0.017453292519943295 

function deg2rad (val: number): number {
  return val * ARCPI
}

function rad2deg (val: number): number {
  return val / ARCPI
}

function clamp (x: number, f: number, c: number): number {
  return Math.min(c, Math.max(f, x))
}

type Matrix = Array<Array<number>>
type TRS = {
  T: Vector3,
  R: Quaternion|Vector3,
  S: Vector3
}

type TRSHuman = {
  T?: Vector3,
  R?: Quaternion|Vector3,
  S?: Vector3,
  translation?: Vector3,
  rotation?: Quaternion|Vector3,
  scale?: Vector3
}

type vec3 = {
  x: number,
  y: number,
  z: number
}


type vec4 = {
  x: number,
  y: number,
  z: number,
  w: number
}

function isVec(n: number, obj: Object): boolean {
  const check = ['x', 'y', 'z', 'w'].slice(0, n)
  for (let k of check) {
    if (!(k in obj)) {
      return false
    }
  }

  return true
}

/**
 * Quaternion is a Vector4 but really oriented to rotations instead of 4D space.
 * Honestly, I'm very new to linear algebra and geometry, this is all extremely new to me.
 */
class Quaternion {
  x: number
  y: number
  z: number
  w: number
  
  /**
   * Constructs a quaternion from XYZW (not WXYZ because I'm probably being weird.)
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @param {number} w
   */
  constructor (x: number, y: number, z: number, w: number) {
    this.x = x
    this.y = y
    this.z = z
    this.w = w
  }

  /**
   * The identity of a Quaternion is 0,0,0,1. This returns it.
   */
  static get identity (): Quaternion {
    return new Quaternion(0, 0, 0, 1)
  }

  /**
   * Shorthand getter for the normalized product of this Quaternion.
   */
  get normalized (): Quaternion {
    return Quaternion.normalize(this)
  }

  /**
   * Magnitude is sqrt(Quaternion^2). Used for normalization.
   */
  get magnitude (): number {
    const {x, y, z, w} = this
    return Math.sqrt(x * x + y * y + z * z + w * w)
  }

  /**
   * Normalization changes a quaternion to scale to between 0-1.
   * The square root of the sum of this Quaternion squared is the length scale
   * Dividing each element by the length scaler will turn this vector normalized.
   * @param {Quaternion} quat Quaternion to normalize.
   */
  static normalize (quat: Quaternion): Quaternion {
    const sqrtQuat = quat.magnitude

    return new Quaternion(
      quat.x / sqrtQuat,
      quat.y / sqrtQuat,
      quat.z / sqrtQuat,
      quat.w / sqrtQuat
    )
  }

  /**
   * lookAt is pretty deceptively simple.
   *
   * The forward/normal direction is src - dest
   * The axis of rotation is the cross product of literal forward and the normal
   * The angle of rotation is dot product of the same, plus 1.
   *
   * @param {Vector3} src the source position (the relative identity point)
   * @param {Vector3} dest the destination position
   */
  static lookAt (src: Vector3, dest: Vector3): Quaternion {
    const fwd = Vector3.normalize(src.sub(dest))
    const rotAxis = Vector3.cross(Vector3.forward, fwd).ovr2jpl
    const dot = Vector3.dot(Vector3.forward, fwd)

    return new Quaternion(
      rotAxis.x,
      rotAxis.y,
      rotAxis.z,
      dot + 1
    ).normalized
  }

  /**
   * Generate a quaternion from a rotation matrix.
   * Black magic to me, honestly.
   * @param {Array} mat 3x3 rotation matrix in the form of arrays
   */
  static fromRotationMatrix (mat: Matrix): Quaternion {
    const [[m00, m10, m20], [m01, m11, m21], [m02, m12, m22]] = mat

    const w = Math.sqrt(1 + m00 + m11 + m22) / 2
    const w4 = w * 4

    return new Quaternion(
      (m21 - m12) / w4,
      (m02 - m20) / w4,
      (m10 - m01) / w4,
      w
    )
  }

  /**
   * This is a way to calculate a quaternion from Euler angles, I'm really unsure what's really going on here.
   * Anyone willing to explain it, I'm willing to listen.
   *
   * Some notes on the directions this version uses,
   * - This is Tait-Bryan, or JPL right-hand.
   * - +x is forward (away from front of the camera), as well as roll
   * - +y is right, as well as pitch.
   * - +z is up, as well as yaw.
   * - **OpenVR does not use this handedness!**
   * The axis value is the one it's locked on.
   *
   * @param {Vector3} vec A Vector3 in degrees in JPL right-handed mode.
   */
  static fromEulerTait (vec: Vector3): Quaternion {
    vec = vec.radians
    const halfVec = vec.mul(0.5)

    const c = halfVec.cos
    const s = halfVec.sin

    const q = new Quaternion(
      // c s c - s c s
      c.z * s.x * c.y - s.z * c.x * s.y, // X
      // c c s + s s c
      c.z * c.x * s.y + s.z * s.x * c.y, // Y
      // s c c - c s s
      s.z * c.x * c.y - c.z * s.x * s.y, // Z
      // c c c + s s s
      c.z * c.x * c.y + s.z * s.x * s.y // W
    )

    return q
  }

  /**
   * This is a short conversion from OpenVR to JPL handedness.
   * TODO: Do the math properly instead of passing it into JPL mode.
   *
   * Some notes on this implementation:
   * - This is OpenVR right-hand orientation.
   * - +x is right, as well as pitch down
   * - +y is up, as wall as yaw right
   * - -z is forward (away from the front of the camera,) as well as roll right.
   * The axis value is the one it's locked on for the rotation.
   *
   * @param {Vector3} vec A Vector3 in degrees in OpenVR right-handed mode
   */
  static fromEuler (vec: Vector3): Quaternion {
    return Quaternion.fromEulerTait(vec.ovr2jpl)
  }

  /**
   * Only threequals will pass, as opposed to within an epsilon for eq.
   * @param {Quaternion} q Quaternion to match against
   */
  eqeqeq (q: Quaternion): boolean {
    return q.x === this.x && q.y === this.y && q.z === this.z && q.w === this.w
  }

  /**
   * Check for close-enough equality within ideally 0.005.
   * @param {Quaternion} q Quaternion to match against
   * @param {number|null} epsilon Rounding error correction. Defautls to 0.005
   */
  eq (q: Quaternion, epsilon?: number = EPSILON): boolean {
    return (Math.abs(q.x - this.x) < epsilon) &&
      (Math.abs(q.y - this.y) < epsilon) &&
      (Math.abs(q.z - this.z) < epsilon) &&
      (Math.abs(q.w - this.w) < epsilon)
  }

  /**
   * Simple vector multiplication.
   *
   * - If x is a Quaternion or XYZW object, return this*x
   * - If x is a scalar, return with a new Quaternion with each of this's XYZW multiplied by it.
   * @param {Object|Quaternion|number} x An XYZW object, a Quaternion, or scalar value
   * @param {number|null} y
   * @param {number|null} z
   * @param {number|null} w
   */
  mul (x: Quaternion|vec4|number, y?: number, z?: number, w?: number) {
    if (typeof x === 'number' && typeof y !== 'number' && typeof z !== 'number' && typeof w !== 'number') {
      // vector x linear math, ezgg
      // console.debug('Q.mul(x)')
      return new Quaternion(this.x * x, this.y * x, this.z * x, this.w * x)
    } else if (typeof x !== 'number' && isVec(4, x)) {
      // vector math!
      // console.debug('Q.mul(vec4)')
      const v: vec4 = x
      return new Quaternion(this.x * v.x, this.y * v.y, this.z * v.z, this.w * v.w)
    } else if (typeof x === 'number' && typeof y === 'number' && typeof z === 'number' && typeof w === 'number') {
      // console.debug('Q.mul(x,y,z,w)')
      return new Quaternion(this.x * x, this.y * y, this.z * z, this.w * w)
    }

    // console.debug('Q.mul(INVALID)')
    throw new TypeError("Input arguments were invalid.")
  }

  /**
   * Converts a Quaternion back into a degrees Euler angle.
   * The math included is JPL-handed, but we convert it to OpenVR at the end.
   * I'm not fully sure what this is.
   */
  get eulerAngle (): Vector3 {
    const { w, x, y, z } = this

    // X
    const t0: number = 2 * (w * x + y * z)
    const t1: number = 1 - 2 * (x * x + y * y)
    const vx: number = Math.atan2(t0, t1)

    // Y
    const t2: number = clamp(2 * (w * y - z * x), -1, 1)
    const vy: number = Math.asin(t2)

    // Z
    const t3: number = 2 * (w * z + x * y)
    const t4: number = 1 - 2 * (y * y + z * z)
    const vz: number = Math.atan2(t3, t4)

    return new Vector3(vx, vy, vz).jpl2ovr.degrees
  }

  /**
   * Creates a rotation 3x4 matrix with 4th column zero'd (so effectively 3x3)
   */
  get rotationMatrix (): Matrix3x4 {
    const { x, y, z, w } = this

    const xx: number = x * x
    const xy: number = x * y
    const xz: number = x * z
    const xw: number = x * w

    const yy: number = y * y
    const yz: number = y * z
    const yw: number = y * w

    const zz: number = z * z
    const zw: number = z * w

    const mat: Matrix = [
      [
        1 - 2 * (yy + zz), // 0
        2 * (xy + zw), // 4
        2 * (xz - yw), // 8
        0
      ],
      [
        2 * (xy - zw), // 1
        1 - 2 * (xx + zz), // 5
        2 * (yz + xw), // 9
        0
      ],
      [
        2 * (xz + yw), // 2
        2 * (yz - xw), // 6
        1 - 2 * (xx + yy), // 10
        0
      ]
    ]

    return new Matrix3x4([
      [
        1 - 2 * (yy + zz), // 0
        2 * (xy + zw), // 4
        2 * (xz - yw), // 8
        0
      ],
      [
        2 * (xy - zw), // 1
        1 - 2 * (xx + zz), // 5
        2 * (yz + xw), // 9
        0
      ],
      [
        2 * (xz + yw), // 2
        2 * (yz - xw), // 6
        1 - 2 * (xx + yy), // 10
        0
      ]
    ])
  }
}

/**
 * Matrix3x4 is a JS analogue of HmdMatrix34_t
 */
class Matrix3x4 {
  
  data: Matrix

  constructor (from: Matrix) {
    // console.log({from})
    if (from.length !== 3 || from[0].length !== 4 || from[1].length !== 4 || from[2].length !== 4) {
      throw new TypeError('Matrix3x4 requires 3 sets of 4 linear numbers')
    }

    this.data = from
  }

  /**
   * The identity matrix
   */
  static get identity (): Matrix3x4 {
    return Matrix3x4.fromTransform({ T: Vector3.zero, R: Quaternion.identity, S: Vector3.one })
  }

  /**
   * Quick method for wrapping matrix data in this class.
   * @param {Array} from HmdMatrix34_t arrays or some other generated arrays.
   */
  static fromArrays (from: Matrix): Matrix3x4 {
    return new Matrix3x4(from)
  }

  /**
   * Creates a Matrix3x4 via TRS data. This is usually what humans would create these with.
   */
  static fromTransform ({ T, R, S, translation, rotation, scale }: TRSHuman): Matrix3x4 {
    T = T || translation || Vector3.zero
    R = R || rotation || Quaternion.identity
    S = S || scale || Vector3.one

    const tMat: Matrix3x4 = new Matrix3x4([
      [0, 0, 0, T.x],
      [0, 0, 0, T.y],
      [0, 0, 0, T.z]
    ])

    let rot: Quaternion
    if (R instanceof Vector3) {
      rot = Quaternion.fromEuler(R)
    } else if (!(R instanceof Quaternion)) {
      throw new TypeError('Matrix3x4.rotate needs a Vector3 or Quaternion for R/rotation')
    } else {
      rot = R
    }

    const rMat: Matrix3x4 = rot.rotationMatrix

    const sMat: Matrix3x4 = new Matrix3x4([
      [S.x, 0, 0, 0],
      [0, S.y, 0, 0],
      [0, 0, S.z, 0]
    ])

    return tMat.add(rMat.mul(sMat))
  }

  /**
   * Rotation is input rotation matrix * this matrix.
   * @param {Quaternion|Vector3} R Rotation vector or quaternion. Vector3s will be converted to Quaternions
   */
  rotate (R: Quaternion|Vector3) {
    let rot: Quaternion
    
    if (R instanceof Vector3) {
      rot = Quaternion.fromEuler(R)
    } else if (!(R instanceof Quaternion)) {
      throw new TypeError('Matrix3x4.rotate needs a Vector3 or Quaternion for R/rotation')
    } else {
      rot = R
    }

    const rm = rot.rotationMatrix
    return rm.mul(this)
  }

  /**
   * Multiplies this matrix by another.
   * @param {Matrix3x4} b Target
   */
  mul (b: Matrix3x4|Matrix): Matrix3x4 {
    if (b instanceof Matrix3x4) {
      b = b.data
    }
    return Matrix3x4._mul(this.data, b)
  }

  /**
   * Adds this matrix to another
   * @param {Matrix3x4} b Target
   */
  add (b: Matrix3x4|Matrix): Matrix3x4 {
    if (b instanceof Matrix3x4) {
      b = b.data
    }
    return Matrix3x4._add(this.data, b)
  }

  /**
   * Subtracts this matrix from another
   * @param {Matrix3x4} b Target
   */
  sub (b: Matrix3x4|Matrix): Matrix3x4 {
    if (b instanceof Matrix3x4) {
      b = b.data
    }
    return Matrix3x4._sub(this.data, b)
  }

  /**
   * @private
   * Multiplies a * b
   * @param {Array} a src
   * @param {Array} b dest
   */
  static _mul (a: Matrix, b: Matrix): Matrix3x4 {
    // console.log({a, b})

    const out: Matrix = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]
    
    // pad b's 3x4 to a 4x4, this is just the identity
    b[3] = [0,0,0,1]

    for (var r = 0; r < a.length; ++r) {
      for (var c = 0; c < b[0].length; ++c) {
        for (var i = 0; i < a[0].length; ++i) {
          // b[i] = b[i] || [0, 0, 0, 1]
          // console.log({ r, c, i, o: out[r], a: a[r], b: b[i] })
          // console.log({r,c,i, ar: a[r], bi: b[i], or: out[r], orc: out[r][c]}, `out[${r}][${c}] += a[${r}][${i}] (= ${a[r][i]}) * b[${i}][${c}] (= ${b[i][c]})`)
          out[r][c] += a[r][i] * b[i][c]
        }
      }
    }

    return new Matrix3x4(out)
  }

  /**
   * @private
   * Adds a * b
   * @param {Array} a src
   * @param {Array} b dest
   */
  static _add (a: Matrix, b: Matrix): Matrix3x4 {
    const out: Matrix = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]

    for (var r = 0; r < a.length; ++r) {
      for (var c = 0; c < b[0].length; ++c) {
        out[r][c] = a[r][c] + b[r][c]
      }
    }

    return Matrix3x4.fromArrays(out)
  }

  /**
   * @private
   * Subtracts a * b
   * @param {Array} a src
   * @param {Array} b dest
   */
  static _sub (a: Matrix, b: Matrix): Matrix3x4 {
    const out: Matrix = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]

    for (var r = 0; r < a.length; ++r) {
      for (var c = 0; c < b[0].length; ++c) {
        out[r][c] = a[r][c] - b[r][c]
      }
    }

    return Matrix3x4.fromArrays(out)
  }

  /**
   * Shorthand getter for this.data for HmdMatrix34_t
   */
  toHmdMatrix34 (): Matrix {
    return this.data
  }

  /**
   * Shorthand getter for this.data for HmdMatrix34_t
   */
  get HmdMatrix34 (): Matrix {
    return this.data
  }

  get flat (): number[] {
    return this.data.reduce((acc, val) => acc.concat(val), [])
  }

  eq (b: Matrix3x4): boolean {
    return Matrix3x4._eq(this, b)
  }

  static _eq (ma: Matrix3x4, mb: Matrix3x4): boolean {
    const a: number[] = ma.flat
    const b: number[] = mb.flat

    for (let idx in a) {
      if (Math.abs(a[idx] - b[idx]) > EPSILON) return false
    }

    return true
  }

  eqeqeq (b: Matrix3x4): boolean {
    return Matrix3x4._eqeqeq(this, b)
  }

  static _eqeqeq (ma: Matrix3x4, mb: Matrix3x4): boolean {
    const a: number[] = ma.flat
    const b: number[] = mb.flat

    for (let idx in a) {
      if (a[idx] !== b[idx]) return false
    }

    return true
  }

  /**
   * Decompose the matrix into TRS parts.
   */
  get trs (): TRS {
    // copy it so we don't destroy the data
    const [[a, b, c, d], [e, f, g, h], [i, j, k, l]]: number[][] = [...this.data]

    const T: Vector3 = new Vector3(d, h, l)

    const S: Vector3 = new Vector3(
      new Vector3(a, e, i).magnitude,
      new Vector3(b, f, j).magnitude,
      new Vector3(c, g, k).magnitude
    )

    const R: Quaternion = Quaternion.fromRotationMatrix([
      [a / S.x, b / S.y, c / S.z],
      [e / S.x, f / S.y, g / S.z],
      [i / S.x, j / S.y, k / S.z]
    ])

    return { T, R, S }
  }
}

class Vector3 {
  x: number
  y: number
  z: number
  isRadians: boolean|null
  
  constructor (x: number, y: number, z: number) {
    this.x = x
    this.y = y
    this.z = z
    this.isRadians = null
  }

  static x (x: number): Vector3 {
    return new Vector3(x, x, x)
  }

  static get zero (): Vector3 {
    return new Vector3(0, 0, 0)
  }

  static get one (): Vector3 {
    return new Vector3(1, 1, 1)
  }

  static get up (): Vector3 {
    return new Vector3(0, 1, 0)
  }

  static get down (): Vector3 {
    return new Vector3(0, -1, 0)
  }

  static get forward (): Vector3 {
    return new Vector3(0, 0, -1)
  }

  static get back (): Vector3 {
    return new Vector3(0, 0, 1)
  }

  static get right (): Vector3 {
    return new Vector3(1, 0, 0)
  }

  static get left (): Vector3 {
    return new Vector3(-1, 0, 0)
  }

  static cross (a: Vector3, b: Vector3): Vector3 {
    return new Vector3(
      (a.y * b.z) - (a.z * b.y),
      (a.z * b.x) - (a.x * b.z),
      (a.x * b.y) - (a.y * b.x)
    )
  }

  static dot (a: Vector3, b: Vector3): number {
    return (a.x * b.x) + (a.y * b.y) + (a.z * b.z)
  }

  /**
   * Extract translation values from a transformation matrix.
   * XYZ is the [3]rd slots of each row.
   * @param {Matrix3x4|Array} mat HmdMatrix to get position from
   */
  static positionFromMatrix3x4 (mat: Matrix|Matrix3x4): Vector3 {
    let matrix: Matrix
    if (mat instanceof Matrix3x4) {
      matrix = mat.data
    } else {
      matrix = mat
    }


    return new Vector3(matrix[0][3], matrix[1][3], matrix[2][3])
  }

  /**
   * Shorthand getter for normalizing this vector.
   */
  get normalized (): Vector3 {
    return Vector3.normalize(this)
  }

  /**
   * Shorthand getter for calculating length/magnitude. Used in normalization.
   */
  get magnitude (): number {
    const sqVec = this.mul(this)
    return Math.sqrt(sqVec.x + sqVec.y + sqVec.z)
  }

  /**
   * 
   * @param {Vector3} vec 
   */
  static normalize (vec: Vector3): Vector3 {
    const sqrtVec = vec.magnitude

    return new Vector3(
      vec.x / sqrtVec,
      vec.y / sqrtVec,
      vec.z / sqrtVec
    )
  }

  get sin (): Vector3 {
    return new Vector3(
      Math.sin(this.x),
      Math.sin(this.y),
      Math.sin(this.z)
    )
  }

  get cos (): Vector3 {
    return new Vector3(
      Math.cos(this.x),
      Math.cos(this.y),
      Math.cos(this.z)
    )
  }

  /**
   * Only threequals will pass, as opposed to within an epsilon for eq.
   * @param {Vector3} vec Vector3 to match against
   */
  eqeqeq (vec: Vector3): boolean {
    return vec.x === this.x && vec.y === this.y && vec.z === this.z
  }

  /**
   * Check for close-enough equality within ideally 0.005.
   * @param {Vector3} vec Vector3 to match against
   * @param {number|null} epsilon Rounding error correction. Defautls to 0.005
   */
  eq (vec: Vector3, epsilon?: number = EPSILON): boolean {
    return (Math.abs(vec.x - this.x) < epsilon) &&
      (Math.abs(vec.y - this.y) < epsilon) &&
      (Math.abs(vec.z - this.z) < epsilon)
  }

  mul (x: number|Vector3|vec3, y?: number, z?: number): Vector3 {
    if (typeof x === 'number' && typeof y !== 'number' && typeof z !== 'number') {
      // vector x linear math, ezgg
      return new Vector3(this.x * x, this.y * x, this.z * x)
    } else if (typeof x !== 'number' && isVec(3, x)) {
      // vector math!
      const v: vec3 = x
      return new Vector3(this.x * v.x, this.y * v.y, this.z * v.z)
    } else if (typeof x === 'number' && typeof y === 'number' && typeof z === 'number') {
      return new Vector3(this.x * x, this.y * y, this.z * z)
    } 
      
    throw TypeError("Input arguments were invalid.")
  }

  add (x: number|Vector3|vec3, y?: number, z?: number): Vector3 {
    if (typeof x === 'number' && typeof y !== 'number' && typeof z !== 'number') {
      // vector x linear math, ezgg
      return new Vector3(this.x + x, this.y + x, this.z + x)
    } else if (typeof x !== 'number' && isVec(3, x)) {
      // vector math!
      const v: vec3 = x
      return new Vector3(this.x + v.x, this.y + v.y, this.z + v.z)
    } else if (typeof x === 'number' && typeof y === 'number' && typeof z === 'number') {
      return new Vector3(this.x + x, this.y + y, this.z + z)
    }
      
    throw TypeError("Input arguments were invalid.")
  }

  sub (x: number|Vector3|vec3, y?: number, z?: number): Vector3 {
    if (typeof x === 'number' && typeof y !== 'number' && typeof z !== 'number') {
      // vector x linear math, ezgg
      return new Vector3(this.x - x, this.y - x, this.z - x)
    } else if (typeof x !== 'number' && isVec(3, x)) {
      // vector math!
      const v: vec3 = x
      return new Vector3(this.x - v.x, this.y - v.y, this.z - v.z)
    } else if (typeof x === 'number' && typeof y === 'number' && typeof z === 'number') {
      return new Vector3(this.x - x, this.y - y, this.z - z)
    } 
      
    throw TypeError("Input arguments were invalid.")

  }

  lookAt (vec: Vector3): Quaternion {
    return Quaternion.lookAt(this, vec)
  }

  get radians (): Vector3 {
    if (this.isRadians === true) {
      return this
    }

    const v: Vector3 = new Vector3(
      deg2rad(this.x),
      deg2rad(this.y),
      deg2rad(this.z)
    )

    v.isRadians = true
    return v
  }

  get degrees (): Vector3 {
    if (this.isRadians === false) {
      return this
    }

    const v: Vector3 = new Vector3(
      rad2deg(this.x),
      rad2deg(this.y),
      rad2deg(this.z)
    )

    v.isRadians = false
    return v
  }

  get jpl2ovr (): Vector3 {
    return new Vector3(this.y, -this.z, -this.x)
  }

  get ovr2jpl (): Vector3 {
    return new Vector3(-this.z, this.x, -this.y)
  }

  get round (): Vector3 {
    return new Vector3(Math.round(this.x), Math.round(this.y), Math.round(this.z))
  }

  get ceil (): Vector3 {
    return new Vector3(Math.ceil(this.x), Math.ceil(this.y), Math.ceil(this.z))
  }

  get floor (): Vector3 {
    return new Vector3(Math.floor(this.x), Math.floor(this.y), Math.floor(this.z))
  }
}

module.exports = {
  Vector3,
  Quaternion,
  Matrix3x4,
  isVec
}
