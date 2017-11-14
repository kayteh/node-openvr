#include "ivrcompositor.h"

#include <array>
#include <node.h>
#include <openvr.h>

using namespace v8;

//=============================================================================
NAN_MODULE_INIT(IVRCompositor::Init)
{
  // Create a function template that is called in JS to create this wrapper.
  Local<FunctionTemplate> tpl = Nan::New<FunctionTemplate>(New);

  // Declare human-readable name for this wrapper.
  tpl->SetClassName(Nan::New("IVRCompositor").ToLocalChecked());

  // Declare the stored number of fields (just the wrapped C++ object).
  tpl->InstanceTemplate()->SetInternalFieldCount(1);

  // Assign all the wrapped methods of this object.
  Nan::SetPrototypeMethod(tpl, "WaitGetPoses", WaitGetPoses);
  Nan::SetPrototypeMethod(tpl, "Submit", Submit);

  // Set a static constructor function to reference the `New` function template.
  constructor().Reset(Nan::GetFunction(tpl).ToLocalChecked());
}

//=============================================================================
Local<Object> IVRCompositor::NewInstance(vr::IVRCompositor *compositor)
{
  Nan::EscapableHandleScope scope;
  Local<Function> cons = Nan::New(constructor());
  Local<Value> argv[1] = { Nan::New<External>(compositor) };
  return scope.Escape(Nan::NewInstance(cons, 1, argv).ToLocalChecked());
}

//=============================================================================
IVRCompositor::IVRCompositor(vr::IVRCompositor *self)
: self_(self)
{
  // Do nothing.
}

//=============================================================================
NAN_METHOD(IVRCompositor::New)
{
  if (!info.IsConstructCall())
  {
    Nan::ThrowError("Use the `new` keyword when creating a new instance.");
    return;
  }

  if (info.Length() != 1 || !info[0]->IsExternal())
  {
    Nan::ThrowTypeError("Argument[0] must be an `IVRCompositor*`.");
    return;
  }

  auto wrapped_instance = static_cast<vr::IVRCompositor*>(
    Local<External>::Cast(info[0])->Value());
  IVRCompositor *obj = new IVRCompositor(wrapped_instance);
  obj->Wrap(info.This());
  info.GetReturnValue().Set(info.This());
}

NAN_METHOD(IVRCompositor::WaitGetPoses)
{
  IVRCompositor* obj = ObjectWrap::Unwrap<IVRCompositor>(info.Holder());

  if (info.Length() != 1)
  {
    Nan::ThrowError("Wrong number of arguments.");
    return;
  }

  if (!info[0]->IsFloat32Array() || Local<Float32Array>::Cast(info[0])->Length() != 16)
  {
    Nan::ThrowTypeError("Argument[0] must be a Float32Array(16).");
    return;
  }

  vr::TrackedDevicePose_t trackedDevicePose[vr::k_unMaxTrackedDeviceCount];
	vr::VRCompositor()->WaitGetPoses(trackedDevicePose, vr::k_unMaxTrackedDeviceCount, nullptr, 0);

  bool bPoseIsValid = trackedDevicePose[0].bPoseIsValid;
  if (bPoseIsValid) {
    vr::HmdMatrix34_t mDeviceToAbsoluteTracking = trackedDevicePose[0].mDeviceToAbsoluteTracking;

    Local<Float32Array> float32Array = Local<Float32Array>::Cast(info[0]);
    for (unsigned int v = 0; v < 4; v++) {
      for (unsigned int u = 0; u < 3; u++) {
        float32Array->Set(v * 4 + u, Number::New(Isolate::GetCurrent(), mDeviceToAbsoluteTracking.m[u][v]));
      }
    }
    float32Array->Set(0 * 4 + 4, Number::New(Isolate::GetCurrent(), 0));
    float32Array->Set(1 * 4 + 4, Number::New(Isolate::GetCurrent(), 0));
    float32Array->Set(2 * 4 + 4, Number::New(Isolate::GetCurrent(), 0));
    float32Array->Set(3 * 4 + 4, Number::New(Isolate::GetCurrent(), 1));
  }

  info.GetReturnValue().Set(Boolean::New(Isolate::GetCurrent(), bPoseIsValid));
}

NAN_METHOD(IVRCompositor::Submit)
{
  IVRCompositor* obj = ObjectWrap::Unwrap<IVRCompositor>(info.Holder());

  if (info.Length() != 1)
  {
    Nan::ThrowError("Wrong number of arguments.");
    return;
  }

  if (!info[0]->IsNumber())
  {
    Nan::ThrowError("Expected arguments (number).");
    return;
  }

  vr::EColorSpace colorSpace = vr::ColorSpace_Gamma;

  vr::Texture_t leftEyeTexture = {(void*)info[0]->Int32Value(), vr::TextureType_OpenGL, colorSpace};
  vr::VRTextureBounds_t leftEyeTextureBounds = {
    0, 0.5,
    0, 1,
  };
  vr::VRCompositor()->Submit(vr::Eye_Left, &leftEyeTexture, &leftEyeTextureBounds);

  vr::Texture_t rightEyeTexture = {(void*)info[0]->Int32Value(), vr::TextureType_OpenGL, colorSpace};
  vr::VRTextureBounds_t rightEyeTextureBounds = {
    0.5, 1,
    0, 1,
  };
  vr::VRCompositor()->Submit(vr::Eye_Right, &rightEyeTexture, &rightEyeTextureBounds);

  vr::VRCompositor()->PostPresentHandoff();
}
