const THREE = require('three');
const webgl = require('node-webgl2');
const ovenvr = require('node-ovenvr');

const document = window.webgl.document();
const canvas = document.createElement('canvas', window.devicePixelRatio * window.innerWidth, window.devicePixelRatio * window.innerHeight);
canvas.style = {
  width: canvas.width,
  height: canvas.height,
};
const gl = canvas2.getContext('webgl');

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  context: gl,
  antialias: true,
});
const scene = new THREE.Scene();
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
