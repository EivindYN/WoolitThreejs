"use strict";

import * as THREE from 'three'

//import Detector from "three/examples/js/Detector.js"; 
//const THREE = require("three");

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class KnittingPreview {
    constructor(element, pattern, colors, config = {}) {
        image = new Image(maskWidth, maskHeight);
        image.src = 'patterns2.png';
        image.onload = () => {
            this.init(element, pattern, colors, config)
        }
    }

    init(element, pattern, colors, config = {}) {
        config = Object.assign(
            {
                createCanvas: createCanvas
            },
            config
        );
        this.canvas = config.createCanvas();
        this.colors = colors;
        this.pattern = pattern;
        drawCanvas(this.canvas, this.pattern, this.colors);
        /*if (!Detector.webgl) {
            // Backup for non-webgl-supporting browsers
            element.appendChild(this.canvas);
            return;
        }*/

        this.camera = new THREE.PerspectiveCamera(50, 1000 / 1000, 1, 2000);
        this.camera.position.z = 5;
        this.camera.position.y = 5;
        //camera.lookAt(0, 0, 0);

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf8f5f2);

        this.material = new THREE.MeshBasicMaterial({
            side: THREE.DoubleSide
        });

        let loader = new GLTFLoader();
        loader.load("sweater_3.gltf", (gltf) => {
            console.log(gltf.scene.children[0])
            const texture = new THREE.TextureLoader().load('Diffuse_sweater_binocular2.png');
            texture.flipY = false
            const material = new THREE.MeshBasicMaterial({ map: texture });
            let geometry = gltf.scene.children[0].geometry
            let mesh = new THREE.Mesh(geometry, this.material);
            mesh.position.y = -1;
            mesh.scale.set(5, 5, 5)
            this.scene.add(mesh);
            /*
            let model = gltf.scene.children[0]
            model.traverse(o => {
                if (o.isMesh) {
                    const texture = new THREE.TextureLoader().load('Diffuse_sweater_binocular2.png');
                    const material = new THREE.MeshBasicMaterial({ map: texture });
                    o.material = material
                }
            });
            this.scene.add(model)
            */
        });

        const light = new THREE.AmbientLight(0xFFFFFF); // soft white light
        this.scene.add(light);

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            context: config.glContext
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(1024, 1024, false);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);

        element.appendChild(this.renderer.domElement);

        this.material.map = new THREE.Texture(this.canvas);
        this.material.map.wrapS = THREE.RepeatWrapping;

        this.material.map.needsUpdate = true;

        this.renderer.render(this.scene, this.camera);

        requestAnimationFrame(() => {
            this.resize();
            this.animate();
        });
    }

    resize(displayWidth, displayHeight) {
        if (!displayWidth) {
            displayWidth = this.renderer.domElement.parentNode.clientWidth;
        }
        if (!displayHeight) {
            displayHeight = this.renderer.domElement.parentNode.clientHeight;
        }

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
        if (new Date() - this.last_resize > 1000) {
            this.resize(null, null);
        }
        this.renderer.render(this.scene, this.camera);
    }
    cleanup() {
        // TODO
    }
    getScreenshot() {
        let width = 2000;
        let height = 2000;
        let camera = new THREE.PerspectiveCamera(50, 1000 / 1000, 1, 2000);
        camera.position.z = 500;
        camera.position.y = 200;
        camera.lookAt(0, 0, 0);

        let renderer = new THREE.WebGLRenderer({
            antialias: true
        });
        renderer.setSize(width, height, false);

        let scene = new THREE.Scene();
        scene.background = new THREE.Color(0xffffff);
        let mesh = new THREE.Mesh(
            this.sweater.geometry,
            new THREE.MeshBasicMaterial({
                color: "#ff0000"
            })
        );
        mesh.position.y = -200;
        mesh.material = this.material;
        scene.add(mesh);

        renderer.render(scene, camera);

        let res = renderer.domElement.toDataURL("image/png");

        renderer.dispose();

        return res;
    }
    downloadPatternScreenshot() {
        var img = this.canvas.toDataURL("image/png");
        document.write('<img src="' + img + '"/>');
    }
    updateCanvas() {
        if (this.canvas) {
            requestAnimationFrame(() => {
                drawCanvas(this.canvas, this.pattern, this.colors, this.repeatY);
                this.material.map.needsUpdate = true;
            });
        }
    }
    updatePattern(pattern) {
        this.pattern = pattern;
        this.updateCanvas();
    }
    updateColors(colors) {
        this.colors = colors;
        this.updateCanvas();
    }
    setRepeatY(repeatY) {
        this.repeatY = repeatY;
        this.updateCanvas();
    }
}

function createCanvas() {
    let canvas = document.createElement("canvas");
    canvas.width = 1024 * 4;
    canvas.height = 1024 * 4;

    return canvas;
}

let maskHeight = 7 * 4;
let maskWidth = 8 * 4;

function createPrerender(colors) {
    let canvases = colors.map(function (color) {
        return prerenderCanvas(maskWidth, maskHeight, color);
    });

    return {
        canvases,
        colors
    };
}

let prerender = null;
let image = null

function drawCanvas(canvas, pattern, colors, repeatY) {
    if (prerender === null || prerender.colors !== colors) {
        prerender = createPrerender(colors);
    }

    let ctx = canvas.getContext("2d");

    let patternHeight = pattern.length;
    let patternWidth = pattern[0].length;

    let width = canvas.width;
    let height = canvas.height;

    ctx.fillStyle = "#333";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let mask_n_x = Math.floor(width / maskWidth);
    let mask_n_y = Math.floor(height / maskHeight);

    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.strokeStyle = "blue";

    for (let x = 0; x < mask_n_x; x++) {
        for (let y = 0; y < mask_n_y; y++) {
            let color;
            let y_;
            if (repeatY) {
                y_ = y % patternHeight;
            } else {
                y_ = y;
            }
            if (pattern[y_]) {
                color = pattern[y_][x % patternWidth];
            } else {
                color = 0;
            }
            ctx.drawImage(
                prerender.canvases[color],
                x * maskWidth - 2,
                y * maskHeight - 2
            );
        }
    }
}

function prerenderCanvas(maskWidth, maskHeight, color) {
    let canvas = document.createElement("canvas");

    canvas.width = maskWidth + 4;
    canvas.height = maskHeight + 4;

    let ctx = canvas.getContext("2d");

    ctx.drawImage(image, 0, 0)

    return canvas;
}
