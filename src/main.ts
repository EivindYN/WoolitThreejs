// npm install three@0.98.0
// Import * as THREE
// Remove detector @ import and init
// Import and export at https://raw.githack.com/mrdoob/three.js/r98/editor/index.html
// Use GLTFLoader
import { KnittingPreview } from "./knittingpreview";
import { Pattern } from "./pattern";


let pattern: number[][] = []
for (let y = 0; y < 146 * 4; y++) {
    let pattern_int: [] = []
    pattern.push(pattern_int)
    for (let x = 0; x < 128 * 4; x++) {
        pattern[y].push((x + y) % 2)
    }
}
let leftArm = new Pattern("leftArm", pattern, 371 / 4096, 60 / 4096, 1714 / 4096, 1732 / 4096);
//let rightArm = new Pattern([], 2224, 52, 3548, 1700);

let element = document.getElementById('canvas')!!

new KnittingPreview(element, [leftArm], ['red', 'white']);