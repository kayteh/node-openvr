#include "ivroverlay.h"
// #include "util.h"

#include <node.h>
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

#ifdef OVERLAY_D3D
ID3D11Device* IVROverlay::mDevice;
#else
GLFWwindow* IVROverlay::glWindow = NULL;
#endif

NAN_MODULE_INIT(IVROverlay::Init) {
    SET_METHOD(CreateOverlay);
    SET_METHOD(ShowOverlay);
    SET_METHOD(Check);
    
    // target->Set("SetOverlayRaw", SetOverlayRaw);
    SET_METHOD(SetOverlayFromFile);
    // SET_METHOD(SetOverlayRaw);
    SET_METHOD(SetOverlayTextureFromBuffer);
    
    SET_METHOD(SetOverlayTransformTrackedDeviceRelative);
    // target->Set("SetOverlayWidthInMeters", SetOverlayWidthInMeters);

    SET_METHOD(Internals);
}

NAN_METHOD(IVROverlay::Internals) {
    info.GetReturnValue().Set(
        #ifdef OVERLAY_D3D
        0
        #else
        1
        #endif
    );
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

    #ifdef OVERLAY_D3D
    if (mDevice == NULL) {
        HRESULT ret = D3D11CreateDevice(NULL, D3D_DRIVER_TYPE_HARDWARE, NULL, 0, NULL, 0, D3D11_SDK_VERSION, &mDevice, NULL, NULL);
    }
    #else
    if (glWindow == NULL) {
        glfwInit();
        glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 4);
        glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 2);
        glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);
        glfwWindowHint(GLFW_OPENGL_FORWARD_COMPAT, GL_TRUE);
        glfwWindowHint(GLFW_VISIBLE, GL_FALSE);
        GLFWwindow* glWindow = glfwCreateWindow(2048, 2048, "node-openvr", nullptr, nullptr);
        glfwMakeContextCurrent(glWindow);
    }
    #endif

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

NAN_METHOD(IVROverlay::SetOverlayTextureFromBuffer) {
    if (info.Length() < 4) {
        Nan::ThrowError("Wrong number of arguments.");
        return;
    }

    if (!info[1]->IsArrayBufferView()) {
        Nan::ThrowTypeError("Argument 2 must be an ArrayBufferView, such as a Uint8ClampedArray");
        return;
    }

    Local<ArrayBufferView> input = info[1].As<ArrayBufferView>();

    uint32_t width = info[2]->Uint32Value();
    uint32_t height = info[3]->Uint32Value();
    uint32_t depth = info[4]->Uint32Value();

#ifdef OVERLAY_D3D
    Nan::TypedArrayContents<uint8_t> buf(input);
    const D3D11_SUBRESOURCE_DATA initData = { *buf, sizeof(uint8_t), 0 };
    D3D11_TEXTURE2D_DESC desc = {};
    desc.Width = width;
    desc.Height = height;
    desc.MipLevels = 1;
    desc.ArraySize = 1;
    desc.Format = DXGI_FORMAT_R32G32B32_FLOAT;
    desc.SampleDesc.Count = 1;
    desc.Usage = D3D11_USAGE_IMMUTABLE;
    desc.BindFlags = D3D11_BIND_SHADER_RESOURCE;

    ID3D11Texture2D *texD3D11;
    HRESULT res = mDevice->CreateTexture2D(
        &desc,
        &initData,
        &texD3D11
    );

    if (res != S_OK) {
        Nan::ThrowError("Texture failed to create. Check exit code.");
        exit(res);
        return;
    }

    vr::Texture_t tex = {texD3D11, vr::ETextureType::TextureType_DirectX, vr::EColorSpace::ColorSpace_Gamma};

#else // !OVERLAY_D3D
    Nan::TypedArrayContents<float> buf(input);

    GLuint texGl;

    glGenTextures(1, &texGl);

    glBindTexture(GL_TEXTURE_2D, texGl);
    // glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
    // glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
    glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA, width, height, 0, GL_RGBA, GL_FLOAT, *buf);

    vr::Texture_t tex = {&texGl, vr::ETextureType::TextureType_OpenGL, vr::EColorSpace::ColorSpace_Auto};

#endif // OVERLAY_D3D

    vr::VROverlayError err;
    err = vr::VROverlay()->SetOverlayTexture(HND_OVERLAY(info[0]), &tex);
    
    CHECK_ERROR(err);
}

NAN_METHOD(IVROverlay::SetOverlayTransformTrackedDeviceRelative) {

    vr::TrackedDeviceIndex_t trackedDevice = info[1]->Uint32Value();
    vr::HmdMatrix34_t transform = decodeVec3x4(info[2]);

    vr::VROverlayError err;
    err = vr::VROverlay()->SetOverlayTransformTrackedDeviceRelative(HND_OVERLAY(info[0]), trackedDevice, &transform);
    checkError(err, "SetOverlayTransformTrackedDeviceRelative failed");
}