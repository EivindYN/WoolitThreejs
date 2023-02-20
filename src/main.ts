// npm install three@0.98.0
// Import * as THREE
// Remove detector @ import and init
// Import and export at https://raw.githack.com/mrdoob/three.js/r98/editor/index.html
// Use GLTFLoader
import { KnittingPreview } from "./knittingpreview";

let pattern: number[][] = []
for (let y = 0; y < 146; y++) {
    let pattern_int: [] = []
    pattern.push(pattern_int)
    for (let x = 0; x < 128; x++) {
        pattern[y].push((x + y) % 2)
    }
}

new KnittingPreview(document.getElementById('canvas'), pattern, ['red', 'blue']);