import React from 'react';

import { useEffect } from 'react'
import { makeScene } from "./scene";
import { Pattern } from "../pattern";

function KnittingPreview(props: any) {

    function onLoad() {
        let pattern: number[][] = []
        for (let y = 0; y < 146 * 4; y++) {
            let pattern_int: [] = []
            pattern.push(pattern_int)
            for (let x = 0; x < 128 * 4; x++) {
                pattern[y].push((x + y) % 2)
            }
        }
        let pattern2: number[][] = []
        for (let y = 0; y < 146 * 8; y++) {
            let pattern_int: [] = []
            pattern2.push(pattern_int)
            for (let x = 0; x < 128 * 8; x++) {
                pattern2[y].push((x + y) % 2)
            }
        }
        // 2128, 1986, 3826, 4025
        let leftArm = new Pattern("leftArm", pattern, 371 / 4096, 60 / 4096, 1714 / 4096, 1732 / 4096);
        let front = new Pattern("front", pattern2, 2128 / 4096, 1986 / 4096, 3826 / 4096, 4020 / 4096);

        let element = document.getElementById('canvas')!!

        makeScene(element, [leftArm, front], ['white', 'red', 'black'], props.setSelectedPattern);
    }

    useEffect(() => {
        onLoad()
    }, []);

    return (
        <div id="canvas" style={{ height: "50vh", width: "25vw" }}></div>
    );
}

export default KnittingPreview;
