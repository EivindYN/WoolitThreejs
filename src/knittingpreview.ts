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
let selectedPatterns: Pattern[];

let material: THREE.MeshBasicMaterial;
let scene: THREE.Scene;
let canvas: HTMLCanvasElement;
let colors: string[];
let pattern: Pattern[];
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let last_resize: Date;
let repeatY: boolean;
let prerender: { canvases: any; } | null = null;
let image_base: HTMLImageElement;
let image_mask: HTMLImageElement;
let color_to_image: { [x: string]: ImageData };
let maskHeight = 7 * 4;
let maskWidth = 8 * 4;
let waitForLoad: HTMLImageElement[];
let raycaster = new THREE.Raycaster();


function test(imageDataMask: any, color: string) {
    let ctx = canvas.getContext("2d")!!;
    let w = maskWidth
    let h = maskHeight
    let colored_image = image_base!!
    ctx.drawImage(colored_image, 0, 0, w, h)
    ctx.drawImage(colored_image, 0, h, w, h)
    let imageData = ctx.getImageData(0, 0, w, h * 2)
    let rgb = hexToRgb(color)!!
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
    color_to_image[color] = imageData
}

function renderAfterLoad() {
    let ctx = canvas.getContext("2d")!!;
    let colored_image_mask = image_mask!!
    let w = maskWidth
    let h = maskHeight
    ctx.drawImage(colored_image_mask, 0, 0, w, h)
    ctx.drawImage(colored_image_mask, 0, h, w, h)
    let imageDataMask = ctx.getImageData(0, 0, w, h * 2)
    for (let color of colors) {
        test(imageDataMask, color)
        test(imageDataMask, lighten_color(color))
    }
    drawCanvas(canvas, pattern, colors, repeatY);
    /*if (!Detector.webgl) {
        // Backup for non-webgl-supporting browsers
        element.appendChild(canvas);
        return;
    }*/

    material.map = new THREE.Texture(canvas);
    material.map.wrapS = THREE.RepeatWrapping;
    material.map.flipY = false;


    material.map.needsUpdate = true;

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener("click", onClick);

    requestAnimationFrame(() => {
        resize();
        animate();
    });
}

function resize() {
    if (!renderer.domElement.parentNode) {
        return;
    }

    let displayWidth = (renderer.domElement.parentNode as HTMLElement).clientWidth;
    let displayHeight = (renderer.domElement.parentNode as HTMLElement).clientHeight;

    // Check if the canvas is not the same size.
    if (
        renderer.domElement.width != displayWidth ||
        renderer.domElement.height != displayHeight
    ) {
        camera.aspect = displayWidth / displayHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(displayWidth, displayHeight, false);
    }
    last_resize = new Date();
}

function onPointerMove(event: { clientX: number; clientY: number; }) {

    // calculate pointer position in normalized device coordinates
    // (-1 to +1) for both components

    let x = ((event.clientX / window.innerWidth) * 2 - 1) * 2 - 1; //NB
    let y = - (event.clientY / window.innerHeight) * 2 + 1
    pointer = new THREE.Vector2(x, y)
}

function onClick(event: any) {
    console.log(selectedPatterns)
}

function render() {
    if (!pointer) {
        return
    }
    // update the picking ray with the camera and pointer position
    raycaster.setFromCamera(pointer, camera);

    // calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects(scene.children, false);
    selectedPatterns = []
    for (let i = 0; i < intersects.length; i++) {
        let uv = intersects[i].uv!!;

        for (let n = 0; n < pattern.length; n++) {
            let target = pattern[n]
            let insideX = uv.x < target.corner2X && uv.x > target.corner1X;
            let insideY = uv.y < target.corner2Y && uv.y > target.corner1Y;
            if (insideX && insideY) {
                selectedPatterns = [pattern[n]]
            }
        }
        //intersects[i].object.material.color.set(0xff0000);
    }
    updateCanvas()
    renderer.render(scene, camera);

}

function animate() {
    setTimeout(() => {
        requestAnimationFrame(() => animate());
    }, 1000 / 30);
    if (new Date().getTime() - last_resize.getTime() > 1000) {
        resize();
    }
    renderer.render(scene, camera);
    render();
}
function cleanup() {
    // TODO
}
function getScreenshot() {
    // Removed for now
}
function downloadPatternScreenshot() {
    var img = canvas.toDataURL("image/png");
    document.write('<img src="' + img + '"/>');
}
function updateCanvas() {
    if (canvas) {
        requestAnimationFrame(() => {
            drawCanvas(canvas, pattern, colors, repeatY);
            material.map!!.needsUpdate = true;
        });
    }
}
function updatePattern(pattern_arg: Pattern[]) {
    pattern = pattern_arg;
    updateCanvas();
}
function updateColors(colors_arg: string[]) {
    colors = colors_arg;
    updateCanvas();
}
function setRepeatY(repeatY_arg: any) {
    repeatY = repeatY_arg;
    updateCanvas();
}

function createCanvas() {
    let canvas = document.createElement("canvas");
    canvas.width = 1024 * 4;
    canvas.height = 1024 * 4;

    return canvas;
}

function createPrerender(colors_arg: any[]) {
    let canvases: any = {}
    for (let colorIndex in colors_arg) {
        let color = colors_arg[colorIndex]
        canvases[color] = prerenderCanvas(maskWidth, maskHeight, color)
        canvases[lighten_color(color)] = prerenderCanvas(maskWidth, maskHeight, lighten_color(color))
    }

    return {
        canvases
    };
}

function drawCanvas(canvas: { getContext: (arg0: string) => any; height: number; width: number; }, patterns_arg: Pattern[], colors_arg: any[], repeatY: boolean) {
    if (prerender === null) {
        prerender = createPrerender(colors_arg);
    }

    let ctx = canvas.getContext("2d");

    for (let pattern of patterns_arg) {
        let patternHeight = pattern.pattern.length;
        let patternWidth = pattern.pattern[0].length;

        let width = (pattern.corner2X - pattern.corner1X) * canvas.width;
        let height = (pattern.corner2Y - pattern.corner1Y) * canvas.height;

        let mask_n_x = Math.floor(width / maskWidth);
        let mask_n_y = Math.floor(height / maskHeight);

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
                    color = colors[pattern.pattern[y_][x % patternWidth]];
                } else {
                    color = colors[0];
                }
                if (selectedPatterns.includes(pattern)) {
                    color = lighten_color(color)
                }
                ctx.drawImage(
                    prerender.canvases[color],
                    x * (maskWidth) + pattern.corner1X * canvas.width,
                    y * (maskHeight) + pattern.corner1Y * canvas.height
                );
            }
        }
    }
}

function prerenderCanvas(maskWidth: number, maskHeight: number, color: string) {
    let canvas = document.createElement("canvas");

    canvas.width = maskWidth;
    canvas.height = maskHeight * 2;

    let ctx = canvas.getContext("2d")!!;

    ctx.putImageData(color_to_image!![color], 0, 0)

    return canvas;
}

function lighten_color(hex: string) {
    let color = hexToRgb(hex)!!
    let colorLightened = {
        r: 127 + color.r / 2,
        g: 127 + color.g / 2,
        b: 127 + color.b / 2
    }
    return rgbToHex(colorLightened)
}

function rgbToHex(rgb: any) {
    return "#" + (1 << 24 | rgb.r << 16 | rgb.g << 8 | rgb.b).toString(16).slice(1);
}

function hexToRgb(hex: string) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

export class KnittingPreview {
    constructor(element: HTMLElement, pattern_arg: Pattern[], colors_arg: string[]) {
        canvas = createCanvas();
        material = new THREE.MeshPhongMaterial({
            side: THREE.DoubleSide
        });
        selectedPatterns = [];
        scene = new THREE.Scene();
        let colorsHex = []
        let ctx = canvas.getContext("2d")!!;
        for (let color of colors_arg) {
            ctx.fillStyle = color
            colorsHex.push(ctx.fillStyle)
        }
        colors = colorsHex
        pattern = pattern_arg
        camera = new THREE.PerspectiveCamera(50, 1000 / 1000, 1, 2000);
        renderer = new THREE.WebGLRenderer({
            antialias: true
        });
        last_resize = new Date();
        repeatY = false;
        color_to_image = {}

        camera.position.z = 5;
        camera.position.y = 5;
        //camera.lookAt(0, 0, 0);

        scene.background = new THREE.Color(0xf8f5f2);

        let loader = new GLTFLoader();
        loader.load("sweater_3.gltf", (gltf: { scene: { children: { geometry: any; }[]; }; }) => {
            console.log(gltf.scene.children[0])
            let geometry = gltf.scene.children[0].geometry
            let mesh = new THREE.Mesh(geometry, material);
            mesh.position.y = -1;
            mesh.scale.set(5, 5, 5);
            scene.add(mesh);
        });

        const light = new THREE.AmbientLight(0xFFFFFF); // soft white light
        scene.add(light);

        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(1024, 1024, false);

        controls = new OrbitControls(camera, renderer.domElement);

        element.appendChild(renderer.domElement);

        waitForLoad = []

        image_base = new Image(maskWidth, maskHeight);
        image_base.src = 'patterns2.png';
        waitForLoad.push(image_base)

        image_mask = new Image(maskWidth, maskHeight);
        image_mask.src = 'patterns2c.png';
        waitForLoad.push(image_mask)

        for (let image of waitForLoad) {
            image.onload = () => {
                waitForLoad.pop()
                if (waitForLoad.length === 0) {
                    renderAfterLoad()
                }
            }
        }
    }
}