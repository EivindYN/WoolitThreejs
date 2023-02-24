// npm install three@0.98.0
// Import * as THREE
// Remove detector @ import and init
// Import and export at https://raw.githack.com/mrdoob/three.js/r98/editor/index.html
// Use GLTFLoader
import { KnittingPreview } from "./knittingpreview";
import { Pattern } from "./pattern";


let pattern: number[][] = []
for (let y = 0; y < 146; y++) {
    let pattern_int: [] = []
    pattern.push(pattern_int)
    for (let x = 0; x < 128; x++) {
        pattern[y].push((x + y) % 2)
    }
}
let leftArm = new Pattern(pattern, 371, 60, 1714, 1732);
let rightArm = new Pattern([], 2224, 52, 3548, 1700);

let element = document.getElementById('canvas')

if (element === null) {
    throw new Error('Could not get canvas')
}

new KnittingPreview(element, [leftArm], ['red', 'blue']);