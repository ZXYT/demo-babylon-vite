// import "./style.css";

import {
  ArcRotateCamera,
  CubeTexture,
  Engine,
  HemisphericLight,
  Scene,
  SceneLoader,
  Vector3,
} from "@babylonjs/core";
import "@babylonjs/loaders";

// import { Engine } from "@babylonjs/core/Engines/engine";
// import { WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";
// import { getSceneModuleWithName } from "./createScene";
// import "@babylonjs/inspector";

// import { FluidRendering } from "./scenes/fluidSimulation2";
// const  createSceneModule  = new FluidRendering();

// import "@babylonjs/inspector";

// let seed = 1;
// Math.random = function () {
//   const x = Math.sin(seed++) * 10000;
//   return x - Math.floor(x);
// };

// const getModuleToLoad = (): string | undefined =>
//   location.search.split("scene=")[1];

// export const babylonInit = async (): Promise<void> => {
//   // get the module to load
//   const moduleName = getModuleToLoad();
//   const createSceneModule = await getSceneModuleWithName(moduleName);
//   console.log(createSceneModule);
//   // Execute the pretasks, if defined
//   await Promise.all(createSceneModule.preTasks || []);
//   // Get the canvas element
//   const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;

//   let engine: Engine;
//   const webgpuSupported = await WebGPUEngine.IsSupportedAsync;

//   if (webgpuSupported) {
//     engine = new WebGPUEngine(canvas, {
//       deviceDescriptor: {
//         requiredFeatures: [
//           "depth-clip-control",
//           "depth24unorm-stencil8",
//           "depth32float-stencil8",
//           "texture-compression-bc",
//           "texture-compression-etc2",
//           "texture-compression-astc",
//           "timestamp-query",
//           "indirect-first-instance",
//         ],
//       },
//       stencil: false,
//     });
//     (engine as WebGPUEngine).dbgShowShaderCode = false;
//     await (engine as WebGPUEngine).initAsync();
//   } else {
//     engine = new Engine(canvas, true);
//   }

//   // Create the scene
//   const scene = await createSceneModule.createScene(engine, canvas);

//   (window as any).engine = engine;
//   (window as any).scene = scene;

//   // Register a render loop to repeatedly render the scene
//   engine.runRenderLoop(function () {
//     scene.render();
//   });

//   // Watch for browser/canvas resize events
//   window.addEventListener("resize", function () {
//     engine.resize();
//   });
// };

// babylonInit().then(() => {
//   // scene started rendering, everything is initialized
// });

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
 <canvas id="renderCanvas" width="1500" height="700" ></canvas>
`;

const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
let engine!: Engine;
let scene!: Scene;
let sceneToRender!: Scene;

var startRenderLoop = function (engine: Engine) {
  engine.runRenderLoop(function () {
    if (sceneToRender && sceneToRender.activeCamera) {
      sceneToRender.render();
    }
  });
};

const createDefaultEngine = function () {
  return new Engine(canvas, true, {
    preserveDrawingBuffer: true,
    stencil: true,
    disableWebGL2Support: false,
  });
};

const createScene = async () => {
  const scene = new Scene(engine);

  const camera = new ArcRotateCamera(
    "camera",
    -Math.PI / 2,
    Math.PI / 2,
    10,
    new Vector3(0, 0, 0)
  );
  camera.attachControl(canvas, true);
  const light = new HemisphericLight("light", new Vector3(1, 1, 0), scene);
  light.intensity = 50;

  await SceneLoader.ImportMeshAsync("", "/", "untitled.glb");

  const ladle = scene?.getMeshByUniqueId(3)!;
  ladle.position.x = -5;
  ladle.position.y = 3;
  ladle.rotation = new Vector3(0, 0, 0);

  scene.createDefaultSkybox(
    CubeTexture.CreateFromPrefilteredData("/environment.env", scene)
  );

  return scene;
};

let req!: number;

const moveX = () => {
  req = requestAnimationFrame(() => {
    moveX();
    const ladle = scene?.getMeshByUniqueId(3);
    if (!ladle) return;
    const { x, y, z } = ladle.position;
    console.log(x, y, z);
    if (x >= 0) {
      cancelAnimationFrame(req);
      moveY();
    }
    ladle.position.x += 0.02;
  });
};

const moveY = () => {
  req = requestAnimationFrame(() => {
    moveY();
    const ladle = scene?.getMeshByUniqueId(3);
    if (!ladle) return;
    const { x, y, z } = ladle.position;
    console.log(x, y, z);
    if (y <= 0) {
      cancelAnimationFrame(req);
      rotate();
    }
    ladle.position.y -= 0.02;
  });
};

const rotate = () => {
  req = requestAnimationFrame(() => {
    rotate();
    const ladle = scene?.getMeshByUniqueId(3);
    if (!ladle) return;
    const { x, y, z } = ladle.rotation;
    console.log(x, y, z);

    if (z <= -Math.PI / 4) {
      cancelAnimationFrame(req);
    }
    const angle = ladle.rotation.z - Math.PI / 200;
    ladle.rotation = new Vector3(0, 0, angle);
  });
};

moveX();
const initFunction = async function () {
  var asyncEngineCreation = async function () {
    try {
      return createDefaultEngine();
    } catch (e) {
      console.log(
        "the available createEngine function failed. Creating the default engine instead"
      );
      return createDefaultEngine();
    }
  };

  engine = await asyncEngineCreation();
  if (!engine) throw "engine should not be null.";
  startRenderLoop(engine);
  scene = await createScene();
};
initFunction().then(() => {
  sceneToRender = scene;
});

// Resize
window.addEventListener("resize", function () {
  engine.resize();
});
