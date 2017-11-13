const THREE = require('three');
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
        ).toArray(),
    };
  }
  
  getFrameData(frameData) {
    console.log('frame data', frameData);
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
    // console.log('submit frame');
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

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  context: gl,
  antialias: true,
});
renderer.vr.enabled = true;
const display = new FakeVRDisplay();
renderer.vr.setDevice(display);
const scene = new THREE.Scene();
const mesh = new THREE.Mesh();
const camera = new THREE.PerspectiveCamera();
const _render = () => {
  renderer.render(scene, camera);
};

const waitGetPoses = fn => {
  setTimeout(fn, 1000 / 90);
};
const _recurse = () => {
  document.requestAnimationFrame();

  _render();

  waitGetPoses(_recurse);
};
_recurse();
