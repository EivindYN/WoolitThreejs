"use strict";

import * as THREE from 'three'

// @ts-ignore
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
// @ts-ignore
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

//import Detector from "three/examples/js/Detector.js"; 

import { SweaterPart } from '../SweaterPart';
// @ts-ignore
import { createCanvas, loadImages, renderAfterLoad, drawCanvas, lightenCanvas, darkenCanvas } from './texturecanvas';
import { Settings } from '../settings';

let pointer: THREE.Vector2;
let selectedSweaterPart: SweaterPart | undefined;
let material: THREE.MeshBasicMaterial;
let scene: THREE.Scene;
let texture_canvas: HTMLCanvasElement;
let texture_canvas_backup: HTMLCanvasElement;
let colors: string[];
let sweaterParts: SweaterPart[];
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let last_resize: Date;
let repeatY: boolean;
let waitForLoad: HTMLImageElement[];
let raycaster = new THREE.Raycaster();
let setSelectedSweaterPart: any;

let moveCounter: number
let updateCanvasNextFrame: boolean;
let updatedSweaterParts: SweaterPart[] = [];
let sweaterMesh: THREE.Mesh

export function makeScene(element: HTMLElement, sweaterParts_arg: SweaterPart[], colors_arg: string[], setSelectedSweaterPart_arg: any) {
    setSelectedSweaterPart = setSelectedSweaterPart_arg
    sweaterParts = sweaterParts_arg
    colors = colors_arg

    texture_canvas = createCanvas();
    texture_canvas_backup = createCanvas()
    material = new THREE.MeshPhongMaterial({
        side: THREE.DoubleSide
    });
    scene = new THREE.Scene();
    let colorsHex = []
    let ctx = texture_canvas.getContext("2d")!!;
    for (let color of colors) {
        ctx.fillStyle = color
        colorsHex.push(ctx.fillStyle)
    }
    colors = colorsHex
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
        let geometry = gltf.scene.children[0].geometry
        sweaterMesh = new THREE.Mesh(geometry, material);
        sweaterMesh.position.y = -1;
        sweaterMesh.scale.set(5, 5, 5);
        scene.add(sweaterMesh);
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
    window.addEventListener("mousedown", () => { moveCounter = 0 })
    window.addEventListener("mouseup", onClick)

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
                //drawCanvas(texture_canvas, SweaterPart, colors, repeatY, selectedSweaterPart);
                updateCanvas()
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
    moveCounter += 1
}

function onClick(_: any) {
    if (moveCounter <= 1 && pointer.x > -1) { //NB
        setSelectedSweaterPart(selectedSweaterPart)
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
    let oldSelectedSweaterPart = selectedSweaterPart
    selectedSweaterPart = undefined
    for (let i = 0; i < intersects.length; i++) {
        let uv = intersects[i].uv!!;

        for (let n = 0; n < sweaterParts.length; n++) {
            let target = sweaterParts[n]
            let insideX = uv.x < target.corner2X && uv.x > target.corner1X;
            let insideY = uv.y < target.corner2Y && uv.y > target.corner1Y;
            if (insideX && insideY) {
                selectedSweaterPart = sweaterParts[n]
            }
        }
        //intersects[i].object.material.color.set(0xff0000);
    }
    if (oldSelectedSweaterPart != selectedSweaterPart) {
        //TODO: dont update canvas here, but just lighten the uv
        if (oldSelectedSweaterPart)
            darkenCanvas(texture_canvas, texture_canvas_backup)
        if (selectedSweaterPart)
            lightenCanvas(texture_canvas, selectedSweaterPart, texture_canvas_backup)
        material.map!!.needsUpdate = true;
    }
    if (updateCanvasNextFrame) {
        updateCanvas()
        updateCanvasNextFrame = false;
    }
}

export function setUpdateCanvasNextFrame(updatedSweaterParts_arg: SweaterPart[]) {
    updateCanvasNextFrame = true;
    updatedSweaterParts = updatedSweaterParts_arg
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

export function resetCanvas() {
    texture_canvas.width = Settings.canvasWidth
    texture_canvas.height = Settings.canvasHeight

    texture_canvas_backup.width = texture_canvas.width
    texture_canvas_backup.height = texture_canvas.height


    material.map = new THREE.Texture(texture_canvas);
    material.map.wrapS = THREE.RepeatWrapping;
    material.map.flipY = false;

    updateCanvasNextFrame = true;
}

function updateCanvas() {
    if (texture_canvas) {
        requestAnimationFrame(() => {
            let sweaterParts_arg = updatedSweaterParts.length > 0 ? updatedSweaterParts : sweaterParts
            drawCanvas(texture_canvas, sweaterParts_arg, colors, repeatY, selectedSweaterPart);
            material.map!!.needsUpdate = true;
            updatedSweaterParts = []
        });
    }
}

export function getSweaterParts() {
    return sweaterParts
}

