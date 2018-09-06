/* global test, expect, describe */
const { Quaternion, Vector3, Matrix3x4 } = require('.')

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

  test('lookAt produces the right rotation', () => {
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
})

describe('Matrix3x4', () => {
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
    const { R } = zero.rotate(v90).trs
    const outR = R.eulerAngle
    console.log({v90, outR})
    expect(outR.eq(v90)).toBeTruthy()
  })

  test('rotate errors if bad stuff', () => {
    expect(() => {
      Matrix3x4.identity.rotate(null)
    }).toThrowError()
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
