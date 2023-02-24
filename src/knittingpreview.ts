"use strict";

import * as THREE from 'three'
// @ts-ignore
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
// @ts-ignore
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

//import Detector from "three/examples/js/Detector.js"; 

import { Pattern } from './pattern';

export class KnittingPreview {
    material: THREE.MeshBasicMaterial;
    scene: THREE.Scene;
    canvas: HTMLCanvasElement;
    colors: string[];
    pattern: Pattern[];
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    last_resize: Date;
    repeatY: boolean;
    prerender: { colors: any; canvases: any; } | null = null;
    image_base: HTMLImageElement;
    color_to_image: { [x: string]: HTMLElement };
    maskHeight = 7 * 4;
    maskWidth = 8 * 4;

    constructor(element: HTMLElement, pattern: Pattern[], colors: string[]) {
        this.canvas = this.createCanvas();
        this.material = new THREE.MeshBasicMaterial({
            side: THREE.DoubleSide
        });
        this.scene = new THREE.Scene();
        this.colors = []
        this.pattern = []
        this.camera = new THREE.PerspectiveCamera(50, 1000 / 1000, 1, 2000);
        this.renderer = new THREE.WebGLRenderer({
            antialias: true
        });
        this.last_resize = new Date();
        this.repeatY = false;
        this.color_to_image = {}

        this.image_base = new Image(this.maskWidth, this.maskHeight);
        this.image_base.src = 'patterns2.png';
        this.image_base.onload = () => {
            for (let color of colors) {
                this.color_to_image[color] = this.image_base!!
            }
            this.init(element, pattern, colors)
        }
    }

    init(element: HTMLElement, pattern: Pattern[], colors: string[]) {
        this.colors = colors;
        this.pattern = pattern;
        this.drawCanvas(this.canvas, this.pattern, this.colors, this.repeatY);
        /*if (!Detector.webgl) {
            // Backup for non-webgl-supporting browsers
            element.appendChild(this.canvas);
            return;
        }*/

        this.camera.position.z = 5;
        this.camera.position.y = 5;
        //camera.lookAt(0, 0, 0);

        this.scene.background = new THREE.Color(0xf8f5f2);

        let loader = new GLTFLoader();
        loader.load("sweater_3.gltf", (gltf: { scene: { children: { geometry: any; }[]; }; }) => {
            console.log(gltf.scene.children[0])
            let geometry = gltf.scene.children[0].geometry
            let mesh = new THREE.Mesh(geometry, this.material);
            mesh.position.y = -1;
            mesh.scale.set(5, 5, 5)
            this.scene.add(mesh);
        });

        const light = new THREE.AmbientLight(0xFFFFFF); // soft white light
        this.scene.add(light);

        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(1024, 1024, false);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);

        element.appendChild(this.renderer.domElement);

        this.material.map = new THREE.Texture(this.canvas);
        this.material.map.wrapS = THREE.RepeatWrapping;
        this.material.map.flipY = false;

        this.material.map.needsUpdate = true;

        this.renderer.render(this.scene, this.camera);

        requestAnimationFrame(() => {
            this.resize();
            this.animate();
        });
    }

    resize() {
        if (this.renderer.domElement.parentNode === null) {
            return;
        }

        let displayWidth = (this.renderer.domElement.parentNode as HTMLElement).clientWidth;
        let displayHeight = (this.renderer.domElement.parentNode as HTMLElement).clientHeight;

        // Check if the canvas is not the same size.
        if (
            this.renderer.domElement.width != displayWidth ||
            this.renderer.domElement.height != displayHeight
        ) {
            this.camera.aspect = displayWidth / displayHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(displayWidth, displayHeight, false);
        }
        this.last_resize = new Date();
    }

    animate() {
        setTimeout(() => {
            requestAnimationFrame(() => this.animate());
        }, 1000 / 30);
        if (new Date().getTime() - this.last_resize.getTime() > 1000) {
            this.resize();
        }
        this.renderer.render(this.scene, this.camera);
    }
    cleanup() {
        // TODO
    }
    getScreenshot() {
        // Removed for now
    }
    downloadPatternScreenshot() {
        var img = this.canvas.toDataURL("image/png");
        document.write('<img src="' + img + '"/>');
    }
    updateCanvas() {
        if (this.canvas) {
            requestAnimationFrame(() => {
                this.drawCanvas(this.canvas, this.pattern, this.colors, this.repeatY);
                this.material.map!!.needsUpdate = true;
            });
        }
    }
    updatePattern(pattern: Pattern[]) {
        this.pattern = pattern;
        this.updateCanvas();
    }
    updateColors(colors: string[]) {
        this.colors = colors;
        this.updateCanvas();
    }
    setRepeatY(repeatY: any) {
        this.repeatY = repeatY;
        this.updateCanvas();
    }

    createCanvas() {
        let canvas = document.createElement("canvas");
        canvas.width = 1024 * 4;
        canvas.height = 1024 * 4;

        return canvas;
    }

    createPrerender(colors: any[]) {
        let canvases = colors.map((color) => {
            return this.prerenderCanvas(this.maskWidth, this.maskHeight, color);
        });

        return {
            canvases,
            colors
        };
    }

    drawCanvas(canvas: { getContext: (arg0: string) => any; height: number; }, patterns: Pattern[], colors: any[], repeatY: boolean) {
        if (this.prerender === null || this.prerender.colors !== colors) {
            this.prerender = this.createPrerender(colors);
        }

        let ctx = canvas.getContext("2d");

        for (let pattern of patterns) {
            let patternHeight = pattern.pattern.length;
            let patternWidth = pattern.pattern[0].length;

            let width = pattern.corner2X - pattern.corner1X;
            let height = pattern.corner2Y - pattern.corner1Y;

            let mask_n_x = Math.floor(width / this.maskWidth);
            let mask_n_y = Math.floor(height / this.maskHeight);

            for (let x = 0; x < mask_n_x; x++) {
                for (let y = 0; y < mask_n_y; y++) {
                    let color;
                    let y_;
                    if (repeatY) {
                        y_ = y % patternHeight;
                    } else {
                        y_ = y;
                    }
                    if (pattern.pattern[y_]) {
                        color = pattern.pattern[y_][x % patternWidth];
                    } else {
                        color = 0;
                    }
                    ctx.drawImage(
                        this.prerender.canvases[color],
                        x * this.maskWidth + pattern.corner1X,
                        y * this.maskHeight + pattern.corner1Y
                    );
                }
            }
        }
    }

    prerenderCanvas(maskWidth: number, maskHeight: number, color: string | number) {
        let canvas = document.createElement("canvas");

        canvas.width = maskWidth + 4;
        canvas.height = maskHeight + 4;

        let ctx = canvas.getContext("2d")!!;

        console.log(this.color_to_image)
        console.log(color)

        ctx.drawImage(this.color_to_image!![color] as CanvasImageSource, 0, 0)

        return canvas;
    }
}