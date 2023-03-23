import * as BABYLON from "@babylonjs/core";

import { FluidSimulationDemoBase } from "./fluidSimulationDemoBase";
import { FluidRenderingObjectParticleSystem } from "./FluidRenderer/fluidRenderingObjectParticleSystem";

import flareImg from "../assets/pictures/flare32bits.png";

export class FluidSimulationDemoParticleSystem extends FluidSimulationDemoBase {
    private _particleSystem: BABYLON.Nullable<BABYLON.ParticleSystem>;

    constructor(scene: BABYLON.Scene) {
        super(scene, true);

        this._particleSystem = null;
    }

    protected async _run() {
        const camera =
            this._scene.activeCameras?.[0] ?? this._scene.activeCamera;

        if (camera) {
            (camera as BABYLON.ArcRotateCamera).alpha = 0;
            (camera as BABYLON.ArcRotateCamera).beta = Math.PI / 2.4;
            (camera as BABYLON.ArcRotateCamera).radius = 30;
        }

        const numParticles = 20000 * 2; // 同时存活的最大粒子数
        const numParticlesEmitRate = 1500 * 2; // 粒子发射速率

        // Create a particle system
        this._particleSystem = new BABYLON.ParticleSystem(
            "particles",
            numParticles,
            this._scene
        );

        // Texture of each particle
        this._particleSystem.particleTexture = new BABYLON.Texture(
            flareImg,
            this._scene
        );
        this._particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;

        // Where the particles come from
        this._particleSystem.createConeEmitter(4, Math.PI / 2);

        // Colors of all particles
        this._particleSystem.color1 = new BABYLON.Color4(0.4, 1.5, 0.3, 1.0);
        this._particleSystem.color2 = new BABYLON.Color4(0.4, 1.5, 0.3, 1.0);
        this._particleSystem.colorDead = new BABYLON.Color4(0, 0, 0.2, 0.0);
        this._particleSystem.colorDead = new BABYLON.Color4(0.4, 1.0, 0.3, 1.0);

        // Size of each particle (random between...  每个粒子的大小
        this._particleSystem.minSize = 0.5 * 1.5;
        this._particleSystem.maxSize = 0.5 * 1.5;

        // Life time of each particle (random between...  每个粒子的寿命
        this._particleSystem.minLifeTime = 2.0;
        this._particleSystem.maxLifeTime = 2.5;

        // Emission rate  粒子发射速率
        this._particleSystem.emitRate = numParticlesEmitRate;

        // Set the gravity of all particles  设置所有粒子的重力
        this._particleSystem.gravity = new BABYLON.Vector3(0, -10.81, 0);

        // Speed
        this._particleSystem.minEmitPower = 2.5; // 发射粒子的最小功率。
        this._particleSystem.maxEmitPower = 6.5; // 发射粒子的最大功率。
        this._particleSystem.updateSpeed = 0.02; // 整体运动速度（0.01为默认更新速度，更快的更新=更快的动画）

        // Start the particle system
        this._particleSystem.preWarmCycles = 60 * 8; // 获取或设置一个值，该值指示在第一次渲染之前必须执行多少周期（或帧）（必须在启动系统之前设置该值）。默认值为0

        this._particleSystem.start();

        this._particleSystem.renderAsFluid = true;

        this._fluidRenderer.removeRenderObject(this._fluidRenderObject, true);

        this._fluidRenderObject =
            this._fluidRenderer!.getRenderObjectFromParticleSystem(
                this._particleSystem
            )!;

        this._fluidRenderObject.object.particleSize = 0.75;
        this._fluidRenderObject.object.particleThicknessAlpha = 0.02;
        (
            this._fluidRenderObject.object as FluidRenderingObjectParticleSystem
        ).useTrueRenderingForDiffuseTexture = true;
        this._fluidRenderObject.targetRenderer.minimumThickness =
            this._fluidRenderObject.object.particleThicknessAlpha;
        this._fluidRenderObject.targetRenderer.blurDepthFilterSize = 10;
        this._fluidRenderObject.targetRenderer.blurDepthDepthScale = 10;
        this._fluidRenderObject.targetRenderer.thicknessMapSize = 1024;
        this._fluidRenderObject.targetRenderer.density = 8;
        this._fluidRenderObject.targetRenderer.fresnelClamp = 0.04;
        this._fluidRenderObject.targetRenderer.fluidColor = new BABYLON.Color3(
            219 / 255,
            228 / 255,
            1
        );
        this._fluidRenderObject.targetRenderer.generateDiffuseTexture = false;

        super._run();
    }

    public dispose() {
        super.dispose();

        this._particleSystem?.dispose();
    }

    protected _makeGUIMainMenu(): void {
        const params = {
            paused: false,
        };

        const mainMenu = this._gui!;

        mainMenu
            .add(params, "paused")
            .name("Pause")
            .onChange((value: boolean) => {
                this._particleSystem!.updateSpeed = value ? 0 : 0.02;
            });
    }
}
