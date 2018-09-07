declare module "openvr" {
    declare type VROverlayHandle_t = number
    
    declare type TrackedDeviceIndex_t = number
    
    declare type HmdMatrix34_t = Array<Array<number>>

    declare type ETrackingUniverseOrigin = 0 | 1 | 2
    
    declare class IVROverlay {
        static CreateOverlay(handle: VROverlayHandle_t, name: string): VROverlayHandle_t,
        static Check(): boolean,

        static ShowOverlay(handle: VROverlayHandle_t): void,
        static HideOverlay(handle: VROverlayHandle_t): void,

        static SetOverlayFromFile(handle: VROverlayHandle_t, path: string): void,

        static SetOverlayTextureFromBuffer(handle: VROverlayHandle_t, buf: ArrayBuffer, width: number, height: number): void,

        static SetOverlayTransformTrackedDeviceRelative(handle: VROverlayHandle_t, trackedDevice: TrackedDeviceIndex_t, transform: HmdMatrix34_t): void,

        static SetOverlayTransformAbsolute(handle: VROverlayHandle_t, origin: ETrackingUniverseOrigin, transform: HmdMatrix34_t): void,

        static SetOverlayAlpha(handle: VROverlayHandle_t, value: number): void,
        static GetOverlayAlpha(handle: VROverlayHandle_t): number
    }

    declare module.exports: {
        overlay: IVROverlay
    }
}