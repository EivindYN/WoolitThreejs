//npm install dat.gui --save-dev
//npm install @types/dat.gui --save-dev
import { vertexShader } from './vertex_shader'
import { fragmentShader } from './fragment_shader'
import * as THREE from 'three'
import { calculate_bezier_points } from './bezier_math'
import { Vector2 } from 'three'
import { seededRandom } from 'three/src/math/MathUtils'

const scene = new THREE.Scene()

const camera1 = new THREE.PerspectiveCamera(75, 1, 0.1, 10)

camera1.position.z = 2

const canvas1 = document.getElementById('canvas1') as HTMLCanvasElement
let renderer1 = new THREE.WebGLRenderer({ canvas: canvas1 })
let HD = true;
let pixels = HD ? 2000 : 500;
renderer1.setSize(pixels, pixels)

function get_star_positions(time) {
    let star_positions = [...Array(128).fill(new Vector2(-1, -1))];
    let iteration = parseInt(time) % 8;
    for (let n = 0; n < 30; n++) {
        let x = seededRandom(iteration * 100 + n)
        let y = seededRandom(iteration * 100 + n + 1)
        star_positions[n] = new Vector2(x * 2 - 1, y * 2 - 1);
    }
    return star_positions;
}

const uniforms = {
    uStars: { value: get_star_positions(0) },
    uStars2: { value: get_star_positions(2) },
    uStars3: { value: get_star_positions(4) },
    uPoints: { value: calculate_bezier_points(0) },
    uTime: { value: 0 }
};

const material = new THREE.RawShaderMaterial({
    uniforms: uniforms,
    fragmentShader: fragmentShader,
    vertexShader: vertexShader
});

const groundGeometry = new THREE.BoxGeometry(2.5, 2.5, 1);
const groundMaterial = material;
const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
groundMesh.position.y = 0;
scene.add(groundMesh);

const dragon = document.getElementById('dragon_head')

function update() {
    requestAnimationFrame(update)

    uniforms.uPoints.value = calculate_bezier_points(uniforms.uTime.value);
    let x = 0.8 * (1000 + uniforms.uPoints.value[0].x * 900 + 40)
    let y = 0.8 * (1000 - uniforms.uPoints.value[0].y * 900 - 80)
    dragon.style.left = x + 'px';
    dragon.style.top = y + 'px';
    uniforms.uStars.value = get_star_positions(uniforms.uTime.value * 0.5)
    uniforms.uStars2.value = get_star_positions(uniforms.uTime.value * 0.5 + 1.3)
    uniforms.uStars3.value = get_star_positions(uniforms.uTime.value * 0.5 + 2.7)
    uniforms.uTime.value += 0.004;

    renderer1.render(scene, camera1)
}

update()
