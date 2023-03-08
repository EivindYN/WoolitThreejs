// @ts-ignore
import { hexToRgb, lighten_color } from './colorutil.ts'
import { SweaterPart } from '../SweaterPart';
import { Settings } from '../settings'

let maskWidth = Settings.maskWidth
let maskHeight = Settings.maskHeight

let prerender: { canvases: any; } | null = null;

let image_base: HTMLImageElement;
let image_mask: HTMLImageElement;


let color_to_image: { [x: string]: ImageData } = {};

export function loadImages() {
    let waitForLoad = []

    image_base = new Image(maskWidth, maskHeight);
    image_base.src = 'patterns2.png';
    waitForLoad.push(image_base)

    image_mask = new Image(maskWidth, maskHeight);
    image_mask.src = 'patterns2c.png';
    waitForLoad.push(image_mask)
    return waitForLoad
}

export function createCanvas() {
    let canvas = document.createElement("canvas");

    canvas.width = Settings.canvasWidth;
    canvas.height = Settings.canvasHeight;

    return canvas;
}

export function createPrerender(colors_arg: any[]) {
    let canvases: any = {}
    for (let colorIndex in colors_arg) {
        let color = colors_arg[colorIndex]
        canvases[color] = prerenderCanvas(maskWidth, maskHeight, color)
        canvases[lighten_color(color)] = prerenderCanvas(maskWidth, maskHeight, lighten_color(color))
    }

    return {
        canvases
    };
}

export function drawCanvas(
    canvas: any,
    sweaterParts_arg: SweaterPart[],
    colors: any[],
    repeatY: boolean,
    selectedSweaterPart: SweaterPart | undefined
) {
    if (prerender === null) {
        prerender = createPrerender(colors);
    }

    let ctx = canvas.getContext("2d");

    for (let sweaterPart of sweaterParts_arg) {
        let sweaterPartHeight = sweaterPart.grid.length;
        let sweaterPartWidth = sweaterPart.grid[0].length;

        let width = (sweaterPart.corner2X - sweaterPart.corner1X) * canvas.width;
        let height = (sweaterPart.corner2Y - sweaterPart.corner1Y) * canvas.height;

        let mask_n_x = Math.floor(width / maskWidth);
        let mask_n_y = Math.floor(height / maskHeight);

        for (let x = 0; x < mask_n_x; x++) {
            for (let y = 0; y < mask_n_y; y += 1) {
                let color;
                let y_;
                if (repeatY) {
                    y_ = y % sweaterPartHeight;
                } else {
                    y_ = y;
                }
                if (sweaterPart.grid[y_]) {
                    color = colors[sweaterPart.grid[y_][x % sweaterPartWidth]];
                } else {
                    color = colors[0];
                }
                if (selectedSweaterPart === sweaterPart) {
                    color = lighten_color(color)
                }
                ctx.drawImage(
                    prerender.canvases[color],
                    x * (maskWidth) + sweaterPart.corner1X * canvas.width,
                    y * (maskHeight) + sweaterPart.corner1Y * canvas.height
                );
            }
        }
    }
}

export function prerenderCanvas(maskWidth: number, maskHeight: number, color: string) {
    let canvas = document.createElement("canvas");

    canvas.width = maskWidth;
    canvas.height = maskHeight * 2;

    let ctx = canvas.getContext("2d")!!;

    ctx.putImageData(color_to_image!![color], 0, 0)

    return canvas;
}

function color_image_mask(canvas: HTMLCanvasElement, imageDataMask: any, color: string) {
    let ctx = canvas.getContext("2d")!!;
    let w = maskWidth
    let h = maskHeight
    let colored_image = image_base!!
    ctx.drawImage(colored_image, 0, 0, w, h)
    ctx.drawImage(colored_image, 0, h, w, h)
    let imageData = ctx.getImageData(0, 0, w, h * 2)
    let rgb = hexToRgb(color)!!
    for (let i = 0; i < imageData.data.length; i += 4) {
        let offset = 2
        if (i > imageData.data.length / 2) {
            offset -= 2
        }
        let me = imageDataMask.data[i + offset] / 255.0
        let background = imageDataMask.data[i + 1] / 255.0
        let other = imageDataMask.data[i + (2 - offset)] / 255.0
        let max = Math.max(me, background, other)
        if (max === background) {
            max *= 0.75
            imageData.data[i + 3] = 100
        }
        else if (Math.max(me, other) === other) {
            imageData.data[i + 3] = 0
        }
        imageData.data[i] *= max * rgb.r / 255.0
        imageData.data[i + 1] *= max * rgb.g / 255.0
        imageData.data[i + 2] *= max * rgb.b / 255.0


    }
    color_to_image[color] = imageData
}

export function renderAfterLoad(canvas: any, colors: any) {
    let ctx = canvas.getContext("2d")!!;
    let w = maskWidth
    let h = maskHeight
    ctx.drawImage(image_mask!!, 0, 0, w, h)
    ctx.drawImage(image_mask!!, 0, h, w, h)
    let region_image_mask = ctx.getImageData(0, 0, w, h * 2)
    for (let color of colors) {
        color_image_mask(canvas, region_image_mask, color)
        color_image_mask(canvas, region_image_mask, lighten_color(color))
    }
}