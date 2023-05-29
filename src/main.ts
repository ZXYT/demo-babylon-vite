import "./style.css"; // 引入样式文件
import "@babylonjs/loaders"; // 引入 Babylon.js 加载器
import { Engine } from "@babylonjs/core/Engines/engine";
import { WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";
import { FluidRendering } from "./scenes/fluidSimulation2"; // 自定义场景
import { Inspector } from "@babylonjs/inspector"; // 引入 Babylon.js Inspector
let seed = 1;
// 重写 Math.random 方法，保证每次得到的随机数列相同
Math.random = function () {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
};
// Babylon.js 场景初始化函数
export const babylonInit = async (): Promise<void> => {
  // 获取 canvas 元素
  const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
  let engine: Engine;
  const webgpuSupported = await WebGPUEngine.IsSupportedAsync;
  if (webgpuSupported) {
    engine = new WebGPUEngine(canvas);
    await (engine as WebGPUEngine).initAsync();
  } else {
    engine = new Engine(canvas, true);
  }
  const createSceneModule = new FluidRendering(); // 创建自定义场景实例
  const scene = await createSceneModule.createScene(engine, canvas); // 创建场景
  // Inspector.Show(scene, {}); // 显示 Inspector，调试工具
  // 注册 render loop，循环渲染场景
  engine.runRenderLoop(function () {
    scene.render();
  });
  // 监听窗口/画布大小变化事件
  window.addEventListener("resize", function () {
    engine.resize();
  });
};
babylonInit().then(() => {
  // 场景开始渲染，一切初始化完成
});
