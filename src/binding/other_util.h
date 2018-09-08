#ifndef NODE_OTHER_UTIL_H
#define NODE_OTHER_UTIL_H

#include <nan.h>
#include <openvr.h>
#include <v8.h>

;

// Create a v8 Object
#define V8OBJ(name) v8::Local<v8::Object> name = v8::Object::New(v8::Isolate::GetCurrent());

// Extract a v8 String
#define V8STR(prop, name) char * name = *Nan::Utf8String(prop);

// Set a method on "target" object
#define SET_METHOD(name) target->Set(Nan::New(#name).ToLocalChecked(), Nan::New<v8::FunctionTemplate>(name)->GetFunction());

// Set a v8 value to obj
#define SET_RAW(obj, key, val) Nan::Set(obj, Nan::New(#key).ToLocalChecked(), val);

// Set a Nan::New-able value on obj with key and val
#define SET(obj, key, val) Nan::Set(obj, Nan::New(#key).ToLocalChecked(), Nan::New(val));

// Set a Nan::New-able value, but this one .ToLocalChecked()'s it
#define SET_LOCAL(obj, key, val) Nan::Set(obj, Nan::New(#key).ToLocalChecked(), Nan::New(val).ToLocalChecked());

// Sets key and value on "d" from VREvent_Data_t types.
#define SET_ET(key) Nan::Set(d, Nan::New(#key).ToLocalChecked(), encodeVREventDataTyped(data->key));

// Sets key and value on "d" from specific VREvent_Data-t structs.
#define SET_EV(key) SET(d, key, t.key);

// SET_EV but allows typecasting (mostly for ulongs to uints)
#define SET_EV_CAST(key, type) SET(d, key, (type)t.key);

// SET_EV but SET_LOCAL instead
#define SET_EVL(key) SET_LOCAL(d, key, t.key);


inline static vr::HmdMatrix34_t decodeVec3x4(const v8::Local<v8::Value> value) {
  vr::HmdMatrix34_t result;

  // We need to know if this is a node Matrix3x4 or not,
  // if it iis, convert it to the array form.
  auto matrixObj = value->ToObject();

  // get the prototype
  V8STR(matrixObj->GetConstructorName(), name);
  if (std::strcmp(name, "Matrix3x4") == 0) {
    // this is the matrix3x4 and not an array, so let's call it's array extraction
    matrixObj = Nan::Get(matrixObj, Nan::New("data").ToLocalChecked()).ToLocalChecked()->ToObject();
  }

  // apparently this being const is required.
  const auto matrix = matrixObj;

  for (uint32_t rowIdx = 0; rowIdx < 3; ++rowIdx)
  {
    const auto row = Nan::Get(matrix, rowIdx).ToLocalChecked()->ToObject();
    for (uint32_t colIdx = 0; colIdx < 4; ++colIdx)
    {
      const auto cell = Nan::Get(row, colIdx).ToLocalChecked();
      result.m[rowIdx][colIdx] = static_cast<float>(cell->NumberValue());
    }
  }

  return result;
}

static v8::Local<v8::Object> encodeVREventDataTyped(vr::VREvent_Reserved_t t) {
  V8OBJ(d);
  SET_EV_CAST(reserved0, uint32_t);
  SET_EV_CAST(reserved1, uint32_t);
  return d;
}

static v8::Local<v8::Object> encodeVREventDataTyped(vr::VREvent_Controller_t t) {
  V8OBJ(d);
  SET_EV(button);
  return d;
}

static v8::Local<v8::Object> encodeVREventDataTyped(vr::VREvent_Mouse_t t) {
  V8OBJ(d);
  SET_EV(button);
  SET_EV(x);
  SET_EV(y);
  return d;
}

static v8::Local<v8::Object> encodeVREventDataTyped(vr::VREvent_Scroll_t t) {
  V8OBJ(d);
  SET_EV(repeatCount);
  SET_EV(xdelta);
  SET_EV(ydelta);
  return d;
}

static v8::Local<v8::Object> encodeVREventDataTyped(vr::VREvent_TouchPadMove_t t) {
  V8OBJ(d);
  SET_EV(bFingerDown);
  SET_EV(flSecondsFingerDown);
  SET_EV(fValueXFirst);
  SET_EV(fValueYFirst);
  SET_EV(fValueXRaw);
  SET_EV(fValueYRaw);
  return d;
}

static v8::Local<v8::Object> encodeVREventDataTyped(vr::VREvent_Notification_t t) {
  V8OBJ(d);
  SET_EV_CAST(ulUserValue, uint32_t);
  return d;
}

static v8::Local<v8::Object> encodeVREventDataTyped(vr::VREvent_Process_t t) {
  V8OBJ(d);
  SET_EV(pid);
  SET_EV(oldPid);
  SET_EV(bForced);
  return d;
}

static v8::Local<v8::Object> encodeVREventDataTyped(vr::VREvent_Overlay_t t) {
  V8OBJ(d);
  SET_EV_CAST(overlayHandle, uint32_t);
  return d;
}

static v8::Local<v8::Object> encodeVREventDataTyped(vr::VREvent_Keyboard_t t) {
  V8OBJ(d);
  SET_EVL(cNewInput);
  SET_EV_CAST(uUserValue, uint32_t);
  return d;
}

static v8::Local<v8::Object> encodeVREventDataTyped(vr::VREvent_Ipd_t t) {
  V8OBJ(d);
  SET_EV(ipdMeters);
  return d;
}

static v8::Local<v8::Object> encodeVREventDataTyped(vr::VREvent_Chaperone_t t) {
  V8OBJ(d);
  SET_EV_CAST(m_nPreviousUniverse, uint32_t);
  SET_EV_CAST(m_nCurrentUniverse, uint32_t);
  return d;
}

static v8::Local<v8::Object> encodeVREventDataTyped(vr::VREvent_PerformanceTest_t t) {
  V8OBJ(d);
  SET_EV(m_nFidelityLevel);
  return d;
}

static v8::Local<v8::Object> encodeVREventDataTyped(vr::VREvent_SeatedZeroPoseReset_t t) {
  V8OBJ(d);
  SET_EV(bResetBySystemMenu);
  return d;
}

static v8::Local<v8::Object> encodeVREventDataTyped(vr::VREvent_Screenshot_t t) {
  V8OBJ(d);
  SET_EV(handle);
  SET_EV(type);
  return d;
}

static v8::Local<v8::Object> encodeVREventDataTyped(vr::VREvent_ScreenshotProgress_t t) {
  V8OBJ(d);
  SET_EV(progress);
  return d;
}

static v8::Local<v8::Object> encodeVREventDataTyped(vr::VREvent_ApplicationLaunch_t t) {
  V8OBJ(d);
  SET_EV(pid);
  SET_EV(unArgsHandle);
  return d;
}

static v8::Local<v8::Object> encodeVREventDataTyped(vr::VREvent_EditingCameraSurface_t t) {
  V8OBJ(d);
  SET_EV_CAST(overlayHandle, uint32_t);
  SET_EV(nVisualMode);
  return d;
}

static v8::Local<v8::Object> encodeVREventDataTyped(vr::VREvent_MessageOverlay_t t) {
  V8OBJ(d);
  SET_EV(unVRMessageOverlayResponse);
  return d;
}

static v8::Local<v8::Object> encodeVREventDataTyped(vr::VREvent_Property_t t) {
  V8OBJ(d);
  SET_EV_CAST(container, uint32_t);
  SET_EV(prop);
  return d;
}

static v8::Local<v8::Object> encodeVREventDataTyped(vr::VREvent_Status_t t) {
  V8OBJ(d);
  SET_EV(statusState);
  return d;
}


inline v8::Local<v8::Object> encodeVREventData(vr::VREvent_Data_t * data) {
  V8OBJ(d);
  SET_ET(reserved);
  SET_ET(controller);
  SET_ET(mouse);
  SET_ET(scroll);
  SET_ET(process);
  SET_ET(notification);
  SET_ET(overlay);
  SET_ET(status);
  SET_ET(keyboard);
  SET_ET(ipd);
  SET_ET(chaperone);
  SET_ET(performanceTest);
  SET_ET(touchPadMove);
  SET_ET(seatedZeroPoseReset);
  SET_ET(screenshot);
  SET_ET(screenshotProgress);
  SET_ET(applicationLaunch);
  SET_ET(cameraSurface);
  SET_ET(messageOverlay);
  SET_ET(property);
  return d;
}


inline v8::Local<v8::Object> encodeVREvent(vr::VREvent_t pEvent) {
  V8OBJ(event);
  SET(event, eventType, (uint32_t)pEvent.eventType);
  SET(event, eventAgeSeconds, (float)pEvent.eventAgeSeconds);
  SET_RAW(event, trackedDeviceIndex, Nan::New<v8::Number>(pEvent.trackedDeviceIndex));
  event->Set(Nan::New("data").ToLocalChecked(), encodeVREventData(&pEvent.data));
  return event;
}


#endif