"use strict";

import * as THREE from 'three'
// @ts-ignore
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
// @ts-ignore
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
// @ts-ignore
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
// @ts-ignore
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
// @ts-ignore
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';

//import Detector from "three/examples/js/Detector.js"; 

import { Pattern } from './pattern';

let pointer: THREE.Vector2;


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
    image_mask: HTMLImageElement;
    color_to_image: { [x: string]: ImageData };
    maskHeight = 7 * 4;
    maskWidth = 8 * 4;
    waitForLoad: HTMLImageElement[];
    raycaster = new THREE.Raycaster();
    constructor(element: HTMLElement, pattern: Pattern[], colors: string[]) {
        this.canvas = this.createCanvas();
        this.material = new THREE.MeshPhongMaterial({
            side: THREE.DoubleSide
        });
        this.scene = new THREE.Scene();
        this.colors = colors
        this.pattern = pattern
        this.camera = new THREE.PerspectiveCamera(50, 1000 / 1000, 1, 2000);
        this.renderer = new THREE.WebGLRenderer({
            antialias: true
        });
        this.last_resize = new Date();
        this.repeatY = false;
        this.color_to_image = {}

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
            mesh.scale.set(5, 5, 5);
            this.scene.add(mesh);
        });

        const light = new THREE.AmbientLight(0xFFFFFF); // soft white light
        this.scene.add(light);

        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(1024, 1024, false);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);

        element.appendChild(this.renderer.domElement);

        this.waitForLoad = []

        this.image_base = new Image(this.maskWidth, this.maskHeight);
        this.image_base.src = 'patterns2.png';
        this.waitForLoad.push(this.image_base)

        this.image_mask = new Image(this.maskWidth, this.maskHeight);
        this.image_mask.src = 'patterns2c.png';
        this.waitForLoad.push(this.image_mask)

        for (let image of this.waitForLoad) {
            image.onload = () => {
                this.waitForLoad.pop()
                if (this.waitForLoad.length === 0) {
                    this.renderAfterLoad()
                }
            }
        }
    }



    renderAfterLoad() {
        let ctx = this.canvas.getContext("2d")!!;
        let colored_image_mask = this.image_mask!!
        let w = this.maskWidth
        let h = this.maskHeight
        ctx.drawImage(colored_image_mask, 0, 0, w, h)
        ctx.drawImage(colored_image_mask, 0, h, w, h)
        let imageDataMask = ctx.getImageData(0, 0, w, h * 2)
        for (let color of this.colors) {
            let colored_image = this.image_base!!
            ctx.drawImage(colored_image, 0, 0, w, h)
            ctx.drawImage(colored_image, 0, h, w, h)
            let imageData = ctx.getImageData(0, 0, w, h * 2)
            ctx.fillStyle = color;
            let rgb = this.hexToRgb(ctx.fillStyle)!!
            for (let i = 0; i < imageData.data.length; i += 4) {
                let offset = 2
                if (i > imageData.data.length / 2) {
                    offset -= 2
                }
                let me = imageDataMask.data[i + offset] / 255.0
                let background = imageDataMask.data[i + 1] / 255.0
                let other = imageDataMask.data[i + (2 - offset)] / 255.0
                let max = Math.max(me, background, other)
                if (max === background) {
                    max *= 0.75
                    imageData.data[i + 3] = 100
                }
                else if (Math.max(me, other) === other) {
                    imageData.data[i + 3] = 0
                }
                imageData.data[i] *= max * rgb.r / 255.0
                imageData.data[i + 1] *= max * rgb.g / 255.0
                imageData.data[i + 2] *= max * rgb.b / 255.0


            }
            this.color_to_image[color] = imageData
        }
        this.drawCanvas(this.canvas, this.pattern, this.colors, this.repeatY);
        /*if (!Detector.webgl) {
            // Backup for non-webgl-supporting browsers
            element.appendChild(this.canvas);
            return;
        }*/

        this.material.map = new THREE.Texture(this.canvas);
        this.material.map.wrapS = THREE.RepeatWrapping;
        this.material.map.flipY = false;


        this.material.map.needsUpdate = true;

        window.addEventListener('pointermove', this.onPointerMove);

        requestAnimationFrame(() => {
            this.resize();
            this.animate();
        });
    }

    resize() {
        if (!this.renderer.domElement.parentNode) {
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

    onPointerMove(event: { clientX: number; clientY: number; }) {

        // calculate pointer position in normalized device coordinates
        // (-1 to +1) for both components

        let x = ((event.clientX / window.innerWidth) * 2 - 1) * 2 - 1; //NB
        let y = - (event.clientY / window.innerHeight) * 2 + 1
        pointer = new THREE.Vector2(x, y)
    }

    render() {
        if (!pointer) {
            return
        }
        // update the picking ray with the camera and pointer position
        this.raycaster.setFromCamera(pointer, this.camera);

        // calculate objects intersecting the picking ray
        const intersects = this.raycaster.intersectObjects(this.scene.children, false);
        for (let i = 0; i < intersects.length; i++) {
            let uv = intersects[i].uv!!;

            console.log(uv)
            for (let n = 0; n < this.pattern.length; n++) {
                let target = this.pattern[n]
                let insideX = uv.x < target.corner2X && uv.x > target.corner1X;
                let insideY = uv.y < target.corner2Y && uv.y > target.corner1Y;
                if (insideX && insideY) {
                    console.log(this.pattern[n].name)
                }
            }
            //intersects[i].object.material.color.set(0xff0000);

        }
        this.renderer.render(this.scene, this.camera);

    }

    animate() {
        setTimeout(() => {
            requestAnimationFrame(() => this.animate());
        }, 1000 / 30);
        if (new Date().getTime() - this.last_resize.getTime() > 1000) {
            this.resize();
        }
        this.renderer.render(this.scene, this.camera);
        this.render();
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

    drawCanvas(canvas: { getContext: (arg0: string) => any; height: number; width: number; }, patterns: Pattern[], colors: any[], repeatY: boolean) {
        if (this.prerender === null || this.prerender.colors !== colors) {
            this.prerender = this.createPrerender(colors);
        }

        let ctx = canvas.getContext("2d");

        for (let pattern of patterns) {
            let patternHeight = pattern.pattern.length;
            let patternWidth = pattern.pattern[0].length;

            console.log(pattern.corner1X)

            let width = (pattern.corner2X - pattern.corner1X) * canvas.width;
            let height = (pattern.corner2Y - pattern.corner1Y) * canvas.height;

            let mask_n_x = Math.floor(width / this.maskWidth);
            let mask_n_y = Math.floor(height / this.maskHeight);

            for (let x = 0; x < mask_n_x; x++) {
                for (let y = 0; y < mask_n_y; y += 1) {
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
                        x * (this.maskWidth) + pattern.corner1X * canvas.width,
                        y * (this.maskHeight) + pattern.corner1Y * canvas.height
                    );
                }
            }
        }
    }

    prerenderCanvas(maskWidth: number, maskHeight: number, color: string) {
        let canvas = document.createElement("canvas");

        canvas.width = maskWidth;
        canvas.height = maskHeight * 2;

        let ctx = canvas.getContext("2d")!!;

        console.log(this.color_to_image)
        console.log(color)

        ctx.putImageData(this.color_to_image!![color], 0, 0)

        return canvas;
    }

    hexToRgb(hex: string) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
}