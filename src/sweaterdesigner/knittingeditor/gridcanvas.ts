import { start } from 'repl';
import { Pattern } from '../pattern';
import { Settings } from '../settings';

let settings = new Settings()
let maskWidth = settings.maskWidth
let maskHeight = settings.maskHeight
let canvasWidth = settings.canvasWidth
let canvasHeight = settings.canvasHeight

let shirt_uv: HTMLImageElement

function loadImages() {
    let waitForLoad = []

    shirt_uv = new Image(4096, 4096);
    shirt_uv.src = 'Diffuse_sweater_binocular_regions.png';
    waitForLoad.push(shirt_uv)

    return waitForLoad
}

function pixelData(imageData: any, x: number, y: number) {
    let index = x * 4 + y * 4 * 4096
    if (index >= 4096 * 4096 * 4)
        throw new Error('out of index');
    return (imageData.data[index])
}

function onLoadImages(pattern: any, grid: any, setGrid: any) {
    let canvas: HTMLCanvasElement = document.createElement("canvas");
    canvas.width = 4096;
    canvas.height = 4096;
    let ctx = canvas.getContext("2d")!!
    ctx.drawImage(shirt_uv, 0, 0)
    let imageData = ctx.getImageData(0, 0, 4096, 4096)
    let startX = pattern.corner1X * 4096
    let startY = pattern.corner1Y * 4096
    let endX = pattern.corner2X * 4096
    let endY = pattern.corner2Y * 4096
    let shallow_grid = [...grid]
    let xIndex = 0
    for (let x = startX; x < endX; x += maskWidth) {
        let yIndex = 0
        for (let y = startY; y < endY; y += maskHeight) {
            if (pixelData(imageData, x, y) >= 128) {
                if (yIndex < 300 && xIndex < 300) {
                    console.log("attemp")
                    shallow_grid[yIndex][xIndex] = 1
                }
            }
            yIndex++;
        }
        xIndex++;
    }
    console.log("set grid")
    setGrid(shallow_grid)

}

export function loadGrid(pattern: Pattern, grid: any, setGrid: any) {
    let waitForLoad = loadImages()

    for (let image of waitForLoad) {
        image.onload = () => {
            waitForLoad.pop()
            if (waitForLoad.length === 0) {
                onLoadImages(pattern, grid, setGrid)
            }
        }
    }
}