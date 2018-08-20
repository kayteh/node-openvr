const ovr = require('..')

// ovr.fetchEnums(['ETrackedDeviceProperty'])

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
  }
}
