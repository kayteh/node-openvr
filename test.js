const THREE = require('three');
const webgl = require('node-webgl2');
const openvr = require('./index.js');

const DEFAULT_USER_HEIGHT = 1.6;

const fbos = webgl.getFBOs();
let fboIndex = 0;
const document = webgl.document();
const canvas = document.createElement('canvas', 1280, 1024);
canvas.style = {
  width: canvas.width,
  height: canvas.height,
};
const gl = canvas.getContext('webgl');

class FakeVRDisplay {
  constructor() {
    this.canPresent = true;
    this.isPresenting = true;

    this.stageParameters = {
      sittingToStandingTransform: new THREE.Matrix4()
        .compose(
          new THREE.Vector3(0, DEFAULT_USER_HEIGHT, 0),
          new THREE.Quaternion(),
          new THREE.Vector3(1, 1, 1)
        ).toArray(new Float32Array(16)),
    };
  }
  
  getFrameData(frameData) {
    openvr.system.GetDeviceToAbsoluteTrackingPose(
      1, // TrackingUniverseStanding
      localFloat32Array, // hmd
      localFloat32Array2, // left controller
      localFloat32Array3, // right controller
    );

    const hmdFloat32Array = localFloat32Array;
    if (!isNaN(hmdFloat32Array[0])) {
      const hmdMatrix = localMatrix.fromArray(hmdFloat32Array);

      openvr.system.GetEyeToHeadTransform(0, localFloat32Array4);
      localMatrix2.fromArray(localFloat32Array4)
        .premultiply(hmdMatrix)
        .toArray(frameData.pose.leftViewMatrix);

      openvr.system.GetProjectionMatrix(0, camera.near, camera.far, localFloat32Array4);
      frameData.pose.leftProjectionMatrix.set(localFloat32Array4);

      openvr.system.GetEyeToHeadTransform(1, localFloat32Array4);
      localMatrix2.fromArray(localFloat32Array4)
        .premultiply(hmdMatrix)
        .toArray(frameData.pose.rightViewMatrixViewMatrix);

      openvr.system.GetProjectionMatrix(1, camera.near, camera.far, localFloat32Array4);
      frameData.pose.rightProjectionMatrix.set(localFloat32Array4);
    }

    const leftControllerFloat32Array = localFloat32Array2;
    if (!isNaN(leftControllerFloat32Array[0])) {
      // XXX
    }

    const rightControllerFloat32Array = localFloat32Array3;
    if (!isNaN(rightControllerFloat32Array[0])) {
      // XXX
    }

    openvr.system.GetSeatedZeroPoseToStandingAbsoluteTrackingPose(this.stageParameters.sittingToStandingTransform);
  }
  
  getLayers() {
    return [
      {
        leftBounds: [0, 0, 0.5, 1],
        rightBounds: [0.5, 0, 0.5, 1],
        source: null,
      }
    ];
  }
  
  submitFrame() {
    openvr.compositor.Submit(fbos[fboIndex]);
  }
}
window = global;
class VRFrameData {
  constructor() {
    this.leftProjectionMatrix = new Float32Array(16);
    this.leftViewMatrix = new Float32Array(16);
    this.rightProjectionMatrix = new Float32Array(16);
    this.rightViewMatrix = new Float32Array(16);
    this.pose = new VRPose();
  }
}
class VRPose {
  constructor(position = new Float32Array(3), orientation = new Float32Array(4)) {
    this.position = position;
    this.orientation = orientation;
  }

  set(position, orientation) {
    this.position[0] = position.x;
    this.position[1] = position.y;
    this.position[2] = position.z;

    this.orientation[0] = orientation.x;
    this.orientation[1] = orientation.y;
    this.orientation[2] = orientation.z;
    this.orientation[3] = orientation.w;
  }
}
window.VRFrameData = VRFrameData;
window.addEventListener = () => {};
let rafCbs = [];
window.requestAnimationFrame = cb => {
  rafCbs.push(cb);
};

const _initRender = () => {
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    context: gl,
    antialias: true,
  });
  renderer.vr.enabled = true;
  const display = new FakeVRDisplay();
  renderer.vr.setDevice(display);
  const scene = new THREE.Scene();
  const boxMesh = (() => {
    const geometry = new THREE.BoxBufferGeometry(0.2, 0.2, 0.2);
    const material = new THREE.MeshPhongMaterial({
      color: 0xFF0000,
    });
    return new THREE.Mesh(geometry, material);
  })();
  scene.add(boxMesh);
  const camera = new THREE.PerspectiveCamera();
  const _render = () => {
    renderer.render(scene, camera);

    requestAnimationFrame(_render);
  };
  requestAnimationFrame(_render);
};
const _initMainLoop = () => {
  openvr.system.VR_Init(openvr.EVRApplicationType.Scene);
  process.on('exit', () => {
    openvr.system.VR_Shutdown();
  });

  const localFloat32Array = new Float32Array(16);
  const localFloat32Array2 = new Float32Array(16);
  const localFloat32Array3 = new Float32Array(16);
  const localFloat32Array4 = new Float32Array(16);
  const localMatrix = new THREE.Matrix4();
  const localMatrix2 = new THREE.Matrix4();
  const _recurse = () => {
    // wait for frame
    openvr.compositor.WaitGetPoses();

    // flip framebuffer
    document.requestAnimationFrame();
    fboIndex = (fboIndex + 1) % 2;

    // raf callbacks
    const oldRafCbs = rafCbs;
    rafCbs = [];
    for (let i = 0; i < oldRafCbs.length; i++) {
      oldRafCbs[i]();
    }

    // recurse
    _recurse();
  };
  _recurse();
};

_initRender();
_initMainLoop();
