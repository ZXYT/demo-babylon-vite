var canvas = document.getElementById("renderCanvas");

var startRenderLoop = function (engine, canvas) {
  engine.runRenderLoop(function () {
    if (sceneToRender && sceneToRender.activeCamera) {
      sceneToRender.render();
    }
  });
}

var engine = null;
var scene = null;
var sceneToRender = null;
var createDefaultEngine = function () { return new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true, disableWebGL2Support: false }); };
class Playground {
  static async CreateScene(engine, canvas) {
    // This creates a basic Babylon Scene object (non-mesh)
    var scene = new BABYLON.Scene(engine);
    await LoadLiLGUI();
    const cameraMin = 0.1;
    const cameraMax = 1000;
    const createCamera = () => {
      const camera = new BABYLON.ArcRotateCamera("ArcRotateCamera", 3.06, 1.14, 2.96, new BABYLON.Vector3(0, 0, 0), scene);
      camera.fov = (60 * Math.PI) / 180;
      camera.attachControl();
      camera.minZ = cameraMin;
      camera.maxZ = cameraMax;
      camera.wheelPrecision = 50;
      camera.inputs.removeByType("ArcRotateCameraKeyboardMoveInput");
      return camera;
    };
    const camera = createCamera();
    scene.activeCamera = camera;
    FluidSimulationDemoBase.AddDemo("Mesh SDF", () => new FluidSimulationDemoMeshSDF(scene));
    FluidSimulationDemoBase.StartDemo(0);
    scene.onDisposeObservable.add(() => {
      FluidSimulationDemoBase.Dispose();
    });
    return scene;
  }
}
const assetsDir = "./src/assets/";
async function LoadLiLGUI() {
  return BABYLON.Tools.LoadScriptAsync("https://cdn.jsdelivr.net/npm/lil-gui@0.17.0/dist/lil-gui.umd.min.js");
}
const domElementName = "fluidRendererGUI";
/**
 * A simple GUI to easily interact with the fluid renderer
 */
class FluidRendererGUI {
  _gui;
  _visible;
  _scene;
  _showGeneralMenu;
  _onKeyObserver;
  _targetRendererIndex;
  _targetRenderersGUIElements;
  _renderObjectIndex;
  _renderObjectsGUIElements;
  /**
   * Shows or hides the GUI
   */
  get visible() {
    return this._visible;
  }
  set visible(v) {
    if (v === this._visible) {
      return;
    }
    this._visible = v;
    if (this._gui) {
      this._gui.domElement.style.display = v ? "" : "none";
    }
  }
  /**
   * Initializes the class
   * @param scene Scene from which the fluid renderer should be retrieved
   * @param showGeneralMenu True to show the general menu, false to hide it (default: true)
   */
  constructor(scene, showGeneralMenu = true) {
    this._scene = scene;
    this._showGeneralMenu = showGeneralMenu;
    this._visible = true;
    this._onKeyObserver = null;
    this._targetRendererIndex = 0;
    this._targetRenderersGUIElements = [];
    this._renderObjectIndex = 0;
    this._renderObjectsGUIElements = [];
    this._gui = null;
    this._initialize();
  }
  /**
   * Disposes of all the ressources used by the class
   */
  dispose() {
    const oldgui = document.getElementById(domElementName);
    if (oldgui !== null) {
      oldgui.remove();
      this._gui = null;
    }
    this._scene.onKeyboardObservable.remove(this._onKeyObserver);
    this._onKeyObserver = null;
  }
  _setupKeyboard() {
    this._onKeyObserver = this._scene.onKeyboardObservable.add((kbInfo) => {
      switch (kbInfo.type) {
        case BABYLON.KeyboardEventTypes.KEYUP:
          switch (kbInfo.event.key) {
            case "F8": {
              this.visible = !this._visible;
              break;
            }
          }
          break;
      }
    });
  }
  async _initialize() {
    this.dispose();
    if (typeof lil === "undefined") {
      await LoadLiLGUI();
    }
    this._gui = new lil.GUI({ title: "Fluid Rendering" });
    this._gui.domElement.style.marginTop = "60px";
    this._gui.domElement.id = domElementName;
    this._setupKeyboard();
    if (this._showGeneralMenu) {
      this._makeMenuGeneral();
    }
    this._makeMenuTargetRenderers();
    this._makeMenuRenderObjects();
  }
  _addList(menu, params, name, friendlyName, list) {
    return menu
      .add(params, name, list)
      .name(friendlyName)
      .onChange((value) => {
        this._parameterChanged(name, value);
      });
  }
  _addCheckbox(menu, params, name, friendlyName) {
    return menu
      .add(params, name)
      .name(friendlyName)
      .onChange((value) => {
        this._parameterChanged(name, value);
      });
  }
  _addSlider(menu, params, name, friendlyName, min, max, step) {
    return menu
      .add(params, name, min, max, step)
      .name(friendlyName)
      .onChange((value) => {
        this._parameterChanged(name, value);
      });
  }
  _addColor(menu, params, name, friendlyName) {
    return menu
      .addColor(params, name)
      .name(friendlyName)
      .onChange((value) => {
        this._parameterChanged(name, value);
      });
  }
  _makeMenuGeneral() {
    if (!this._gui) {
      return;
    }
    const params = {
      enable: this._parameterRead("enable"),
    };
    const general = this._gui.addFolder("General");
    general.$title.style.fontWeight = "bold";
    this._addCheckbox(general, params, "enable", "Enable fluid renderer");
    general.open();
  }
  _makeMenuTargetRenderers() {
    if (!this._gui || !(this._scene.fluidRenderer?.targetRenderers.length ?? 0)) {
      return;
    }
    const params = {
      targets_index: this._parameterRead("targets_index"),
      targets_generateDiffuseTexture: this._parameterRead("targets_generateDiffuseTexture"),
      targets_fluidColor: this._parameterRead("targets_fluidColor"),
      targets_density: this._parameterRead("targets_density"),
      targets_refractionStrength: this._parameterRead("targets_refractionStrength"),
      targets_fresnelClamp: this._parameterRead("targets_fresnelClamp"),
      targets_specularPower: this._parameterRead("targets_specularPower"),
      targets_minimumThickness: this._parameterRead("targets_minimumThickness"),
      targets_debug: this._parameterRead("targets_debug"),
      targets_debugFeature: this._parameterRead("targets_debugFeature"),
      targets_enableBlurDepth: this._parameterRead("targets_enableBlurDepth"),
      targets_blurDepthSizeDivisor: this._parameterRead("targets_blurDepthSizeDivisor"),
      targets_blurDepthFilterSize: this._parameterRead("targets_blurDepthFilterSize"),
      targets_blurDepthNumIterations: this._parameterRead("targets_blurDepthNumIterations"),
      targets_blurDepthMaxFilterSize: this._parameterRead("targets_blurDepthMaxFilterSize"),
      targets_blurDepthDepthScale: this._parameterRead("targets_blurDepthDepthScale"),
      targets_enableBlurThickness: this._parameterRead("targets_enableBlurThickness"),
      targets_blurThicknessSizeDivisor: this._parameterRead("targets_blurThicknessSizeDivisor"),
      targets_blurThicknessFilterSize: this._parameterRead("targets_blurThicknessFilterSize"),
      targets_blurThicknessNumIterations: this._parameterRead("targets_blurThicknessNumIterations"),
      targets_depthMapSize: this._parameterRead("targets_depthMapSize"),
      targets_thicknessMapSize: this._parameterRead("targets_thicknessMapSize"),
      targets_diffuseMapSize: this._parameterRead("targets_diffuseMapSize"),
      targets_useVelocity: this._parameterRead("targets_useVelocity"),
      targets_useFixedThickness: this._parameterRead("targets_useFixedThickness"),
    };
    const targetRenderers = this._gui.addFolder("Target renderers");
    targetRenderers.$title.style.fontWeight = "bold";
    const targetList = [];
    if (this._scene.fluidRenderer) {
      for (let i = 0; i < this._scene.fluidRenderer.targetRenderers.length; ++i) {
        targetList.push(i);
      }
    }
    this._addList(targetRenderers, params, "targets_index", "Index", targetList);
    this._targetRenderersGUIElements.push(this._addList(targetRenderers, params, "targets_depthMapSize", "Depth map size", ["Screen size", 256, 512, 1024, 2048, 4096]));
    this._targetRenderersGUIElements.push(this._addList(targetRenderers, params, "targets_thicknessMapSize", "Thickness map size", ["Screen size", 64, 128, 256, 512, 1024, 2048]));
    this._targetRenderersGUIElements.push(this._addList(targetRenderers, params, "targets_diffuseMapSize", "Diffuse map size", ["Screen size", 256, 512, 1024, 2048, 4096]));
    this._targetRenderersGUIElements.push(this._addSlider(targetRenderers, params, "targets_minimumThickness", "Minimum thickness", 0, 3, 0.001));
    this._targetRenderersGUIElements.push(this._addCheckbox(targetRenderers, params, "targets_useFixedThickness", "Use fixed thickness"));
    this._targetRenderersGUIElements.push(this._addCheckbox(targetRenderers, params, "targets_useVelocity", "Use velocity"));
    const menuColor = targetRenderers.addFolder("Color");
    menuColor.$title.style.fontStyle = "italic";
    this._targetRenderersGUIElements.push(this._addCheckbox(menuColor, params, "targets_generateDiffuseTexture", "Generate diffuse texture"));
    this._targetRenderersGUIElements.push(this._addColor(menuColor, params, "targets_fluidColor", "Fluid color"));
    this._targetRenderersGUIElements.push(this._addSlider(menuColor, params, "targets_density", "Density", 0, 20, 0.01));
    this._targetRenderersGUIElements.push(this._addSlider(menuColor, params, "targets_refractionStrength", "Refraction strength", 0, 0.3, 0.005));
    this._targetRenderersGUIElements.push(this._addSlider(menuColor, params, "targets_fresnelClamp", "Fresnel clamp", 0, 1.0, 0.005));
    this._targetRenderersGUIElements.push(this._addSlider(menuColor, params, "targets_specularPower", "Specular power", 1, 5000, 5));
    const menuBlurDepth = targetRenderers.addFolder("Blur Depth");
    menuBlurDepth.$title.style.fontStyle = "italic";
    this._targetRenderersGUIElements.push(this._addCheckbox(menuBlurDepth, params, "targets_enableBlurDepth", "Enable"));
    this._targetRenderersGUIElements.push(this._addSlider(menuBlurDepth, params, "targets_blurDepthSizeDivisor", "Size divisor", 1, 10, 1));
    this._targetRenderersGUIElements.push(this._addSlider(menuBlurDepth, params, "targets_blurDepthFilterSize", "Filter size", 1, 20, 1));
    this._targetRenderersGUIElements.push(this._addSlider(menuBlurDepth, params, "targets_blurDepthNumIterations", "Num iterations", 1, 10, 1));
    this._targetRenderersGUIElements.push(this._addSlider(menuBlurDepth, params, "targets_blurDepthMaxFilterSize", "Max filter size", 1, 100, 1));
    this._targetRenderersGUIElements.push(this._addSlider(menuBlurDepth, params, "targets_blurDepthDepthScale", "Depth scale", 0, 100, 0.01));
    const menuBlurThickness = targetRenderers.addFolder("Blur Thickness");
    menuBlurThickness.$title.style.fontStyle = "italic";
    this._targetRenderersGUIElements.push(this._addCheckbox(menuBlurThickness, params, "targets_enableBlurThickness", "Enable"));
    this._targetRenderersGUIElements.push(this._addSlider(menuBlurThickness, params, "targets_blurThicknessSizeDivisor", "Size divisor", 1, 10, 1));
    this._targetRenderersGUIElements.push(this._addSlider(menuBlurThickness, params, "targets_blurThicknessFilterSize", "Filter size", 1, 20, 1));
    this._targetRenderersGUIElements.push(this._addSlider(menuBlurThickness, params, "targets_blurThicknessNumIterations", "Num iterations", 1, 10, 1));
    const menuDebug = targetRenderers.addFolder("Debug");
    menuDebug.$title.style.fontStyle = "italic";
    this._targetRenderersGUIElements.push(this._addCheckbox(menuDebug, params, "targets_debug", "Enable"));
    this._targetRenderersGUIElements.push(this._addList(menuDebug, params, "targets_debugFeature", "Feature", Object.keys(BABYLON.FluidRenderingDebug).filter((k) => isNaN(Number(k)))));
    targetRenderers.open();
  }
  _makeMenuRenderObjects() {
    if (!this._gui || !(this._scene.fluidRenderer?.renderObjects.length ?? 0)) {
      return;
    }
    const params = {
      objects_index: this._parameterRead("objects_index"),
      objects_particleSize: this._parameterRead("objects_particleSize"),
      objects_particleThicknessAlpha: this._parameterRead("objects_particleThicknessAlpha"),
    };
    const renderObjects = this._gui.addFolder("Render objects");
    renderObjects.$title.style.fontWeight = "bold";
    const objectList = [];
    if (this._scene.fluidRenderer) {
      for (let i = 0; i < this._scene.fluidRenderer.renderObjects.length; ++i) {
        objectList.push(i);
      }
    }
    this._addList(renderObjects, params, "objects_index", "Index", objectList);
    this._renderObjectsGUIElements.push(this._addSlider(renderObjects, params, "objects_particleSize", "Particle size", 0, 2, 0.001));
    this._renderObjectsGUIElements.push(this._addSlider(renderObjects, params, "objects_particleThicknessAlpha", "Particle alpha", 0, 1, 0.001));
  }
  _readValue(obj, name) {
    const parts = name.split("_");
    for (let i = 0; i < parts.length; ++i) {
      const part = parts[i];
      obj = obj[parts[i]];
      if (obj instanceof BABYLON.Color3) {
        obj = obj.toHexString();
      }
      if (part === "debugFeature") {
        obj = BABYLON.FluidRenderingDebug[obj];
      }
      if (part.endsWith("MapSize") && obj === null) {
        obj = "Screen size";
      }
    }
    return obj;
  }
  _setValue(obj, name, value) {
    const parts = name.split("_");
    for (let i = 0; i < parts.length - 1; ++i) {
      obj = obj[parts[i]];
      if (parts[i].endsWith("MapSize") && value === "Screen size") {
        value = null;
      }
    }
    if (parts[parts.length - 1].endsWith("MapSize") && value === "Screen size") {
      value = null;
    }
    obj[parts[parts.length - 1]] = value;
  }
  _parameterRead(name) {
    const fluidRenderer = this._scene.fluidRenderer;
    switch (name) {
      case "enable":
        return !!this._scene.fluidRenderer;
    }
    if (name.startsWith("targets_")) {
      name = name.substring(8);
      if (name === "index") {
        return this._targetRendererIndex;
      }
      else {
        return fluidRenderer ? this._readValue(fluidRenderer.targetRenderers[this._targetRendererIndex], name) : "";
      }
    }
    if (name.startsWith("objects_")) {
      name = name.substring(8);
      if (name === "index") {
        return this._renderObjectIndex;
      }
      else {
        return fluidRenderer ? this._readValue(fluidRenderer.renderObjects[this._renderObjectIndex].object, name) : "";
      }
    }
  }
  _fillValues(listGUIElements, obj) {
    for (let i = 0; i < listGUIElements.length; ++i) {
      const elem = listGUIElements[i];
      const property = elem.property.split("_")[1];
      elem.object[elem.property] = this._readValue(obj, property);
      elem.updateDisplay();
    }
  }
  /**
   * Updates the values displayed by the GUI according to the property values of the underlying objects
   */
  syncGUI() {
    const fluidRenderer = this._scene.fluidRenderer;
    if (fluidRenderer) {
      this._fillValues(this._targetRenderersGUIElements, fluidRenderer.targetRenderers[this._targetRendererIndex]);
      this._fillValues(this._renderObjectsGUIElements, fluidRenderer.renderObjects[this._renderObjectIndex].object);
    }
  }
  _parameterChanged(name, value) {
    const fluidRenderer = this._scene.fluidRenderer;
    switch (name) {
      case "enable":
        if (value) {
          this._scene.enableFluidRenderer();
          this._targetRendererIndex = 0;
          this._initialize();
        }
        else {
          this._scene.disableFluidRenderer();
          this._targetRendererIndex = 0;
          this._initialize();
        }
        return;
      case "targets_fluidColor":
        if (fluidRenderer && fluidRenderer.targetRenderers.length > this._targetRendererIndex) {
          fluidRenderer.targetRenderers[this._targetRendererIndex].fluidColor.copyFrom(BABYLON.Color3.FromHexString(value));
        }
        return;
      case "targets_debugFeature": {
        const typedDebugFeature = value;
        const val = BABYLON.FluidRenderingDebug[typedDebugFeature];
        if (fluidRenderer && fluidRenderer.targetRenderers.length > this._targetRendererIndex) {
          fluidRenderer.targetRenderers[this._targetRendererIndex].debugFeature = val;
        }
        return;
      }
    }
    if (name.startsWith("targets_")) {
      name = name.substring(8);
      if (name === "index") {
        this._targetRendererIndex = value || 0;
        if (fluidRenderer) {
          this._fillValues(this._targetRenderersGUIElements, fluidRenderer.targetRenderers[this._targetRendererIndex]);
        }
      }
      else {
        if (fluidRenderer) {
          this._setValue(fluidRenderer.targetRenderers[this._targetRendererIndex], name, value === false ? false : value === true ? true : isNaN(value) ? value : parseFloat(value));
        }
      }
    }
    if (name.startsWith("objects_")) {
      name = name.substring(8);
      if (name === "index") {
        this._renderObjectIndex = value || 0;
        if (fluidRenderer) {
          this._fillValues(this._renderObjectsGUIElements, fluidRenderer.renderObjects[this._renderObjectIndex].object);
        }
      }
      else {
        if (fluidRenderer) {
          this._setValue(fluidRenderer.renderObjects[this._renderObjectIndex].object, name, value === false ? false : value === true ? true : isNaN(value) ? value : parseFloat(value));
        }
      }
    }
  }
}
const envNames = [
  "Environment",
  "Country",
  "Parking",
  "Night",
  "Canyon",
  "Studio",
];
const envFile = [
  "environment.env",
  "country.env",
  "parking.env",
  "night.env",
  "Runyon_Canyon_A_2k_cube_specular.env",
  "Studio_Softbox_2Umbrellas_cube_specular.env",
];
class FluidSimulationDemoBase {
  _scene;
  _engine;
  _gui;
  _environmentFile;
  _noFluidSimulation;
  _fluidRenderer;
  _fluidRenderObject;
  _fluidRendererGUI;
  _fluidSim;
  _particleGenerator;
  _numParticles;
  _paused;
  _sceneObserver;
  _loadParticlesFromFile;
  _shapeCollisionRestitution;
  _collisionObjectPromises;
  _collisionObjects;
  _fluidSimGUIElements;
  static _DemoList = [];
  static _CurrentDemo;
  static _CurrentDemoIndex;
  static AddDemo(name, factory) {
    FluidSimulationDemoBase._DemoList.push({ name, factory });
  }
  static StartDemo(index) {
    FluidSimulationDemoBase._CurrentDemo?.dispose();
    FluidSimulationDemoBase._CurrentDemoIndex = index;
    FluidSimulationDemoBase._CurrentDemo =
      FluidSimulationDemoBase._DemoList[index].factory();
    FluidSimulationDemoBase._CurrentDemo.run();
  }
  static Dispose() {
    FluidSimulationDemoBase._CurrentDemo?.dispose();
  }
  constructor(scene, noFluidSimulation = false, particleFileName) {
    this._scene = scene;
    this._engine = scene.getEngine();
    this._fluidRenderer = scene.enableFluidRenderer();
    this._numParticles = 6000;
    this._paused = false;
    this._gui = null;
    this._fluidRendererGUI = null;
    this._sceneObserver = null;
    this._fluidSim = null;
    this._particleGenerator = null;
    this._loadParticlesFromFile = particleFileName !== undefined;
    this._shapeCollisionRestitution = 0.999;
    this._collisionObjectPromises = [];
    this._collisionObjects = [];
    this._environmentFile = "Environment";
    this._fluidSimGUIElements = [];
    this._noFluidSimulation = noFluidSimulation;
    const particleRadius = 0.02;
    const camera = scene.activeCameras?.[0] ?? scene.activeCamera;
    camera.storeState();
    // Setup the fluid renderer object
    this._fluidRenderObject = this._fluidRenderer.addCustomParticles({}, 0, false, undefined, camera);
    this._fluidRenderObject.targetRenderer.enableBlurDepth = true;
    this._fluidRenderObject.targetRenderer.blurDepthFilterSize = 20;
    this._fluidRenderObject.targetRenderer.blurDepthNumIterations = 5;
    this._fluidRenderObject.targetRenderer.blurDepthDepthScale = 10;
    this._fluidRenderObject.targetRenderer.fluidColor = new BABYLON.Color3(1 - 0.5, 1 - 0.2, 1 - 0.05);
    this._fluidRenderObject.targetRenderer.density = 2.2;
    this._fluidRenderObject.targetRenderer.refractionStrength = 0.02;
    this._fluidRenderObject.targetRenderer.specularPower = 150;
    this._fluidRenderObject.targetRenderer.blurThicknessFilterSize = 10;
    this._fluidRenderObject.targetRenderer.blurThicknessNumIterations = 2;
    this._fluidRenderObject.targetRenderer.dirLight = new BABYLON.Vector3(2, -1, 1);
    this._fluidRenderObject.object.particleSize = particleRadius * 2 * 2;
    this._fluidRenderObject.object.particleThicknessAlpha =
      this._fluidRenderObject.object.particleSize;
    this._fluidRenderObject.object.useVelocity =
      this._fluidRenderObject.targetRenderer.useVelocity;
    this._fluidRenderObject.targetRenderer.minimumThickness =
      this._fluidRenderObject.object.particleThicknessAlpha / 2;
    // Setup the fluid simulator / particle generator
    if (!noFluidSimulation) {
      this._fluidSim = new FluidSimulator();
      this._fluidSim.smoothingRadius = particleRadius * 2;
      this._fluidSim.maxVelocity = 3;
      window.fsim = this._fluidSim;
      this._particleGenerator = new ParticleGenerator(this._scene, particleFileName);
      this._particleGenerator.particleRadius =
        this._fluidSim.smoothingRadius / 2;
      this._particleGenerator.position.y = 0.5;
    }
  }
  _setEnvironment() {
    const idx = envNames.indexOf(this._environmentFile);
    this._scene.environmentTexture =
      BABYLON.CubeTexture.CreateFromPrefilteredData("https://playground.babylonjs.com/textures/" + envFile[idx], this._scene);
    this._scene.createDefaultSkybox(this._scene.environmentTexture);
  }
  async run() {
    this._setEnvironment();
    this._collisionObjects = await Promise.all(this._collisionObjectPromises);
    this._run();
  }
  async _run() {
    await this._generateParticles();
    if (this._particleGenerator && this._loadParticlesFromFile) {
      this._numParticles = this._particleGenerator.currNumParticles;
    }
    this._fluidRendererGUI = new FluidRendererGUI(this._scene, false);
    this._makeGUI();
    if (!this._noFluidSimulation) {
      this._sceneObserver = this._scene.onBeforeRenderObservable.add(() => {
        this._fluidSim.currentNumParticles = Math.min(this._numParticles, this._particleGenerator.currNumParticles);
        this._fluidRenderObject
          .object.setNumParticles(this._fluidSim.currentNumParticles);
        if (!this._paused) {
          this._fluidSim.update(1 / 100);
          this._checkCollisions(this._fluidRenderObject.object.particleSize / 2);
        }
        if (this._fluidRenderObject &&
          this._fluidRenderObject.object.vertexBuffers["position"]) {
          this._fluidRenderObject.object.vertexBuffers["position"].updateDirectly(this._fluidSim.positions, 0);
          this._fluidRenderObject.object.vertexBuffers["velocity"].updateDirectly(this._fluidSim.velocities, 0);
        }
      });
    }
  }
  disposeCollisionObject(index) {
    const shape = this._collisionObjects[index][1];
    shape?.mesh?.material?.dispose();
    shape?.mesh?.dispose();
    this._collisionObjects.splice(index, 1);
    this._collisionObjectPromises.splice(index, 1);
  }
  dispose() {
    while (this._collisionObjects.length > 0) {
      this.disposeCollisionObject(0);
    }
    this._scene.onBeforeRenderObservable.remove(this._sceneObserver);
    this._fluidRendererGUI?.dispose();
    this._gui?.destroy();
    this._fluidSim?.dispose();
    this._particleGenerator?.dispose();
    this._fluidRenderer.removeRenderObject(this._fluidRenderObject);
    const camera = this._scene.activeCameras?.[0] ?? this._scene.activeCamera;
    camera._restoreStateValues();
  }
  addCollisionSphere(position, radius, dragPlane = new BABYLON.Vector3(0, 1, 0), collisionRestitution, dontCreateMesh) {
    const collisionShape = {
      params: [radius],
      createMesh: SDFHelper.CreateSphere,
      sdEvaluate: SDFHelper.SDSphere,
      computeNormal: SDFHelper.ComputeSDFNormal,
      position: position.clone(),
      mesh: null,
      transf: new BABYLON.Matrix(),
      scale: 1,
      invTransf: new BABYLON.Matrix(),
      dragPlane,
      collisionRestitution,
    };
    const promise = dontCreateMesh
      ? Promise.resolve([null, collisionShape])
      : this._createMeshForCollision(collisionShape);
    this._collisionObjectPromises.push(promise);
    return promise;
  }
  addCollisionBox(position, rotation, extents, dragPlane = new BABYLON.Vector3(0, 1, 0), collisionRestitution, dontCreateMesh) {
    const collisionShape = {
      params: [extents.clone()],
      createMesh: SDFHelper.CreateBox,
      sdEvaluate: SDFHelper.SDBox,
      computeNormal: SDFHelper.ComputeSDFNormal,
      rotation: rotation.clone(),
      position: position.clone(),
      mesh: null,
      transf: new BABYLON.Matrix(),
      scale: 1,
      invTransf: new BABYLON.Matrix(),
      dragPlane,
      collisionRestitution,
    };
    const promise = dontCreateMesh
      ? Promise.resolve([null, collisionShape])
      : this._createMeshForCollision(collisionShape);
    this._collisionObjectPromises.push(promise);
    return promise;
  }
  addCollisionPlane(normal, d, collisionRestitution) {
    const collisionShape = {
      params: [normal.clone(), d],
      sdEvaluate: SDFHelper.SDPlane,
      computeNormal: SDFHelper.ComputeSDFNormal,
      mesh: null,
      position: new BABYLON.Vector3(0, 0, 0),
      rotation: new BABYLON.Vector3(0, 0, 0),
      transf: BABYLON.Matrix.Identity(),
      scale: 1,
      invTransf: BABYLON.Matrix.Identity(),
      dragPlane: null,
      collisionRestitution,
    };
    const promise = Promise.resolve([null, collisionShape]);
    this._collisionObjectPromises.push(promise);
    return promise;
  }
  addCollisionCutHollowSphere(position, rotation, radius, planeDist, thickness, segments, dragPlane = new BABYLON.Vector3(0, 1, 0), collisionRestitution, dontCreateMesh) {
    const collisionShape = {
      params: [radius, planeDist, thickness, segments],
      createMesh: SDFHelper.CreateCutHollowSphere,
      sdEvaluate: SDFHelper.SDCutHollowSphere,
      computeNormal: SDFHelper.ComputeSDFNormal,
      rotation: rotation.clone(),
      position: position.clone(),
      mesh: null,
      transf: new BABYLON.Matrix(),
      scale: 1,
      invTransf: new BABYLON.Matrix(),
      dragPlane,
      collisionRestitution,
    };
    const promise = dontCreateMesh
      ? Promise.resolve([null, collisionShape])
      : this._createMeshForCollision(collisionShape);
    this._collisionObjectPromises.push(promise);
    return promise;
  }
  addCollisionVerticalCylinder(position, rotation, radius, height, segments, dragPlane = new BABYLON.Vector3(0, 1, 0), collisionRestitution, dontCreateMesh) {
    const collisionShape = {
      params: [radius, height, segments],
      createMesh: SDFHelper.CreateVerticalCylinder,
      sdEvaluate: SDFHelper.SDVerticalCylinder,
      computeNormal: SDFHelper.ComputeSDFNormal,
      rotation: rotation.clone(),
      position: position.clone(),
      mesh: null,
      transf: new BABYLON.Matrix(),
      scale: 1,
      invTransf: new BABYLON.Matrix(),
      dragPlane,
      collisionRestitution,
    };
    const promise = dontCreateMesh
      ? Promise.resolve([null, collisionShape])
      : this._createMeshForCollision(collisionShape);
    this._collisionObjectPromises.push(promise);
    return promise;
  }
  addCollisionMesh(position, rotation, meshFilename, sdfFilename, createNormals = false, scale = 1, dragPlane = new BABYLON.Vector3(0, 1, 0), collisionRestitution, dontCreateMesh) {
    const collisionShape = {
      params: [meshFilename, sdfFilename, createNormals],
      createMesh: SDFHelper.CreateMesh,
      sdEvaluate: SDFHelper.SDMesh,
      computeNormal: SDFHelper.ComputeSDFNormal,
      rotation: rotation.clone(),
      position: position.clone(),
      mesh: null,
      transf: new BABYLON.Matrix(),
      scale,
      invTransf: new BABYLON.Matrix(),
      dragPlane,
      collisionRestitution,
    };
    const promise = dontCreateMesh
      ? Promise.resolve([null, collisionShape])
      : this._createMeshForCollision(collisionShape);
    this._collisionObjectPromises.push(promise);
    return promise;
  }
  addCollisionTerrain(size) {
    const collisionShape = {
      params: [size],
      createMesh: SDFHelper.CreateTerrain,
      sdEvaluate: SDFHelper.SDTerrain,
      computeNormal: SDFHelper.ComputeTerrainNormal,
      mesh: null,
      transf: new BABYLON.Matrix(),
      scale: 1,
      invTransf: new BABYLON.Matrix(),
      dragPlane: null,
    };
    const promise = this._createMeshForCollision(collisionShape);
    this._collisionObjectPromises.push(promise);
    return promise;
  }
  async _createMeshForCollision(shape) {
    const mesh = await shape.createMesh?.(this._scene, shape, ...shape.params);
    shape.position = shape.position ?? new BABYLON.Vector3(0, 0, 0);
    if (!shape.rotation && !shape.rotationQuaternion) {
      shape.rotation = new BABYLON.Vector3(0, 0, 0);
    }
    if (!mesh) {
      return [null, shape];
    }
    mesh.position = shape.position;
    if (shape.rotation) {
      mesh.rotation = shape.rotation;
    }
    else {
      mesh.rotationQuaternion = shape.rotationQuaternion;
    }
    shape.mesh = mesh;
    if (shape.dragPlane) {
      const camera = this._scene.activeCameras?.[0] ?? this._scene.activeCamera;
      const pointerDragBehavior = new BABYLON.PointerDragBehavior({
        dragPlaneNormal: shape.dragPlane,
      });
      pointerDragBehavior.useObjectOrientationForDragging = false;
      pointerDragBehavior.onDragStartObservable.add(() => {
        camera.detachControl();
      });
      pointerDragBehavior.onDragEndObservable.add(() => {
        camera.attachControl();
      });
      mesh.addBehavior(pointerDragBehavior);
    }
    return [mesh, shape];
  }
  async _generateParticles(regenerateAll = true) {
    await this._particleGenerator?.generateParticles(this._numParticles, regenerateAll);
    if (this._fluidSim &&
      this._particleGenerator &&
      this._fluidSim.positions !== this._particleGenerator.positions) {
      this._fluidSim.setParticleData(this._particleGenerator.positions, this._particleGenerator.velocities);
      this._fluidRenderObject.object.vertexBuffers["position"]?.dispose();
      this._fluidRenderObject.object.vertexBuffers["velocity"]?.dispose();
      this._fluidRenderObject.object.vertexBuffers["position"] =
        new BABYLON.VertexBuffer(this._engine, this._fluidSim.positions, BABYLON.VertexBuffer.PositionKind, true, false, 3, true);
      this._fluidRenderObject.object.vertexBuffers["velocity"] =
        new BABYLON.VertexBuffer(this._engine, this._fluidSim.velocities, "velocity", true, false, 3, true);
    }
  }
  _makeGUIMainMenu() {
    // empty
  }
  _syncFluidSimGUI() {
    for (const [elem, obj, property] of this._fluidSimGUIElements) {
      elem.object[elem.property] = obj[property];
      elem.updateDisplay();
    }
  }
  _makeGUI() {
    this._gui = new lil.GUI({ title: "Demo" });
    this._gui.domElement.style.marginBottom = "40px";
    this._gui.domElement.style.right = "20px";
    this._gui.domElement.style.bottom = "0px";
    this._gui.domElement.style.top = "initial";
    this._gui.domElement.id = "simGUI";
    const params = {
      demo: FluidSimulationDemoBase._DemoList[FluidSimulationDemoBase._CurrentDemoIndex].name,
      environment: this._environmentFile,
      paused: false,
      numParticles: this._numParticles,
      smoothingRadius: this._fluidSim?.smoothingRadius,
      densityReference: this._fluidSim?.densityReference,
      pressureConstant: this._fluidSim?.pressureConstant,
      viscosity: this._fluidSim?.viscosity,
      minTimeStep: this._fluidSim?.minTimeStep,
      maxVelocity: this._fluidSim?.maxVelocity,
      maxAcceleration: this._fluidSim?.maxAcceleration,
      shapeCollisionRestitution: this._shapeCollisionRestitution,
    };
    const demoList = [];
    for (const demo of FluidSimulationDemoBase._DemoList) {
      demoList.push(demo.name);
    }
    this._gui
      .add(params, "demo", demoList)
      .name("Name")
      .onChange((value) => {
        for (let i = 0; i < FluidSimulationDemoBase._DemoList.length; ++i) {
          if (FluidSimulationDemoBase._DemoList[i].name === value) {
            FluidSimulationDemoBase.StartDemo(i);
            break;
          }
        }
      });
    this._gui
      .add(params, "environment", envNames)
      .name("Environment")
      .onChange((value) => {
        this._environmentFile = value;
        this._setEnvironment();
      });
    this._makeGUIMainMenu();
    if (this._fluidSim && this._particleGenerator) {
      const menuFluidSim = this._gui.addFolder("Fluid Simulator");
      menuFluidSim.$title.style.fontWeight = "bold";
      this._fluidSimGUIElements.push([
        menuFluidSim
          .add(params, "numParticles", 0, 40000, 88)
          .name("Num particles")
          .onChange((value) => {
            this._numParticles = value;
            this._generateParticles(false);
          }),
        this,
        "_numParticles",
      ]);
      this._fluidSimGUIElements.push([
        menuFluidSim
          .add(params, "smoothingRadius", 0, 2, 0.001)
          .name("Smoothing radius")
          .onChange((value) => {
            this._fluidSim.smoothingRadius = value || 0.04;
            this._particleGenerator.particleRadius =
              this._fluidSim.smoothingRadius / 2;
          }),
        this._fluidSim,
        "smoothingRadius",
      ]);
      this._fluidSimGUIElements.push([
        menuFluidSim
          .add(params, "densityReference", 0, 50000, 100)
          .name("Density reference")
          .onChange((value) => {
            this._fluidSim.densityReference = value;
          }),
        this._fluidSim,
        "densityReference",
      ]);
      this._fluidSimGUIElements.push([
        menuFluidSim
          .add(params, "pressureConstant", 0, 100, 1)
          .name("Pressure constant")
          .onChange((value) => {
            this._fluidSim.pressureConstant = value;
          }),
        this._fluidSim,
        "pressureConstant",
      ]);
      this._fluidSimGUIElements.push([
        menuFluidSim
          .add(params, "viscosity", 0, 0.1, 0.001)
          .name("Viscosity")
          .onChange((value) => {
            this._fluidSim.viscosity = value;
          }),
        this._fluidSim,
        "viscosity",
      ]);
      this._fluidSimGUIElements.push([
        menuFluidSim
          .add(params, "maxVelocity", 0, 20, 1)
          .name("Max velocity")
          .onChange((value) => {
            this._fluidSim.maxVelocity = value;
          }),
        this._fluidSim,
        "maxVelocity",
      ]);
      this._fluidSimGUIElements.push([
        menuFluidSim
          .add(params, "maxAcceleration", 0, 100000, 10)
          .name("Max acceleration")
          .onChange((value) => {
            this._fluidSim.maxAcceleration = value;
          }),
        this._fluidSim,
        "maxAcceleration",
      ]);
      this._fluidSimGUIElements.push([
        menuFluidSim
          .add(params, "minTimeStep", 0, 0.01, 0.00001)
          .name("Min time step")
          .onChange((value) => {
            this._fluidSim.minTimeStep = value;
          }),
        this._fluidSim,
        "minTimeStep",
      ]);
      this._fluidSimGUIElements.push([
        menuFluidSim
          .add(params, "shapeCollisionRestitution", 0, 1, 0.001)
          .name("Collision restitution")
          .onChange((value) => {
            this._shapeCollisionRestitution = value;
          }),
        this,
        "_shapeCollisionRestitution",
      ]);
      menuFluidSim
        .add(params, "paused")
        .name("Pause")
        .onChange((value) => {
          this._onPaused(value);
        });
      menuFluidSim.open();
    }
  }
  _onPaused(value) {
    this._paused = value;
  }
  _checkCollisions(particleRadius) {
    if (this._collisionObjects.length === 0) {
      return;
    }
    const positions = this._fluidSim.positions;
    const velocities = this._fluidSim.velocities;
    const tmpQuat = BABYLON.TmpVectors.Quaternion[0];
    const tmpScale = BABYLON.TmpVectors.Vector3[0];
    tmpScale.copyFromFloats(1, 1, 1);
    for (let i = 0; i < this._collisionObjects.length; ++i) {
      const shape = this._collisionObjects[i][1];
      const quat = shape.mesh?.rotationQuaternion ??
        shape.rotationQuaternion ??
        BABYLON.Quaternion.FromEulerAnglesToRef(shape.mesh?.rotation.x ?? shape.rotation.x, shape.mesh?.rotation.y ?? shape.rotation.y, shape.mesh?.rotation.z ?? shape.rotation.z, tmpQuat);
      BABYLON.Matrix.ComposeToRef(tmpScale, quat, shape.mesh?.position ?? shape.position, shape.transf);
      shape.transf.invertToRef(shape.invTransf);
    }
    const pos = BABYLON.TmpVectors.Vector3[4];
    const normal = BABYLON.TmpVectors.Vector3[7];
    for (let a = 0; a < this._fluidSim.currentNumParticles; ++a) {
      const px = positions[a * 3 + 0];
      const py = positions[a * 3 + 1];
      const pz = positions[a * 3 + 2];
      for (let i = 0; i < this._collisionObjects.length; ++i) {
        const shape = this._collisionObjects[i][1];
        if (shape.disabled) {
          continue;
        }
        pos.copyFromFloats(px, py, pz);
        BABYLON.Vector3.TransformCoordinatesToRef(pos, shape.invTransf, pos);
        pos.scaleInPlace(1 / shape.scale);
        const dist = shape.scale * shape.sdEvaluate(pos, ...shape.params) -
          particleRadius;
        if (dist < 0) {
          shape.computeNormal(pos, shape, normal);
          const restitution = shape.collisionRestitution ??
            this._shapeCollisionRestitution;
          const dotvn = velocities[a * 3 + 0] * normal.x +
            velocities[a * 3 + 1] * normal.y +
            velocities[a * 3 + 2] * normal.z;
          velocities[a * 3 + 0] =
            (velocities[a * 3 + 0] - 2 * dotvn * normal.x) *
            restitution;
          velocities[a * 3 + 1] =
            (velocities[a * 3 + 1] - 2 * dotvn * normal.y) *
            restitution;
          velocities[a * 3 + 2] =
            (velocities[a * 3 + 2] - 2 * dotvn * normal.z) *
            restitution;
          positions[a * 3 + 0] -= normal.x * dist;
          positions[a * 3 + 1] -= normal.y * dist;
          positions[a * 3 + 2] -= normal.z * dist;
        }
      }
    }
  }
}
// -+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
// -+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
// -+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
// -+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
// -+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
// -+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
// High heels model by cebraVFX found on Sketchfab (https://sketchfab.com/3d-models/high-heels-1561c09fc45349d680e48e3e007b64e0)
class FluidSimulationDemoMeshSDF extends FluidSimulationDemoBase {
  _sceneRenderObserver;
  _meshName;
  constructor(scene) {
    super(scene);
    this._environmentFile = "Parking";
    this._meshName = null;
    this._sceneRenderObserver = null;
    this._numParticles = 7500;
    this.addCollisionPlane(new BABYLON.Vector3(0, 1, 0), 0.5, 0.3);
    this._addMesh("High heels");
  }
  async _addMesh(name, waitForReadiness = false) {
    this._meshName = name;
    switch (name) {
      case "High heels":
        this.addCollisionMesh(new BABYLON.Vector3(0.85, -0.5, 0), new BABYLON.Vector3(0, 0, 0), "high_heels.obj", "high_heels.sdf", false, 0.03);
        break;
      case "Dragon":
        this.addCollisionMesh(new BABYLON.Vector3(-0.1, -0.5, -2.4), new BABYLON.Vector3(0, -1.0, 0), "Dragon_50k.obj", "Dragon_50k.sdf", true, 3);
        break;
    }
    if (waitForReadiness) {
      this._collisionObjects = await Promise.all(this._collisionObjectPromises);
    }
  }
  async _run() {
    /*for (let i = 2; i <= 17; ++i) {
        const m = this._scene.meshes[i] as BABYLON.Mesh;
        m.bakeCurrentTransformIntoVertices();
        m.parent = null;
        m.scaling.setAll(10);
        m.bakeCurrentTransformIntoVertices();
    }
 
    const mm = BABYLON.Mesh.MergeMeshes([
        this._scene.meshes[2] as BABYLON.Mesh,
        this._scene.meshes[3] as BABYLON.Mesh,
        this._scene.meshes[4] as BABYLON.Mesh,
        this._scene.meshes[5] as BABYLON.Mesh,
        this._scene.meshes[6] as BABYLON.Mesh,
        this._scene.meshes[7] as BABYLON.Mesh,
        this._scene.meshes[8] as BABYLON.Mesh,
        this._scene.meshes[9] as BABYLON.Mesh,
        this._scene.meshes[10] as BABYLON.Mesh,
        this._scene.meshes[11] as BABYLON.Mesh,
        this._scene.meshes[12] as BABYLON.Mesh,
        this._scene.meshes[13] as BABYLON.Mesh,
        this._scene.meshes[14] as BABYLON.Mesh,
        this._scene.meshes[15] as BABYLON.Mesh,
        this._scene.meshes[16] as BABYLON.Mesh,
        this._scene.meshes[17] as BABYLON.Mesh,
    ], false, true, undefined, false, false);
 
    console.log(BABYLONSER.OBJExport.OBJ([mm!]));
 
    mm?.dispose();*/
    // Reset camera
    const camera = this._scene.activeCameras?.[0] ?? this._scene.activeCamera;
    if (camera) {
      camera.alpha = 2.62;
      camera.beta = 1.11;
      camera.radius = 8.4;
    }
    // Simulation parameters
    this._fluidRenderObject.object.particleSize = 0.08;
    this._fluidSim.smoothingRadius = 0.04;
    this._fluidSim.densityReference = 20000;
    this._fluidSim.pressureConstant = 4;
    this._fluidSim.viscosity = 0.005;
    this._fluidSim.maxVelocity = 10;
    this._fluidSim.maxAcceleration = 2000;
    this._shapeCollisionRestitution = 0.99;
    this._particleGenerator.position.x = 0.2;
    this._particleGenerator.position.y = 2.8;
    this._particleGenerator.position.z = -1.5;
    super._run();
  }
  dispose() {
    super.dispose();
    this._scene.onBeforeRenderObservable.remove(this._sceneRenderObserver);
  }
  _makeGUIMainMenu() {
    const params = {
      restart: () => {
        this._generateParticles();
      },
      meshname: this._meshName,
    };
    const mainMenu = this._gui;
    mainMenu.add(params, "restart").name("Restart");
    mainMenu
      .add(params, "meshname", ["Dragon", "High heels"])
      .name("Name")
      .onChange((value) => {
        this.disposeCollisionObject(this._collisionObjects.length - 1);
        this._addMesh(value, true);
      });
  }
}
class FluidSimulator {
  _particles;
  _numMaxParticles;
  _positions;
  _velocities;
  _hash;
  _smoothingRadius2;
  _poly6Constant;
  _spikyConstant;
  _viscConstant;
  _smoothingRadius = 0.2;
  get smoothingRadius() {
    return this._smoothingRadius;
  }
  set smoothingRadius(radius) {
    this._smoothingRadius = radius;
    this._computeConstants();
  }
  densityReference = 2000;
  pressureConstant = 20;
  viscosity = 0.005;
  gravity = new BABYLON.Vector3(0, -9.8, 0);
  minTimeStep = 1 / 100;
  maxVelocity = 75;
  maxAcceleration = 2000;
  currentNumParticles;
  _mass;
  get mass() {
    return this._mass;
  }
  set mass(m) {
    for (let i = 0; i < this._particles.length; ++i) {
      this._particles[i].mass = m;
    }
  }
  _computeConstants() {
    this._smoothingRadius2 = this._smoothingRadius * this._smoothingRadius;
    this._poly6Constant =
      315 / (64 * Math.PI * Math.pow(this._smoothingRadius, 9));
    this._spikyConstant =
      -45 / (Math.PI * Math.pow(this._smoothingRadius, 6));
    this._viscConstant =
      45 / (Math.PI * Math.pow(this._smoothingRadius, 6));
    this._hash = new Hash(this._smoothingRadius, this._numMaxParticles);
  }
  get positions() {
    return this._positions;
  }
  get velocities() {
    return this._velocities;
  }
  get numMaxParticles() {
    return this._numMaxParticles;
  }
  setParticleData(positions, velocities) {
    this._positions = positions ?? new Float32Array();
    this._velocities = velocities ?? new Float32Array();
    this._numMaxParticles = this._positions.length / 3;
    this._hash = new Hash(this._smoothingRadius, this._numMaxParticles);
    for (let i = this._particles.length; i < this._numMaxParticles; ++i) {
      this._particles.push({
        mass: this.mass,
        density: 0,
        pressure: 0,
        accelX: 0,
        accelY: 0,
        accelZ: 0,
      });
    }
  }
  constructor(positions, velocities, mass = 1) {
    this._positions = undefined;
    this._velocities = undefined;
    this._particles = [];
    this._numMaxParticles = 0;
    this._mass = mass;
    if (positions && velocities) {
      this.setParticleData(positions, velocities);
    }
    this._hash = new Hash(this._smoothingRadius, this._numMaxParticles);
    this.currentNumParticles = this._numMaxParticles;
    this._smoothingRadius2 = 0;
    this._poly6Constant = 0;
    this._spikyConstant = 0;
    this._viscConstant = 0;
    this._computeConstants();
  }
  update(deltaTime) {
    let timeLeft = deltaTime;
    while (timeLeft > 0) {
      this._hash.create(this._positions, this.currentNumParticles);
      this._computeDensityAndPressure();
      this._computeAcceleration();
      let timeStep = this._calculateTimeStep();
      timeLeft -= timeStep;
      if (timeLeft < 0) {
        timeStep += timeLeft;
        timeLeft = 0;
      }
      this._updatePositions(timeStep);
    }
  }
  dispose() {
    // nothing to do
  }
  _computeDensityAndPressure() {
    for (let a = 0; a < this.currentNumParticles; ++a) {
      const pA = this._particles[a];
      const paX = this._positions[a * 3 + 0];
      const paY = this._positions[a * 3 + 1];
      const paZ = this._positions[a * 3 + 2];
      pA.density = 0;
      this._hash.query(this._positions, a, this._smoothingRadius);
      for (let ib = 0; ib < this._hash.querySize; ++ib) {
        const b = this._hash.queryIds[ib];
        const diffX = paX - this._positions[b * 3 + 0];
        const diffY = paY - this._positions[b * 3 + 1];
        const diffZ = paZ - this._positions[b * 3 + 2];
        const r2 = diffX * diffX + diffY * diffY + diffZ * diffZ;
        if (r2 < this._smoothingRadius2) {
          const w = this._poly6Constant *
            Math.pow(this._smoothingRadius2 - r2, 3);
          pA.density += w;
        }
      }
      pA.density = Math.max(this.densityReference, pA.density);
      pA.pressure =
        this.pressureConstant * (pA.density - this.densityReference);
    }
  }
  _computeAcceleration() {
    // Pressurce-based acceleration + viscosity-based acceleration computation
    for (let a = 0; a < this.currentNumParticles; ++a) {
      const pA = this._particles[a];
      const paX = this._positions[a * 3 + 0];
      const paY = this._positions[a * 3 + 1];
      const paZ = this._positions[a * 3 + 2];
      const vaX = this._velocities[a * 3 + 0];
      const vaY = this._velocities[a * 3 + 1];
      const vaZ = this._velocities[a * 3 + 2];
      let pressureAccelX = 0;
      let pressureAccelY = 0;
      let pressureAccelZ = 0;
      let viscosityAccelX = 0;
      let viscosityAccelY = 0;
      let viscosityAccelZ = 0;
      this._hash.query(this._positions, a, this._smoothingRadius);
      for (let ib = 0; ib < this._hash.querySize; ++ib) {
        const b = this._hash.queryIds[ib];
        let diffX = paX - this._positions[b * 3 + 0];
        let diffY = paY - this._positions[b * 3 + 1];
        let diffZ = paZ - this._positions[b * 3 + 2];
        const r2 = diffX * diffX + diffY * diffY + diffZ * diffZ;
        const r = Math.sqrt(r2);
        if (r > 0 && r2 < this._smoothingRadius2) {
          const pB = this._particles[b];
          diffX /= r;
          diffY /= r;
          diffZ /= r;
          const w = this._spikyConstant *
            (this._smoothingRadius - r) *
            (this._smoothingRadius - r);
          const massRatio = pB.mass / pA.mass;
          const fp = w *
            ((pA.pressure + pB.pressure) /
              (2 * pA.density * pB.density)) *
            massRatio;
          pressureAccelX -= fp * diffX;
          pressureAccelY -= fp * diffY;
          pressureAccelZ -= fp * diffZ;
          const w2 = this._viscConstant * (this._smoothingRadius - r);
          const fv = w2 * (1 / pB.density) * massRatio * this.viscosity;
          viscosityAccelX += fv * (this._velocities[b * 3 + 0] - vaX);
          viscosityAccelY += fv * (this._velocities[b * 3 + 1] - vaY);
          viscosityAccelZ += fv * (this._velocities[b * 3 + 2] - vaZ);
        }
      }
      pA.accelX = pressureAccelX + viscosityAccelX;
      pA.accelY = pressureAccelY + viscosityAccelY;
      pA.accelZ = pressureAccelZ + viscosityAccelZ;
      pA.accelX += this.gravity.x;
      pA.accelY += this.gravity.y;
      pA.accelZ += this.gravity.z;
      const mag = Math.sqrt(pA.accelX * pA.accelX +
        pA.accelY * pA.accelY +
        pA.accelZ * pA.accelZ);
      if (mag > this.maxAcceleration) {
        pA.accelX = (pA.accelX / mag) * this.maxAcceleration;
        pA.accelY = (pA.accelY / mag) * this.maxAcceleration;
        pA.accelZ = (pA.accelZ / mag) * this.maxAcceleration;
      }
    }
  }
  _calculateTimeStep() {
    let maxVelocity = 0;
    let maxAcceleration = 0;
    let maxSpeedOfSound = 0;
    for (let a = 0; a < this.currentNumParticles; ++a) {
      const pA = this._particles[a];
      const velSq = this._velocities[a * 3 + 0] * this._velocities[a * 3 + 0] +
        this._velocities[a * 3 + 1] * this._velocities[a * 3 + 1] +
        this._velocities[a * 3 + 2] * this._velocities[a * 3 + 2];
      const accSq = pA.accelX * pA.accelX +
        pA.accelY * pA.accelY +
        pA.accelZ * pA.accelZ;
      const spsSq = pA.density < 0.00001 ? 0 : pA.pressure / pA.density;
      if (velSq > maxVelocity) {
        maxVelocity = velSq;
      }
      if (accSq > maxAcceleration) {
        maxAcceleration = accSq;
      }
      if (spsSq > maxSpeedOfSound) {
        maxSpeedOfSound = spsSq;
      }
    }
    maxVelocity = Math.sqrt(maxVelocity);
    maxAcceleration = Math.sqrt(maxAcceleration);
    maxSpeedOfSound = Math.sqrt(maxSpeedOfSound);
    const velStep = (0.4 * this.smoothingRadius) / Math.max(1, maxVelocity);
    const accStep = 0.4 * Math.sqrt(this.smoothingRadius / maxAcceleration);
    const spsStep = this.smoothingRadius / maxSpeedOfSound;
    return Math.max(this.minTimeStep, Math.min(velStep, accStep, spsStep));
  }
  _updatePositions(deltaTime) {
    for (let a = 0; a < this.currentNumParticles; ++a) {
      const pA = this._particles[a];
      this._velocities[a * 3 + 0] += pA.accelX * deltaTime;
      this._velocities[a * 3 + 1] += pA.accelY * deltaTime;
      this._velocities[a * 3 + 2] += pA.accelZ * deltaTime;
      const mag = Math.sqrt(this._velocities[a * 3 + 0] * this._velocities[a * 3 + 0] +
        this._velocities[a * 3 + 1] * this._velocities[a * 3 + 1] +
        this._velocities[a * 3 + 2] * this._velocities[a * 3 + 2]);
      if (mag > this.maxVelocity) {
        this._velocities[a * 3 + 0] =
          (this._velocities[a * 3 + 0] / mag) * this.maxVelocity;
        this._velocities[a * 3 + 1] =
          (this._velocities[a * 3 + 1] / mag) * this.maxVelocity;
        this._velocities[a * 3 + 2] =
          (this._velocities[a * 3 + 2] / mag) * this.maxVelocity;
      }
      this._positions[a * 3 + 0] +=
        deltaTime * this._velocities[a * 3 + 0];
      this._positions[a * 3 + 1] +=
        deltaTime * this._velocities[a * 3 + 1];
      this._positions[a * 3 + 2] +=
        deltaTime * this._velocities[a * 3 + 2];
    }
  }
}
class ParticleGenerator {
  _scene;
  _observer;
  _currNumParticles;
  _numCrossSection;
  _numParticles = 0;
  _positions;
  _velocities;
  _loadFromFile;
  particleRadius;
  position;
  get currNumParticles() {
    return this._currNumParticles;
  }
  get positions() {
    return this._positions;
  }
  get velocities() {
    return this._velocities;
  }
  constructor(scene, loadFromFile) {
    this._scene = scene;
    this._currNumParticles = 0;
    this._numCrossSection = 0;
    this._positions = new Float32Array();
    this._velocities = new Float32Array();
    this.particleRadius = 0;
    this._loadFromFile = loadFromFile;
    this.position = new BABYLON.Vector3(0, 0, 0);
    if (!this._loadFromFile) {
      this._observer = scene.onBeforeRenderObservable.add(() => {
        if (this._currNumParticles === 0) {
          if (this._positions.length / 3 >= this._numCrossSection) {
            this._currNumParticles = this._numCrossSection;
          }
        }
        else if (this._currNumParticles < this._numParticles) {
          const px1 = this._positions[this._currNumParticles * 3 + 0];
          const py1 = this._positions[this._currNumParticles * 3 + 1];
          const pz1 = this._positions[this._currNumParticles * 3 + 2];
          const px2 = this._positions[(this._currNumParticles - this._numCrossSection) *
            3 +
            0];
          const py2 = this._positions[(this._currNumParticles - this._numCrossSection) *
            3 +
            1];
          const pz2 = this._positions[(this._currNumParticles - this._numCrossSection) *
            3 +
            2];
          const dist = Math.sqrt((px1 - px2) * (px1 - px2) +
            (py1 - py2) * (py1 - py2) +
            (pz1 - pz2) * (pz1 - pz2));
          if (dist > this.particleRadius * 2) {
            this._currNumParticles += this._numCrossSection;
          }
        }
      });
    }
    else {
      this._observer = null;
    }
  }
  async generateParticles(numTotParticles, regenerateAll = true) {
    if (this._loadFromFile) {
      await this._generateParticlesFromFile(this._loadFromFile);
    }
    else {
      this._generateParticles(numTotParticles, regenerateAll);
    }
  }
  async _generateParticlesFromFile(fileName) {
    const data = await (await fetch(`https://popov72.github.io/FluidRendering/src/assets/particles/${fileName}.txt`)).text();
    const lines = data.replace("\r", "").split("\n");
    const particlePos = [];
    const particleVel = [];
    let numParticles = 0;
    for (let i = 1; i < lines.length; ++i) {
      const line = lines[i];
      const vals = line.split(",");
      if (line.charAt(0) === '"' || vals.length < 4) {
        continue;
      }
      particlePos.push(parseFloat(vals[1]) + this.position.x, parseFloat(vals[2]) + +this.position.y, parseFloat(vals[3]) + this.position.z);
      particleVel.push(0, 0, 0);
      numParticles++;
    }
    const particleStartIndex = 0;
    this._numParticles = this._numCrossSection = numParticles;
    if (this._numParticles > this._positions.length / 3) {
      const newPositions = new Float32Array(this._numParticles * 3);
      const newVelocities = new Float32Array(this._numParticles * 3);
      newPositions.set(this._positions, 0);
      newVelocities.set(this._velocities, 0);
      this._positions = newPositions;
      this._velocities = newVelocities;
    }
    this._positions.set(particlePos, particleStartIndex * 3);
    this._velocities.set(particleVel, particleStartIndex * 3);
    this._currNumParticles = this._numParticles;
  }
  _generateParticles(numTotParticles, regenerateAll = true) {
    if (this._numParticles >= numTotParticles && !regenerateAll) {
      this._numParticles = numTotParticles;
      this._currNumParticles = Math.min(this._currNumParticles, this._numParticles);
      return;
    }
    const dimX = 12, dimY = 12;
    const particlePos = [];
    const particleVel = [];
    const distance = this.particleRadius * 2;
    const jitter = distance * 0.1;
    const getJitter = () => Math.random() * jitter - jitter / 2;
    const particleStartIndex = regenerateAll ? 0 : this._currNumParticles;
    this._numParticles = particleStartIndex;
    while (this._numParticles <= numTotParticles - this._numCrossSection) {
      let yCoord = (dimY / 2) * distance;
      this._numCrossSection = 0;
      for (let y = 1; y < dimY - 1; ++y) {
        const angle = (y * Math.PI) / (dimY - 1);
        let x2 = ((Math.sin(angle) * dimX) / 2) * distance;
        if (x2 < 0) {
          x2 = 0;
        }
        let xCoord = -x2;
        while (xCoord <= x2) {
          const xc = xCoord === -x2 || xCoord + distance > x2
            ? xCoord
            : xCoord + getJitter();
          const yc = xCoord === -x2 || xCoord + distance > x2
            ? yCoord
            : yCoord + getJitter();
          const zCoord = xCoord === -x2 || xCoord + distance > x2
            ? 0.49
            : 0.49 + getJitter();
          particlePos.push(xc + this.position.x, yc + this.position.y, zCoord + this.position.z);
          particleVel.push((Math.random() - 0.5) * 0.03, (Math.random() - 0.5) * 0.03, (Math.random() - 1.0) * 0.03 - 1.5);
          xCoord += distance;
          this._numParticles++;
          this._numCrossSection++;
        }
        yCoord += distance;
      }
    }
    if (this._numParticles > this._positions.length / 3) {
      const newPositions = new Float32Array(this._numParticles * 3);
      const newVelocities = new Float32Array(this._numParticles * 3);
      newPositions.set(this._positions, 0);
      newVelocities.set(this._velocities, 0);
      this._positions = newPositions;
      this._velocities = newVelocities;
    }
    this._positions.set(particlePos, particleStartIndex * 3);
    this._velocities.set(particleVel, particleStartIndex * 3);
    this._currNumParticles = particleStartIndex;
  }
  dispose() {
    this._scene.onBeforeRenderObservable.remove(this._observer);
    this._observer = null;
  }
}
/**
 * From https://github.com/matthias-research/pages/blob/master/tenMinutePhysics/11-hashing.html
 */
class Hash {
  _spacing;
  _tableSize;
  _cellStart;
  _cellEntries;
  _queryIds;
  _querySize;
  get querySize() {
    return this._querySize;
  }
  get queryIds() {
    return this._queryIds;
  }
  constructor(spacing, maxNumObjects) {
    this._spacing = spacing;
    this._tableSize = 2 * maxNumObjects;
    this._cellStart = new Int32Array(this._tableSize + 1);
    this._cellEntries = new Int32Array(maxNumObjects);
    this._queryIds = new Int32Array(maxNumObjects);
    this._querySize = 0;
  }
  hashCoords(xi, yi, zi) {
    const h = (xi * 92837111) ^ (yi * 689287499) ^ (zi * 283923481); // fantasy function
    //const h = (xi * 73856093) ^ (yi * 19349663) ^ (zi * 83492791); // fantasy function
    return Math.abs(h) % this._tableSize;
  }
  intCoord(coord) {
    return Math.floor(coord / this._spacing);
  }
  hashPos(pos, nr) {
    return this.hashCoords(this.intCoord(pos[3 * nr]), this.intCoord(pos[3 * nr + 1]), this.intCoord(pos[3 * nr + 2]));
  }
  create(pos, numElements) {
    numElements = numElements ?? pos.length / 3;
    const numObjects = Math.min(numElements, this._cellEntries.length);
    // determine cell sizes
    this._cellStart.fill(0);
    this._cellEntries.fill(0);
    for (let i = 0; i < numObjects; i++) {
      const h = this.hashPos(pos, i);
      this._cellStart[h]++;
    }
    // determine cells starts
    let start = 0;
    for (let i = 0; i < this._tableSize; i++) {
      start += this._cellStart[i];
      this._cellStart[i] = start;
    }
    this._cellStart[this._tableSize] = start; // guard
    // fill in objects ids
    for (let i = 0; i < numObjects; i++) {
      const h = this.hashPos(pos, i);
      this._cellStart[h]--;
      this._cellEntries[this._cellStart[h]] = i;
    }
  }
  query(pos, nr, maxDist) {
    const x0 = this.intCoord(pos[3 * nr] - maxDist);
    const y0 = this.intCoord(pos[3 * nr + 1] - maxDist);
    const z0 = this.intCoord(pos[3 * nr + 2] - maxDist);
    const x1 = this.intCoord(pos[3 * nr] + maxDist);
    const y1 = this.intCoord(pos[3 * nr + 1] + maxDist);
    const z1 = this.intCoord(pos[3 * nr + 2] + maxDist);
    this._querySize = 0;
    for (let xi = x0; xi <= x1; xi++) {
      for (let yi = y0; yi <= y1; yi++) {
        for (let zi = z0; zi <= z1; zi++) {
          const h = this.hashCoords(xi, yi, zi);
          const start = this._cellStart[h];
          const end = this._cellStart[h + 1];
          for (let i = start; i < end; i++) {
            this._queryIds[this._querySize] = this._cellEntries[i];
            this._querySize++;
          }
        }
      }
    }
  }
}
// Textures from https://freepbr.com/materials/sulphuric-rock/
const rockBaseColor = "https://popov72.github.io/FluidRendering/src/assets/materials/sulphuric-rock_albedo.png";
const rockRoughness = "https://popov72.github.io/FluidRendering/src/assets/materials/sulphuric-rock_roughness.png";
const rockNormal = "https://popov72.github.io/FluidRendering/src/assets/materials/sulphuric-rock_normal-ogl.png";
const marbleBaseColor = "https://popov72.github.io/FluidRendering/src/assets/materials/Marble08_1K_BaseColor.png";
const eps = 0.0001;
const eps1 = new BABYLON.Vector3(eps, -eps, -eps);
const eps2 = new BABYLON.Vector3(-eps, -eps, eps);
const eps3 = new BABYLON.Vector3(-eps, eps, -eps);
const eps4 = new BABYLON.Vector3(eps, eps, eps);
const dir1 = new BABYLON.Vector3(1, -1, -1);
const dir2 = new BABYLON.Vector3(-1, -1, 1);
const dir3 = new BABYLON.Vector3(-1, 1, -1);
const dir4 = new BABYLON.Vector3(1, 1, 1);
class SDFHelper {
  static CreateBox(scene, shape, extents) {
    const box = BABYLON.MeshBuilder.CreateBox("box", {
      width: extents.x * 2,
      height: extents.y * 2,
      depth: extents.z * 2,
    }, scene);
    const material = new BABYLON.PBRMaterial("boxMat", scene);
    material.metallic = 0;
    material.roughness = 0.9;
    material.albedoTexture = new BABYLON.Texture("textures/wood.jpg", scene);
    material.cullBackFaces = true;
    box.material = material;
    return Promise.resolve(box);
  }
  static CreateSphere(scene, shape, s) {
    const sphere = BABYLON.MeshBuilder.CreateSphere("sphere", { diameter: s * 2, segments: 16 }, scene);
    const material = new BABYLON.PBRMaterial("sphereMat", scene);
    material.metallic = 1;
    material.roughness = 0.05;
    material.albedoTexture = new BABYLON.Texture(marbleBaseColor, scene);
    material.cullBackFaces = true;
    sphere.material = material;
    return Promise.resolve(sphere);
  }
  static CreateCutHollowSphere(scene, shape, radius, planeDist, thickness, segments) {
    thickness = thickness / radius;
    const sphere = BABYLON.MeshBuilder.CreateSphere("sphere", { diameter: radius * 2, segments }, scene);
    const plane = BABYLON.MeshBuilder.CreatePlane("plane", { size: radius * 2 }, scene);
    plane.rotation.y = Math.PI / 2;
    plane.position.x = planeDist;
    const csg1 = BABYLON.CSG.FromMesh(sphere);
    const csgp = BABYLON.CSG.FromMesh(plane);
    sphere.dispose();
    plane.dispose();
    csg1.subtractInPlace(csgp);
    const mesh = csg1.toMesh("sppl");
    mesh.computeWorldMatrix(true);
    mesh.refreshBoundingInfo();
    mesh.scaling.setAll(1 - thickness);
    mesh.position.x =
      mesh.getBoundingInfo().boundingBox.maximumWorld.x * thickness;
    const csg2 = BABYLON.CSG.FromMesh(mesh);
    mesh.dispose();
    csg1.subtractInPlace(csg2);
    const meshFinal = csg1.toMesh("cutHollowSphere");
    meshFinal.rotation.z = Math.PI / 2;
    meshFinal.bakeCurrentTransformIntoVertices();
    const material = new BABYLON.PBRMaterial("cutHollowSphereMat", scene);
    material.metallic = 1;
    material.roughness = 0.05;
    material.albedoTexture = new BABYLON.Texture(marbleBaseColor, scene);
    material.cullBackFaces = true;
    meshFinal.material = material;
    return Promise.resolve(meshFinal);
  }
  static CreateVerticalCylinder(scene, shape, r, h, segments) {
    const cylinder = BABYLON.MeshBuilder.CreateCylinder("cylinder", { diameter: r * 2, height: h, tessellation: segments }, scene);
    const material = new BABYLON.PBRMaterial("cylinderMat", scene);
    material.metallic = 1;
    material.roughness = 0.05;
    material.albedoTexture = new BABYLON.Texture(marbleBaseColor, scene);
    material.cullBackFaces = true;
    cylinder.material = material;
    return Promise.resolve(cylinder);
  }
  static CreateTerrain(scene, shape, size) {
    const ground = BABYLON.MeshBuilder.CreateGroundFromHeightMap("terrain", "textures/heightMap.png", {
      width: size,
      height: size,
      subdivisions: 128,
      maxHeight: size / 5,
      onReady: () => ground.updateCoordinateHeights(),
    }, scene);
    const mat = new BABYLON.PBRMaterial("mat", scene);
    mat.metallicTexture = new BABYLON.Texture(rockRoughness, scene);
    mat.albedoTexture = new BABYLON.Texture(rockBaseColor, scene);
    mat.bumpTexture = new BABYLON.Texture(rockNormal, scene);
    mat.useRoughnessFromMetallicTextureGreen = true;
    mat.metallic = 0;
    mat.roughness = 1;
    ground.material = mat;
    shape.params.push(ground);
    return Promise.resolve(ground);
  }
  static _ParseSDFData(textData) {
    const lines = textData.replace("\r", "").split("\n");
    const dimLine = lines[0].split(" ");
    const dimX = parseFloat(dimLine[0]);
    const dimY = parseFloat(dimLine[1]);
    const dimZ = parseFloat(dimLine[2]);
    const originLine = lines[1].split(" ");
    const origin = new BABYLON.Vector3(parseFloat(originLine[0]), parseFloat(originLine[1]), parseFloat(originLine[2]));
    const step = parseFloat(lines[2]);
    const data = [];
    for (let i = 3; i < lines.length; ++i) {
      const val = lines[i];
      if (val.length === 0) {
        continue;
      }
      data.push(parseFloat(val));
    }
    return {
      dimX,
      dimY,
      dimZ,
      origin,
      step,
      data,
    };
  }
  static CreateMesh(scene, shape, meshFilename, sdfFilename, createNormals) {
    return new Promise((resolve) => {
      const promises = [
        BABYLON.SceneLoader.ImportMeshAsync("", assetsDir + "scenes/", meshFilename, scene),
        new Promise((resolve) => {
          fetch(assetsDir + "sdf/" + sdfFilename).then((response) => {
            response.text().then((text) => {
              shape.params.push(SDFHelper._ParseSDFData(text));
              resolve(void 0);
            });
          });
        }),
      ];
      Promise.all(promises).then((results) => {
        const meshes = results[0];
        const mesh = meshes.meshes[0];
        if (!mesh.material) {
          const material = new BABYLON.PBRMaterial("meshMat", scene);
          material.metallic = 1;
          material.roughness = 0.05;
          material.albedoTexture = new BABYLON.Texture(rockBaseColor, scene);
          material.cullBackFaces = true;
          mesh.material = material;
        }
        if (createNormals) {
          mesh.createNormals(false);
        }
        mesh.scaling.setAll(shape.scale);
        resolve(mesh);
      });
    });
  }
  // SD functions from https://iquilezles.org/articles/distfunctions/
  static SDBox(p, b) {
    const q = BABYLON.TmpVectors.Vector3[0];
    q.copyFromFloats(Math.abs(p.x), Math.abs(p.y), Math.abs(p.z));
    q.subtractInPlace(b);
    const tmp = Math.min(Math.max(q.x, q.y, q.z), 0);
    q.maximizeInPlaceFromFloats(0, 0, 0);
    return q.length() + tmp;
  }
  static SDSphere(p, s) {
    return p.length() - s;
  }
  static SDPlane(p, n, h) {
    return BABYLON.Vector3.Dot(p, n) + h;
  }
  static SDCutHollowSphere(p, r, h, t) {
    // sampling independent computations (only depend on shape)
    const w = Math.sqrt(r * r - h * h);
    // sampling dependant computations
    const qx = Math.sqrt(p.x * p.x + p.z * p.z);
    const qy = p.y;
    if (h * qx < w * qy) {
      return Math.sqrt((qx - w) * (qx - w) + (qy - h) * (qy - h));
    }
    return Math.abs(Math.sqrt(qx * qx + qy * qy) - r) - t;
  }
  static SDVerticalCylinder(p, r, h) {
    const dx = Math.abs(Math.sqrt(p.x * p.x + p.z * p.z)) - r;
    const dy = Math.abs(p.y) - h;
    const dx2 = Math.max(dx, 0);
    const dy2 = Math.max(dy, 0);
    return (Math.min(Math.max(dx, dy), 0.0) + Math.sqrt(dx2 * dx2 + dy2 * dy2));
  }
  static SDTerrain(p, size, terrain) {
    return p.y - terrain.getHeightAtCoordinates(p.x, p.z);
  }
  static SDMesh(p, meshFilename, sdfFilename, createNormals, sdf) {
    const x = (p.x - sdf.origin.x) / sdf.step;
    const y = (p.y - sdf.origin.y) / sdf.step;
    const z = (p.z - sdf.origin.z) / sdf.step;
    let gx = Math.floor(x);
    let gy = Math.floor(y);
    let gz = Math.floor(z);
    gx = Math.max(Math.min(gx, sdf.dimX - 2), 0);
    gy = Math.max(Math.min(gy, sdf.dimY - 2), 0);
    gz = Math.max(Math.min(gz, sdf.dimZ - 2), 0);
    // trilinear filtering
    const fx = x - gx;
    const fy = y - gy;
    const fz = z - gz;
    const a00 = sdf.data[gz * sdf.dimY * sdf.dimX + gy * sdf.dimX + gx];
    const a10 = sdf.data[gz * sdf.dimY * sdf.dimX + gy * sdf.dimX + gx + 1];
    const a11 = sdf.data[gz * sdf.dimY * sdf.dimX + (gy + 1) * sdf.dimX + gx + 1];
    const a01 = sdf.data[gz * sdf.dimY * sdf.dimX + (gy + 1) * sdf.dimX + gx];
    const a0 = a00 * (1 - fx) + a10 * fx;
    const a1 = a01 * (1 - fx) + a11 * fx;
    const a = a0 * (1 - fy) + a1 * fy;
    const b00 = sdf.data[(gz + 1) * sdf.dimY * sdf.dimX + gy * sdf.dimX + gx];
    const b10 = sdf.data[(gz + 1) * sdf.dimY * sdf.dimX + gy * sdf.dimX + gx + 1];
    const b11 = sdf.data[(gz + 1) * sdf.dimY * sdf.dimX + (gy + 1) * sdf.dimX + gx + 1];
    const b01 = sdf.data[(gz + 1) * sdf.dimY * sdf.dimX + (gy + 1) * sdf.dimX + gx];
    const b0 = b00 * (1 - fx) + b10 * fx;
    const b1 = b01 * (1 - fx) + b11 * fx;
    const b = b0 * (1 - fy) + b1 * fy;
    const d = a * (1 - fz) + b * fz;
    //const d = sdf.data[gz * sdf.dimY * sdf.dimX + gy * sdf.dimX + gx];
    return d;
  }
  // normal computed with the Tetrahedron technique, see https://iquilezles.org/articles/normalsSDF/
  static ComputeSDFNormal(pos, shape, normal) {
    const posTemp = BABYLON.TmpVectors.Vector3[5];
    const dir = BABYLON.TmpVectors.Vector3[6];
    normal.copyFromFloats(0, 0, 0);
    posTemp.copyFrom(pos);
    dir.copyFrom(dir1);
    normal.addInPlace(dir.scaleInPlace(shape.sdEvaluate(posTemp.addInPlace(eps1), ...shape.params)));
    posTemp.copyFrom(pos);
    dir.copyFrom(dir2);
    normal.addInPlace(dir.scaleInPlace(shape.sdEvaluate(posTemp.addInPlace(eps2), ...shape.params)));
    posTemp.copyFrom(pos);
    dir.copyFrom(dir3);
    normal.addInPlace(dir.scaleInPlace(shape.sdEvaluate(posTemp.addInPlace(eps3), ...shape.params)));
    posTemp.copyFrom(pos);
    dir.copyFrom(dir4);
    normal.addInPlace(dir.scaleInPlace(shape.sdEvaluate(posTemp.addInPlace(eps4), ...shape.params)));
    BABYLON.Vector3.TransformNormalToRef(normal, shape.transf, normal);
    normal.normalize();
  }
  static ComputeTerrainNormal(pos, shape, normal) {
    const terrain = shape.params[1];
    terrain.getNormalAtCoordinatesToRef(pos.x, pos.z, normal);
  }
}
createScene = function () { return Playground.CreateScene(engine, engine.getRenderingCanvas()); }
window.initFunction = async function () {


  var asyncEngineCreation = async function () {
    try {
      return createDefaultEngine();
    } catch (e) {
      console.log("the available createEngine function failed. Creating the default engine instead");
      return createDefaultEngine();
    }
  }

  window.engine = await asyncEngineCreation();
  if (!engine) throw 'engine should not be null.';
  startRenderLoop(engine, canvas);
  window.scene = createScene();
};
initFunction().then(() => {
  scene.then(returnedScene => { sceneToRender = returnedScene; });

});

// Resize
window.addEventListener("resize", function () {
  engine.resize();
});