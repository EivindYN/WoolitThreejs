import { start } from 'repl';
import { SweaterPart } from '../SweaterPart';
import { Settings } from '../settings';
import { Pattern } from '../Pattern';

let maskWidth = Settings.maskWidth
let maskHeight = Settings.maskHeight

let shirt_uv: HTMLImageElement
export let prevSetupSweaterPart: SweaterPart | undefined

function make2DArray(x: number, y: number) {
    return new Array(y).fill(0).map(() => new Array(x).fill(0))
}

let grid: any[][]

export function getGrid() {
    let shallowGrid = []
    for (let gridInner of grid) {
        shallowGrid.push([...gridInner])
    }
    return shallowGrid
}

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


export function drawSelection(sweaterParts: SweaterPart[], pattern: Pattern, x: any, y: any, repeat: boolean) {
    const anchor = pattern.anchor()
    const length = pattern.length()
    const anchorX = anchor[0]
    const anchorY = anchor[1]
    const lengthX = length[0]
    const lengthY = length[1]
    if (repeat) {
        for (let sweaterPart of sweaterParts) {
            drawRepeat(sweaterPart, x - anchorX, y - anchorY, x - anchorX + lengthX, y - anchorY + lengthY, pattern)
        }
    } else {
        draw(sweaterParts[0], x - anchorX, y - anchorY, x - anchorX + lengthX, y - anchorY + lengthY, pattern)
    }
}

/*export function addSelection(sweaterPart: any, x: any, y: any) {
    let selectedX = x
    let selectedY = y
    draw(sweaterPart, selectedX - 1, selectedY - 1, selectedX + 2, selectedY + 2, true)
}

/*export function removeSelection(sweaterPart: any) {
    let selectedX = state.selectedTilePos[0]
    let selectedY = state.selectedTilePos[1]
    let temp = [...state.selectedTilePos]
    state.selectedTilePos = [-999, -999]
    draw(sweaterPart, selectedX - 1, selectedY - 1, selectedX + 2, selectedY + 2)
    state.selectedTilePos = [...temp]
}*/
let dx: any
let dy: any

let scaleX: any
let scaleY: any

let startXPixel: any
let startYPixel: any

let imageData: any

let sizeX: any
let sizeY: any

let offsetY: any

function clearGrid() {
    grid = make2DArray(Settings.gridSizeX, Settings.gridSizeY)
}

function calculateGridSize(sweaterPart: any) {
    const startX = dx
    const startY = dy
    const endX = sizeX + dx
    const endY = sizeY + dy

    let highestX = 0
    let highestY = 0
    for (let x = startX; x < endX; x += 1) {
        for (let y = startY; y < endY; y += 1) {
            if (isMask(x, y)) { //Do four corner checks, and adjust output depending
                if (x > highestX) {
                    highestX = x
                }
                if (y > highestY) {
                    highestY = y
                }
            }
        }
    }
    highestX += dx + 1
    highestY += dy + 1
    return [highestX, highestY]
}

function isMask(x: number, y: number) {
    let xPixel = Math.round((x - dx) * scaleX * maskWidth + startXPixel)
    let yPixel = Math.round((y - dy) * scaleY * maskHeight + startYPixel)
    //x and y have to be scaled if canvas.width != 4096
    //NB: Consider caching this 
    let NW = pixelData(imageData, xPixel, yPixel) >= 128
    let NE = pixelData(imageData, xPixel + maskWidth, yPixel) >= 128
    let SW = pixelData(imageData, xPixel, yPixel + maskHeight) >= 128
    let SE = pixelData(imageData, xPixel + maskWidth, yPixel + maskHeight) >= 128
    return NW || NE || SW || SE //Do four corner checks, and adjust output depending
}

function mod(n: number, m: number) {
    return ((n % m) + m) % m;
}

function setupSweaterPart(sweaterPart: SweaterPart) {
    dx = 2
    dy = 2
    startXPixel = sweaterPart.corner1X * 4096
    startYPixel = sweaterPart.corner1Y * 4096
    let endXPixel = sweaterPart.corner2X * 4096
    let endYPixel = sweaterPart.corner2Y * 4096
    scaleX = 4096 / Settings.canvasWidth
    scaleY = 4096 / Settings.canvasHeight
    sizeX = Math.ceil((endXPixel - startXPixel) / (maskWidth * scaleX))
    sizeY = Math.ceil((endYPixel - startYPixel) / (maskHeight * scaleY))

    offsetY = sweaterPart.offsetY(maskHeight, scaleY)

    console.log(sweaterPart)
    console.log(offsetY)

    prevSetupSweaterPart = sweaterPart

    const gridSizes = calculateGridSize(sweaterPart)
    Settings.gridSizeX = gridSizes[0]
    Settings.gridSizeY = gridSizes[1]
    clearGrid()
}

function drawRepeat(
    sweaterPart: SweaterPart,
    startX: number = 0,
    startY: number = 0,
    endX: number = Infinity,
    endY: number = Infinity,
    pattern: Pattern | undefined = undefined,
) {
    if (prevSetupSweaterPart !== sweaterPart) {
        setupSweaterPart(sweaterPart)
    }

    const midY = (startY + endY) / 2
    startY += Math.round(midY * (1 - sweaterPart.scaleArmY))
    endY += Math.round(midY * (1 - sweaterPart.scaleArmY))
    console.log(Math.round(midY * (1 - sweaterPart.scaleArmY)))
    startY += offsetY
    endY += offsetY

    let minLimitXDraw = dx
    let maxLimitXDraw = sizeX + dx

    let xMod = startX
    let xLen = endX - startX
    startX = 0
    endX = sweaterPart.grid[0].length

    startY = Math.max(dy, startY)
    endY = Math.min(sizeY + dy, endY)

    for (let x = startX; x < endX; x += 1) {
        for (let y = startY; y < endY; y += 1) {
            const patternY = y - startY;
            const patternX = mod(x - startX - xMod, xLen)

            const brushColor = pattern!!.grid[patternY][patternX]
            if (brushColor !== -1) {
                sweaterPart.grid[y - dy][x - dx] = brushColor
            }

            const isInGrid = x >= minLimitXDraw && x < maxLimitXDraw
            if (isInGrid && isMask(x, y)) {
                grid[y][x] = sweaterPart.grid[y - dy][x - dx]
            }
        }
    }
}
export function draw(
    sweaterPart: SweaterPart,
    startX: number = 0,
    startY: number = 0,
    endX: number = Infinity,
    endY: number = Infinity,
    pattern: Pattern | undefined = undefined,
) {
    if (prevSetupSweaterPart !== sweaterPart) {
        setupSweaterPart(sweaterPart)
    }

    startX = Math.max(dx, startX)
    endX = Math.min(sizeX + dx, endX)

    startY = Math.max(dy, startY)
    endY = Math.min(sizeY + dy, endY)

    for (let x = startX; x < endX; x += 1) {
        for (let y = startY; y < endY; y += 1) {
            if (isMask(x, y)) {
                if (pattern) {
                    const patternY = y - startY;
                    const patternX = x - startX;
                    const brushColor = pattern.grid[patternY][patternX]
                    if (brushColor !== -1) {
                        sweaterPart.grid[y - dy][x - dx] = brushColor
                    }
                }
                grid[y][x] = sweaterPart.grid[y - dy][x - dx]
            }
        }
    }
}

export function unCacheDraw() {
    prevSetupSweaterPart = undefined
}

export function onLoadImages(sweaterPart: any, setGrid: any) {
    let canvas: HTMLCanvasElement = document.createElement("canvas");
    canvas.width = 4096;
    canvas.height = 4096;
    let ctx = canvas.getContext("2d")!!
    ctx.drawImage(shirt_uv, 0, 0)
    imageData = ctx.getImageData(0, 0, 4096, 4096)

    draw(sweaterPart)
    setGrid(getGrid())
}

export function loadGrid(sweaterPart: SweaterPart, setGrid: any) {
    let waitForLoad = loadImages()

    for (let image of waitForLoad) {
        image.onload = () => {
            waitForLoad.pop()
            if (waitForLoad.length === 0) {
                onLoadImages(sweaterPart, setGrid)
            }
        }
    }
}