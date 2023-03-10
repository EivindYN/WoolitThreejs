import React from 'react';

import { useEffect } from 'react'
import { makeScene } from "./scene";
import { SweaterPart } from "../SweaterPart";

function KnittingPreview(props: any) {

    function onLoad() {
        let grid: number[][] = []
        for (let y = 0; y < 146 * 4; y++) {
            let grid_int: [] = []
            grid.push(grid_int)
            for (let x = 0; x < 128 * 4; x++) {
                grid[y].push((x + y) % 2)
            }
        }
        let grid2: number[][] = []
        for (let y = 0; y < 146 * 8; y++) {
            let grid_int: [] = []
            grid2.push(grid_int)
            for (let x = 0; x < 128 * 8; x++) {
                grid2[y].push((x + y) % 2)
            }
        }
        // 2128, 1986, 3826, 4025
        let leftArm = new SweaterPart("Left Arm", grid, 371 / 4096, 60 / 4096, 1714 / 4096, 1727 / 4096);
        let front = new SweaterPart(
            "Front Torso",
            grid2,
            2128 / 4096,
            1986 / 4096,
            3826 / 4096,
            4020 / 4096,
            2263 / 4096, //topArmY = 2213, but manually adjusted
            0.75,
        );

        let element = document.getElementById('canvas')!!

        makeScene(element, [leftArm, front], ['white', 'red', 'black'], props.setSelectedSweaterPart);
    }

    useEffect(() => {
        onLoad()
    }, []);

    return (
        <div id="canvas" style={{ height: "49vh", width: "25vw" }}></div>
    );
}

export default KnittingPreview;
