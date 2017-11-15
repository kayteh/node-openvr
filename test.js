const THREE = require('three-zeo');
const webgl = require('node-webgl2');
const openvr = require('./index.js');

const DEFAULT_USER_HEIGHT = 1.6;

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
    system.GetDeviceToAbsoluteTrackingPose(
      1, // TrackingUniverseStanding
      localFloat32Array, // hmd
      localFloat32Array2, // left controller
      localFloat32Array3, // right controller
    );

    if (isNaN(localFloat32Array[0])) {
      zeroMatrix.toArray(localFloat32Array);
    }
    const hmdMatrix = localMatrix.fromArray(localFloat32Array);
    hmdMatrix.getInverse(hmdMatrix);

    system.GetEyeToHeadTransform(0, localFloat32Array4);
    if (isNaN(localFloat32Array4[0])) {
      zeroMatrix.toArray(localFloat32Array4);
    }
    localMatrix2.fromArray(localFloat32Array4)
      .getInverse(localMatrix2)
      .multiply(hmdMatrix)
      .toArray(frameData.leftViewMatrix);

    system.GetProjectionMatrix(0, camera.near, camera.far, localFloat32Array4);
    if (isNaN(localFloat32Array4[0])) {
      zeroMatrix.toArray(localFloat32Array4);
    }
    frameData.leftProjectionMatrix.set(localFloat32Array4);

    system.GetEyeToHeadTransform(1, localFloat32Array4);
    if (isNaN(localFloat32Array4[0])) {
      zeroMatrix.toArray(localFloat32Array4);
    }
    localMatrix2.fromArray(localFloat32Array4)
      .getInverse(localMatrix2)
      .multiply(hmdMatrix)
      .toArray(frameData.rightViewMatrix);

    system.GetProjectionMatrix(1, camera.near, camera.far, localFloat32Array4);
    if (isNaN(localFloat32Array4[0])) {
      zeroMatrix.toArray(localFloat32Array4);
    }
    frameData.rightProjectionMatrix.set(localFloat32Array4);

    if (isNaN(localFloat32Array2[0])) { // XXX
      zeroMatrix.toArray(localFloat32Array2);
    }

    if (isNaN(localFloat32Array3[0])) { // XXX
      zeroMatrix.toArray(localFloat32Array3);
    }
    
    system.GetSeatedZeroPoseToStandingAbsoluteTrackingPose(localFloat32Array4);
    if (isNaN(localFloat32Array4[0])) {
      zeroMatrix.toArray(localFloat32Array4);
    }
    this.stageParameters.sittingToStandingTransform.set(localFloat32Array4);
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
    compositor.Submit(texture);
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

let scene = null;
let camera = null;
let renderer = null;
const _initRender = () => {
  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    context: gl,
    antialias: true,
  });
  // renderer.setSize(canvas.width, canvas.height);
  renderer.setClearColor(0xffffff, 1);
  renderer.vr.enabled = true;
  const display = new FakeVRDisplay();
  renderer.vr.setDevice(display);
  scene = new THREE.Scene();

  const boxMesh = (() => {
    const geometry = new THREE.BoxBufferGeometry(0.2, 0.2, 0.2);
    const material = new THREE.MeshPhongMaterial({
      color: 0xFF0000,
    });
    return new THREE.Mesh(geometry, material);
  })();
  scene.add(boxMesh);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);

  camera = new THREE.PerspectiveCamera(90, canvas.width/canvas.height, 0.1, 1000);
  camera.position.set(0, 0, 1);
  camera.lookAt(new THREE.Vector3(0, 0, 0));
  scene.add(camera);

  const _render = () => {
    renderer.render(scene, camera);
    renderer.context.flush();

    requestAnimationFrame(_render);
  };
  requestAnimationFrame(_render);
};
let system = null;
let compositor = null;
let texture = null;
const zeroMatrix = new THREE.Matrix4();
const localFloat32Array = new Float32Array(16);
const localFloat32Array2 = new Float32Array(16);
const localFloat32Array3 = new Float32Array(16);
const localFloat32Array4 = new Float32Array(16);
const localMatrix = new THREE.Matrix4();
const localMatrix2 = new THREE.Matrix4();
const _initMainLoop = () => {
  system = openvr.system.VR_Init(openvr.EVRApplicationType.Scene);
  compositor = openvr.compositor.NewCompositor();
  process.on('exit', () => {
    openvr.system.VR_Shutdown();
  });

  const {width: halfWidth, height} = system.GetRecommendedRenderTargetSize();
  const width = halfWidth * 2;
  renderer.setSize(width, height);
  const [fbo, tex] = document.getFrameBufferTexture(width, height, document.samples);
  texture = tex;

  const _recurse = () => {
    // wait for frame
    compositor.WaitGetPoses();

    document.bindFrameBuffer(fbo);

    // raf callbacks
    const oldRafCbs = rafCbs;
    rafCbs = [];
    for (let i = 0; i < oldRafCbs.length; i++) {
      oldRafCbs[i]();
    }

    document.blitFrameBuffer(fbo, 0, canvas.width, canvas.height, canvas.width, canvas.height);
    document.flip();

    // recurse
    process.nextTick(_recurse);
  };
  _recurse();
};

_initRender();
_initMainLoop();
