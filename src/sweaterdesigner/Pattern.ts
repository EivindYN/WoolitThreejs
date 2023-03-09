export class Pattern {
    grid: number[][]
    constructor(grid: number[][]) {
        this.grid = grid
    }

    anchor() {
        return [Math.floor((this.grid[0].length - 1) / 2), Math.floor((this.grid.length - 1) / 2)]
    }
    length() {
        return [this.grid[0].length, this.grid.length]
    }
}