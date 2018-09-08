# OpenVR for Node.js

This fork is built around overlays; however, there is an ongoing goal to make this the defacto OpenVR for Node.js fork.

## Installing

*This package is not published to NPM, however will be closer to API completeness. Please use GitHub package imports for now.*

```sh
yarn add kayteh/node-openvr

# OR

npm i kayteh/node-openvr
```

## Using

See `samples/` for working examples and tests used for developing this module.

### Overlay

This repo has a helper class for overlays, however you may just use the overlay system directly. This requires passing the overlay handle around, so the class just abstracts over that for you.

```js
const { math: { Vector3 } } = require('node-openvr')
const VROverlay = require('node-openvr/untyped/VROverlay')

```

Instead of using this helper class, you may also use thr C++ binding directly, see the following links.
- [**Direct Binding Example**](/kayteh/node-openvr/master/samples/direct.js)
- [**Another VROverlay Example**](/kayteh/node-openvr/master/samples/image-overlay/index.js)