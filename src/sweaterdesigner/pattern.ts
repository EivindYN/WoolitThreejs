export class Pattern {
    name: String
    pattern: number[][]
    corner1X: number
    corner1Y: number
    corner2X: number
    corner2Y: number
    //corner1      corner
    //
    //corner       corner2
    constructor(name: String, pattern: number[][], corner1X: number, corner1Y: number, corner2X: number, corner2Y: number) {
        this.name = name
        this.pattern = pattern
        this.corner1X = corner1X
        this.corner1Y = corner1Y
        this.corner2X = corner2X
        this.corner2Y = corner2Y
    }
}