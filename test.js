const THREE = require('three');
const webgl = require('node-webgl2');
const ovenvr = require('node-ovenvr');

const DEFAULT_USER_HEIGHT = 1.6;

const document = window.webgl.document();
const canvas = document.createElement('canvas', window.devicePixelRatio * window.innerWidth, window.devicePixelRatio * window.innerHeight);
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
}

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
const _render => () => {
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
