import { SweaterPartArea, SweaterPartAreaGroup } from "./enums"

export class SweaterPart {
    name: String
    area: SweaterPartArea
    grid: number[][]
    corner1X: number
    corner1Y: number
    corner2X: number
    corner2Y: number
    topArmY: number //Connecting point to arm
    scaleArmY: number //Relative scaling to arm
    //corner1      corner
    //
    //corner       corner2
    constructor(
        name: String,
        area: SweaterPartArea,
        grid: number[][],
        corner1X: number,
        corner1Y: number,
        corner2X: number,
        corner2Y: number,
        topArmY: number = -1,
        scaleArmY: number = 1
    ) {
        this.name = name
        this.area = area
        this.grid = grid
        this.corner1X = corner1X
        this.corner1Y = corner1Y
        this.corner2X = corner2X
        this.corner2Y = corner2Y
        if (topArmY === -1) {
            this.topArmY = corner1Y
        } else {
            this.topArmY = topArmY
        }
        this.scaleArmY = scaleArmY
    }

    offsetY(maskHeight: number, scaleY: number,) {
        const topArmYPixel = this.topArmY * 4096
        const corner1YPixel = this.corner1Y * 4096
        return Math.ceil((topArmYPixel - corner1YPixel) / (maskHeight * scaleY))
    }

    areaGroup() {
        switch (this.area) {
            case SweaterPartArea.LeftArm: return SweaterPartAreaGroup.Arm;
            case SweaterPartArea.RightArm: return SweaterPartAreaGroup.Arm;
            case SweaterPartArea.FrontTorso: return SweaterPartAreaGroup.Torso;
            case SweaterPartArea.BackTorso: return SweaterPartAreaGroup.Torso;
        }
    }

    isArm() {
        return this.areaGroup() === SweaterPartAreaGroup.Arm
    }
}