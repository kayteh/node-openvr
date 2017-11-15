const events = require('events');
const {EventEmitter} = events;
const path = require('path');
const fs = require('fs');

const THREE = require('three-zeo');
const webgl = require('node-webgl2');
const openvr = require('./index.js');

const DEFAULT_USER_HEIGHT = 1.6;

const _requestJsonFile = p => new Promise((accept, reject) => {
  fs.readFile(p, (err, s) => {
    if (!err) {
      accept(JSON.parse(s));
    } else {
      reject(err);
    }
  });
});
const _requestJsonMesh = (modelJson, modelTexturePath) => new Promise((accept, reject) => {
  const loader = new THREE.ObjectLoader();
  loader.setTexturePath(modelTexturePath);
  loader.parse(modelJson, accept);
});

window = global;
window.document = {
  createElementNS: (ns, tagName) => {
    if (tagName === 'img') {
      const img = new EventEmitter();
      img.addEventListener = img.on;
      img.removeEventListener = img.removeListener;
      let src = '';
      Object.defineProperty(img, 'src', {
        get: () => src,
        set: newSrc => {
          src = newSrc;

          fs.readFile(src, (err, b) => {
            if (!err) {
              img.buffer = b;
              img.emit('load');
            } else {
              img.emit('error', err);
            }
          });
        },
      });
      img.buffer = null;
      return img;
    } else {
      return null;
    }
  },
};
window.addEventListener = () => {};
let rafCbs = [];
window.requestAnimationFrame = cb => {
  rafCbs.push(cb);
};
const controllerjsPath = path.join(require.resolve('controllerjs'), '..');
_requestJsonFile(path.join(controllerjsPath, 'model', 'controller.json'))
  .then(controllerJson => _requestJsonMesh(controllerJson, path.join(controllerjsPath, 'model', '/')))
  .then(controllerModel => {
    const platform = webgl.document();
    const canvas = platform.createElement('canvas', 1280, 1024, 4);
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
        const hmdMatrix = localMatrix.fromArray(localFloat32Array);
        hmdMatrix.getInverse(hmdMatrix);

        system.GetEyeToHeadTransform(0, localFloat32Array4);
        localMatrix2.fromArray(localFloat32Array4)
          .getInverse(localMatrix2)
          .multiply(hmdMatrix)
          .toArray(frameData.leftViewMatrix);

        system.GetProjectionMatrix(0, camera.near, camera.far, localFloat32Array4);
        _normalizeMatrixArray(localFloat32Array4);
        frameData.leftProjectionMatrix.set(localFloat32Array4);

        system.GetEyeToHeadTransform(1, localFloat32Array4);
        _normalizeMatrixArray(localFloat32Array4);
        localMatrix2.fromArray(localFloat32Array4)
          .getInverse(localMatrix2)
          .multiply(hmdMatrix)
          .toArray(frameData.rightViewMatrix);

        system.GetProjectionMatrix(1, camera.near, camera.far, localFloat32Array4);
        _normalizeMatrixArray(localFloat32Array4);
        frameData.rightProjectionMatrix.set(localFloat32Array4);

        // localFloat32Array2 // XXX

        system.GetSeatedZeroPoseToStandingAbsoluteTrackingPose(localFloat32Array4);
        _normalizeMatrixArray(localFloat32Array4);
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
        platform.blitFrameBuffer(msFbo, fbo, canvas.width, canvas.height, canvas.width, canvas.height);

        compositor.Submit(texture);
      }
    }
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

    let scene = null;
    let camera = null;
    let renderer = null;
    let leftControllerMesh = null;
    let rightControllerMesh = null;
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

      camera = new THREE.PerspectiveCamera(90, canvas.width/canvas.height, 0.1, 1000);
      camera.position.set(0, 0, 1);
      camera.lookAt(new THREE.Vector3(0, 0, 0));
      scene.add(camera);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
      directionalLight.position.set(1, 1, 1);
      scene.add(directionalLight);

      const boxMesh = (() => {
        const geometry = new THREE.BoxBufferGeometry(0.2, 0.2, 0.2);
        const material = new THREE.MeshPhongMaterial({
          color: 0xFF0000,
        });
        return new THREE.Mesh(geometry, material);
      })();
      scene.add(boxMesh);

      leftControllerMesh = controllerModel.clone();
      scene.add(leftControllerMesh);

      rightControllerMesh = controllerModel.clone();
      scene.add(rightControllerMesh);

      const _render = () => {
        renderer.render(scene, camera);
        renderer.context.flush();

        requestAnimationFrame(_render);
      };
      requestAnimationFrame(_render);
    };
    let system = null;
    let compositor = null;
    let msFbo = null;
    let msTexture = null;
    let fbo = null;
    let texture = null;
    const zeroMatrix = new THREE.Matrix4();
    const localFloat32Array = new Float32Array(16);
    const localFloat32Array2 = new Float32Array(16);
    const localFloat32Array3 = new Float32Array(16);
    const localFloat32Array4 = new Float32Array(16);
    const localMatrix = new THREE.Matrix4();
    const localMatrix2 = new THREE.Matrix4();
    const _normalizeMatrixArray = float32Array => {
      if (isNaN(float32Array[0])) {
        zeroMatrix.toArray(float32Array);
      }
    };
    const _initMainLoop = () => {
      system = openvr.system.VR_Init(openvr.EVRApplicationType.Scene);
      compositor = openvr.compositor.NewCompositor();
      process.on('exit', () => {
        openvr.system.VR_Shutdown();
      });

      const {width: halfWidth, height} = system.GetRecommendedRenderTargetSize();
      const width = halfWidth * 2;
      renderer.setSize(width, height);
      const [msFb, msTex] = platform.getRenderTarget(width, height, 4);
      msFbo = msFb;
      msTexture = msTex;
      const [fb, tex] = platform.getRenderTarget(width, height, 1);
      fbo = fb;
      texture = tex;

      const _recurse = () => {
        // wait for frame
        compositor.WaitGetPoses(
          system,
          localFloat32Array, // hmd
          localFloat32Array2, // left controller
          localFloat32Array3 // right controller
        );
        _normalizeMatrixArray(localFloat32Array);
        _normalizeMatrixArray(localFloat32Array2);
        _normalizeMatrixArray(localFloat32Array3);

        platform.bindFrameBuffer(msFbo);

        // raf callbacks
        const oldRafCbs = rafCbs;
        rafCbs = [];
        for (let i = 0; i < oldRafCbs.length; i++) {
          oldRafCbs[i]();
        }

        platform.blitFrameBuffer(msFbo, 0, canvas.width, canvas.height, canvas.width, canvas.height);
        platform.flip();

        // recurse
        process.nextTick(_recurse);
      };
      _recurse();
    };

    _initRender();
    _initMainLoop();
  })
  .catch(err => {
    console.warn(err.stack);
    process.exit(1);
  });
