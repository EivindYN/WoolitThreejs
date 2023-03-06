"use strict";

import * as THREE from 'three'

// @ts-ignore
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
// @ts-ignore
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

//import Detector from "three/examples/js/Detector.js"; 

import { Pattern } from '../pattern';
// @ts-ignore
import { createCanvas, loadImages, renderAfterLoad, drawCanvas } from './texturecanvas';

let pointer: THREE.Vector2;
let selectedPatterns: Pattern[];
let material: THREE.MeshBasicMaterial;
let scene: THREE.Scene;
let texture_canvas: HTMLCanvasElement;
let colors: string[];
let pattern: Pattern[];
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let last_resize: Date;
let repeatY: boolean;
let waitForLoad: HTMLImageElement[];
let raycaster = new THREE.Raycaster();
let setSelectedPattern: any;


export function makeScene(element: HTMLElement, pattern_arg: Pattern[], colors_arg: string[], setSelectedPattern_arg: any) {
    setSelectedPattern = setSelectedPattern_arg
    texture_canvas = createCanvas();
    material = new THREE.MeshPhongMaterial({
        side: THREE.DoubleSide
    });
    selectedPatterns = [];
    scene = new THREE.Scene();
    let colorsHex = []
    let ctx = texture_canvas.getContext("2d")!!;
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

    new OrbitControls(camera, renderer.domElement);

    element.appendChild(renderer.domElement);

    material.map = new THREE.Texture(texture_canvas);
    material.map.wrapS = THREE.RepeatWrapping;
    material.map.flipY = false;


    material.map.needsUpdate = true;

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener("click", onClick);

    requestAnimationFrame(() => {
        resize();
        animate();
    });

    waitForLoad = loadImages()

    for (let image of waitForLoad) {
        image.onload = () => {
            waitForLoad.pop()
            if (waitForLoad.length === 0) {
                renderAfterLoad(texture_canvas, colors)
                drawCanvas(texture_canvas, pattern, colors, repeatY, selectedPatterns);
            }
        }
    }
}

function resize() {
    if (!renderer.domElement.parentNode) {
        return;
    }

    let displayWidth = (renderer.domElement.parentNode as HTMLElement).clientWidth;
    let displayHeight = (renderer.domElement.parentNode as HTMLElement).clientHeight;

    // Check if the texture_canvas is not the same size.
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

function onClick(_: any) {
    if (pointer.x > -1) { //NB
        setSelectedPattern(selectedPatterns[0])
    }
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

function updateCanvas() {
    if (texture_canvas) {
        requestAnimationFrame(() => {
            drawCanvas(texture_canvas, pattern, colors, repeatY, selectedPatterns);
            material.map!!.needsUpdate = true;
        });
    }
}

