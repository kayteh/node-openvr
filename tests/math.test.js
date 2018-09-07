/* global test, expect, describe */
const { Quaternion, Vector3, Matrix3x4, isVec } = require('../src/math')

test('isVec works', () => {
  expect(isVec(3, { x: 0, y: 0, z: 0 })).toBeTruthy()
  expect(isVec(4, { x: 0, y: 0, z: 0, w: 0 })).toBeTruthy()
  expect(isVec(4, { a: 0, b: 0, c: 0, d: 0 })).toBeFalsy()
})

describe('Quaternion', () => {
  test('quaternion from euler angles spits out the same euler angle', () => {
    const inputVec = new Vector3(15, 30, 45)
    const quat = Quaternion.fromEuler(inputVec)
    const outputVec = quat.eulerAngle
    expect(inputVec.eq(outputVec)).toBeTruthy()
  })

  test('returns and generates the same rotation matrix conversions', () => {
    const inputVec = new Vector3(15, 30, 45)
    const quat = Quaternion.fromEuler(inputVec)

    const postConv = Quaternion.fromRotationMatrix(quat.rotationMatrix.data).eulerAngle
    expect(inputVec.eq(postConv)).toBeTruthy()
  })

  test('lookAt produces the right rotation', () => {//
    const check = new Vector3(-90, 0, 0)
    const src = Vector3.zero
    const dest = Vector3.up

    const q = Quaternion.lookAt(src, dest)
    const rot3 = q.eulerAngle

    expect(check.eq(rot3)).toBeTruthy()
  })

  test('identity is the identity and eqeqeq works', () => {
    const ident = Quaternion.identity
    const manualIdent = new Quaternion(0, 0, 0, 1)
    expect(ident.eqeqeq(manualIdent)).toBeTruthy()
  })

  test('identity is eq to a slightly not identity', () => {
    const ident = Quaternion.identity
    expect(ident.eq(new Quaternion(0.000000001, -0.00000045, 0, 1.000000001))).toBeTruthy()
  })

  test('multiply', () => {
    const q1 = new Quaternion(1,1,1,4)
    const q2 = new Quaternion(2,2,2,8)
    const q3 = new Quaternion(2,2,2,32)
    const q4 = new Quaternion(1,4,1,16)
    expect(q1.mul(2).eq(q2)).toBeTruthy()
    expect(q2.mul(0.5, 2, 0.5, 2).eq(q4)).toBeTruthy()
    expect(q1.mul(q2).eq(q3)).toBeTruthy()
    expect(() => {
      q1.mul('hello')
    }).toThrowError()
  })
})

describe('Matrix3x4', () => {
  test('implicit identity is created by fromTransform', () => {
    expect(Matrix3x4.identity.eqeqeq(Matrix3x4.fromTransform({}))).toBeTruthy()
    expect(Matrix3x4.identity.eq(Matrix3x4.fromTransform({}))).toBeTruthy()
  })

  test('eq and eqeqeq does not weird', () => {
    const m1 = Matrix3x4.identity
    const m2 = Matrix3x4.fromTransform({T: Vector3.one.add(Vector3.up), R: Vector3.forward})
    console.log({m1: m1.flat, m2: m2.flat})
    expect(m2.eqeqeq(m1)).toBeFalsy()
    expect(m2.eq(m1)).toBeFalsy()
  })

  test('array constructor errors if arrays are bad', () => {
    expect(() => { Matrix3x4.fromArrays([[1], [2, 3]]) }).toThrowError()
  })

  test('identity matrix is indeed the identity matrix', () => {
    const i = Matrix3x4.identity
    const { T, R, S } = i.trs
    expect(T.eq(Vector3.zero)).toBeTruthy()
    expect(R.eq(Quaternion.identity)).toBeTruthy()
    expect(S.eq(Vector3.one)).toBeTruthy()
  })

  test('fromTransform errors if rotation is not viable', () => {
    expect(() => { Matrix3x4.fromTransform({ R: {x: 1} }) }).toThrowError()
  })

  test('rotation actually rotates', () => {
    const zero = Matrix3x4.identity

    const v90 = Vector3.x(45) // this cannot be 90, euler gimbal lock occurs
    let { R } = zero.rotate(v90).trs
    const outR = R.eulerAngle
    expect(outR.eq(v90)).toBeTruthy()

    const trs2 = zero.rotate(Quaternion.fromEuler(v90)).trs.R
    const outR2 = trs2.eulerAngle
    expect(outR2.eq(v90)).toBeTruthy()
  })

  test('rotate errors if bad stuff', () => {
    expect(() => {
      Matrix3x4.identity.rotate(null)
    }).toThrowError()
  })

  test('add + sub + mul', () => {
    const inputTRS = {
      T: Vector3.one,
      R: new Vector3(15, 30, 45),
      S: Vector3.x(3)
    }

    const m = Matrix3x4.fromTransform(inputTRS)

    expect(m.add(m).sub(m).eqeqeq(m)).toBeTruthy()
    expect(m.add(m).sub(m).eqeqeq(m)).toBeTruthy()
    console.log({
      m: m.flat, ident: Matrix3x4.identity.flat, v: m.mul(Matrix3x4.identity).flat
    })
    expect(m.mul(Matrix3x4.identity).eq(m)).toBeTruthy()
  })

  test('TRS input outputs the same TRS', () => {
    const inputTRS = {
      T: Vector3.one,
      R: new Vector3(15, 30, 45),
      S: Vector3.x(3)
    }

    const mat = Matrix3x4.fromTransform(inputTRS)

    const outputTRS = mat.trs

    expect(outputTRS.T.eq(inputTRS.T)).toBeTruthy()

    const t = outputTRS.R.eulerAngle
    expect(t.eq(inputTRS.R)).toBeTruthy()

    expect(outputTRS.S.eq(inputTRS.S)).toBeTruthy()
  })
})

describe('Vector3', () => {
  test('position from matrix3x4', () => {
    const v = new Vector3(10,2,312)
    const m = Matrix3x4.fromTransform({ T: v })
    const T = Vector3.positionFromMatrix3x4(m)
    const T2 = Vector3.positionFromMatrix3x4(m.data)
    expect(v.eqeqeq(T)).toBeTruthy()
    expect(v.eqeqeq(T2)).toBeTruthy()
  })

  test('vector normalization', () => {
    const target = new Vector3(0, 0.5, 1)
    const t = new Vector3(0, 50, 100)
    expect(t.normalized.eqeqeq(target))
  })

  test('multiply', () => {
    const q1 = new Vector3(1,1,4)
    const q2 = new Vector3(2,2,8)
    const q3 = new Vector3(2,2,32)
    const q4 = new Vector3(1,4,16)
    expect(q1.mul(2).eq(q2)).toBeTruthy()
    expect(q2.mul(0.5, 2, 2).eq(q4)).toBeTruthy()
    expect(q1.mul(q2).eq(q3)).toBeTruthy()
    expect(() => {
      q1.mul('hello', 'world', 'hajimemashite')
    }).toThrowError()
  })

  test('add', () => {
    const q1 = new Vector3(1,1,4)
    const q2 = new Vector3(3,3,6)
    const q3 = new Vector3(4,4,10)
    const q4 = new Vector3(3.5,5,8)
    expect(q1.add(2).eq(q2)).toBeTruthy()
    expect(q2.add(0.5, 2, 2).eq(q4)).toBeTruthy()
    expect(q1.add(q2).eq(q3)).toBeTruthy()
    expect(() => {
      q1.add('hello', 'world', 'hajimemashite')
    }).toThrowError()
  })

  test('sub', () => {
    const q1 = new Vector3(1,1,4)
    const q2 = new Vector3(-1,-1,2)
    const q3 = new Vector3(2,2,2)
    const q4 = new Vector3(-1.5,-3,0)
    expect(q1.sub(2).eq(q2)).toBeTruthy()
    expect(q2.sub(0.5, 2, 2).eq(q4)).toBeTruthy()
    expect(q1.sub(q2).eq(q3)).toBeTruthy()
    expect(() => {
      q1.sub('hello', 'world', 'hajimemashite')
    }).toThrowError()
  })

  test('lookAt produces the right rotation', () => {
    const check = new Vector3(-90, 0, 0)
    const src = Vector3.zero
    const dest = Vector3.up

    const q = src.lookAt(dest)
    const rot3 = q.eulerAngle

    expect(check.eq(rot3)).toBeTruthy()
  })

  test('deg2rad + rad2deg safety', () => {
    const d = new Vector3(1,3,4)
    expect(d.degrees.eqeqeq(d.degrees.degrees)).toBeTruthy()
    expect(d.radians.eqeqeq(d.radians.radians)).toBeTruthy()
    expect(d.degrees.radians.eqeqeq(d.degrees.degrees.radians)).toBeTruthy()
    expect(d.radians.degrees.eqeqeq(d.radians.radians.degrees)).toBeTruthy()
    expect(d.radians.eqeqeq(d.degrees)).toBeFalsy()
  })
})
