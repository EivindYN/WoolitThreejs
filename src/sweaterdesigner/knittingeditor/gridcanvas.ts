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
    let xIndex = 10
    let scaleX = 4096 / canvasWidth
    let scaleY = 4096 / canvasHeight
    for (let xFloat = startX; xFloat < endX; xFloat += maskWidth * scaleX) {
        let yIndex = 0
        for (let yFloat = startY; yFloat < endY; yFloat += maskHeight * scaleY) {
            let x = Math.round(xFloat)
            let y = Math.round(yFloat)
            //x and y have to be scaled if canvas.width != 4096
            let NW = pixelData(imageData, x, y) >= 128
            let NE = pixelData(imageData, x + maskWidth, y) >= 128
            let SW = pixelData(imageData, x, y + maskHeight) >= 128
            let SE = pixelData(imageData, x + maskWidth, y + maskHeight) >= 128
            if (NW && NE && SW && SE) { //Do four corner checks, and adjust output depending
                console.log("attemp")
                shallow_grid[yIndex][xIndex] = 1
                console.log(xIndex)
                console.log(yIndex)
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