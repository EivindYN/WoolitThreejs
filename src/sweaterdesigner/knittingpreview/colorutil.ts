
export function lighten_color(hex: string) {
    let color = hexToRgb(hex)!!
    let colorLightened = {
        r: 127 + color.r / 2,
        g: 127 + color.g / 2,
        b: 127 + color.b / 2
    }
    return rgbToHex(colorLightened)
}

export function rgbToHex(rgb: any) {
    return "#" + (1 << 24 | rgb.r << 16 | rgb.g << 8 | rgb.b).toString(16).slice(1);
}

export function hexToRgb(hex: string) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}