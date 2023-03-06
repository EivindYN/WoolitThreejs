import { start } from 'repl';
import { Pattern } from '../pattern';
import { Settings } from '../settings';

let settings = new Settings()
let maskWidth = settings.maskWidth
let maskHeight = settings.maskHeight
let canvasWidth = settings.canvasWidth
let canvasHeight = settings.canvasHeight

let shirt_uv: HTMLImageElement

/*function make2DArray(x: number, y: number) {
    return new Array(y).fill(0).map(() => new Array(x).fill(0))
}

let grid: any[][] = make2DArray(90, 90)*/

export let state = {
    selectedTilePos: [] as number[]
}

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

function distance(num1: number, num2: number) {
    return Math.abs(num1 - num2)
}

export function drawSelection(pattern: any, grid: any, setGrid: any, x: any, y: any) {
    let selectedX = x
    let selectedY = y
    draw(pattern, grid, setGrid, selectedX - 1, selectedY - 1, selectedX + 2, selectedY + 2, true)
}

/*export function addSelection(pattern: any, grid: any, setGrid: any, x: any, y: any) {
    let selectedX = x
    let selectedY = y
    draw(pattern, grid, setGrid, selectedX - 1, selectedY - 1, selectedX + 2, selectedY + 2, true)
}

/*export function removeSelection(pattern: any, grid: any, setGrid: any) {
    let selectedX = state.selectedTilePos[0]
    let selectedY = state.selectedTilePos[1]
    let temp = [...state.selectedTilePos]
    state.selectedTilePos = [-999, -999]
    draw(pattern, grid, setGrid, selectedX - 1, selectedY - 1, selectedX + 2, selectedY + 2)
    state.selectedTilePos = [...temp]
}*/

function draw(pattern: any, grid: any, setGrid: any, startX: number = 0, startY: number = 0, endX: number = Infinity, endY: number = Infinity, isSelected: boolean = false) {
    let dx = 10
    let dy = 0
    let startXPixel = pattern.corner1X * 4096
    let startYPixel = pattern.corner1Y * 4096
    let endXPixel = pattern.corner2X * 4096
    let endYPixel = pattern.corner2Y * 4096
    let scaleX = 4096 / canvasWidth
    let scaleY = 4096 / canvasHeight
    let sizeX = Math.ceil((endXPixel - startXPixel) / (maskWidth * scaleX))
    let sizeY = Math.ceil((endYPixel - startYPixel) / (maskHeight * scaleY))

    let canvas: HTMLCanvasElement = document.createElement("canvas");
    canvas.width = 4096;
    canvas.height = 4096;
    let ctx = canvas.getContext("2d")!!
    ctx.drawImage(shirt_uv, 0, 0)
    let imageData = ctx.getImageData(0, 0, 4096, 4096)
    let shallowgrid = [...grid]
    startX = Math.max(dx, startX)
    startY = Math.max(dy, startY)
    endX = Math.min(sizeX + dx, endX)
    endY = Math.min(sizeY + dy, endY)

    for (let x = startX; x < endX; x += 1) {
        for (let y = startY; y < endY; y += 1) {
            let xPixel = Math.round((x - dx) * scaleX * maskWidth + startXPixel)
            let yPixel = Math.round((y - dy) * scaleY * maskHeight + startYPixel)
            //x and y have to be scaled if canvas.width != 4096
            let NW = pixelData(imageData, xPixel, yPixel) >= 128
            let NE = pixelData(imageData, xPixel + maskWidth, yPixel) >= 128
            let SW = pixelData(imageData, xPixel, yPixel + maskHeight) >= 128
            let SE = pixelData(imageData, xPixel + maskWidth, yPixel + maskHeight) >= 128
            if (NW && NE && SW && SE) { //Do four corner checks, and adjust output depending
                let selectedX = state.selectedTilePos[0]
                let selectedY = state.selectedTilePos[1]
                if (isSelected) {
                    shallowgrid[y][x] = 2
                } else {
                    shallowgrid[y][x] = 1
                }
            }
        }
    }
    setGrid(shallowgrid)
}

export function onLoadImages(pattern: any, grid: any, setGrid: any) {
    draw(pattern, grid, setGrid)
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