const ovr = require('..')

// ovr.fetchEnums(['ETrackedDeviceProperty'])

class VRVec3 {
  constructor (x, y, z) {
    this.x = x
    this.y = y
    this.z = z
  }

  get HmdMatrix34 () {
    this.HmdMatrix34(this.x, this.y, this.z)
  }

  static HmdMatrix34 (x, y, z) {
    return [
      [1, 0, 0, x],
      [0, 1, 0, y],
      [0, 0, 1, z]
    ]
  }
}

module.exports = {
  agent (VRSystem) {
    // HMD
    const tracking = VRSystem.GetStringTrackedDeviceProperty(0, ovr.ETrackedDeviceProperty.Prop_TrackingSystemName_String)
    const model = VRSystem.GetStringTrackedDeviceProperty(0, ovr.ETrackedDeviceProperty.Prop_ModelNumber_String)
    const serial = VRSystem.GetStringTrackedDeviceProperty(0, ovr.ETrackedDeviceProperty.Prop_SerialNumber_String)

    // console.log({tracking, model, serial})
    return {tracking, model, serial}
  },

  printAgent (VRSystem) {
    console.log(this.agent(VRSystem))
  },

  VRVec3,

  ...require('./projectionMatrix')
}
