#include "ivroverlay.h"
// #include "util.h"

#include <node.h>
#include <openvr.h>
#include "other_util.h"
#include "ivrsystem.h"

using namespace v8;

#define CHECK_ERROR(err) { if (err != vr::VROverlayError_None) { Nan::ThrowError(vr::VROverlay()->GetOverlayErrorNameFromEnum(err)); return; } }
#define HND_OVERLAY(prop) overlayHandleMap[prop->Uint32Value()]

bool IVROverlay::checkError(vr::VROverlayError err, const char *msg) {
    if (err != vr::VROverlayError_None) {
        Nan::ThrowError(vr::VROverlay()->GetOverlayErrorNameFromEnum(err));
        return false;
    }

    return true;
}

std::map<uint32_t, vr::VROverlayHandle_t> IVROverlay::overlayHandleMap;

NAN_MODULE_INIT(IVROverlay::Init) {
    

    SET_METHOD(CreateOverlay);
    SET_METHOD(ShowOverlay);
    SET_METHOD(Check);
    
    // target->Set("SetOverlayRaw", SetOverlayRaw);
    SET_METHOD(SetOverlayFromFile);
    
    SET_METHOD(SetOverlayTransformTrackedDeviceRelative);
    // target->Set("SetOverlayWidthInMeters", SetOverlayWidthInMeters);
}

// IVROverlay::IVROverlay(vr::IVROverlay *self) : self_(self) {}

NAN_METHOD(IVROverlay::New) {
    if (!info.IsConstructCall()) {
        Nan::ThrowError("Use the `new` keyword when creating a new instance.");
        return;
    }

    if (!vr::VROverlay()) {
        Nan::ThrowError("Overlay was unable to fetch the shared instance.");
    }
}

NAN_METHOD(IVROverlay::Check) {
    if (!vr::VROverlay()) {
        info.GetReturnValue().Set(false);
        Nan::ThrowError("Overlay was unable to fetch the shared instance.");
        return;
    }

    info.GetReturnValue().Set(true);
}

NAN_METHOD(IVROverlay::CreateOverlay) {
    if (info.Length() != 2) {
        Nan::ThrowError("Wrong number of arguments.");
        return;
    }

    vr::VROverlayHandle_t hOverlay = 0U;

    V8STR(info[0], key);
    V8STR(info[1], name);
    
    vr::VROverlayError err = vr::VROverlay()->CreateOverlay(key, name, &hOverlay);
    CHECK_ERROR(err);

    uint32_t oHndPtr = (uint32_t)hOverlay;
    overlayHandleMap.insert(std::pair<uint32_t, vr::VROverlayHandle_t>(oHndPtr, hOverlay));
    info.GetReturnValue().Set(oHndPtr);
}

NAN_METHOD(IVROverlay::ShowOverlay) {
    if (info.Length() != 1) {
        Nan::ThrowError("Wrong number of arguments.");
        return;
    }

    vr::VROverlayError err;    
    err = vr::VROverlay()->ShowOverlay(HND_OVERLAY(info[0]));
    
    CHECK_ERROR(err);
}

NAN_METHOD(IVROverlay::SetOverlayFromFile) {
    if (info.Length() != 2) {
        Nan::ThrowError("Wrong number of arguments.");
        return;
    }

    V8STR(info[1], path);

    vr::VROverlayError err;
    err = vr::VROverlay()->SetOverlayFromFile(HND_OVERLAY(info[0]), path);
    CHECK_ERROR(err);
}

// NAN_METHOD(IVROverlay::SetOverlayRawBuf) {
//     if (info.Length() != 5) {
//         Nan::ThrowError("Wrong number of arguments.");
//         return;
//     }

//     vr::VROverlayError err;
//     err = vr::VROverlay()->SetOverlayFromFile(HND_OVERLAY(info[0]), path);
//     // Nan::ThrowError(vr::VROverlay()->GetOverlayErrorNameFromEnum(err));
//     CHECK_ERROR(err);
// }


NAN_METHOD(IVROverlay::SetOverlayTransformTrackedDeviceRelative) {

    vr::TrackedDeviceIndex_t trackedDevice = info[1]->Uint32Value();
    vr::HmdMatrix34_t transform = decodeVec3x4(info[2]);

    vr::VROverlayError err;
    err = vr::VROverlay()->SetOverlayTransformTrackedDeviceRelative(HND_OVERLAY(info[0]), trackedDevice, &transform);
    checkError(err, "SetOverlayTransformTrackedDeviceRelative failed");
}