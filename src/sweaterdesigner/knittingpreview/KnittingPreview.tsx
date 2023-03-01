import React from 'react';

import { useEffect } from 'react'
import { makeScene } from "./scene";
import { Pattern } from "./pattern";

function KnittingPreview() {

    function onLoad() {
        let pattern: number[][] = []
        for (let y = 0; y < 146 * 4; y++) {
            let pattern_int: [] = []
            pattern.push(pattern_int)
            for (let x = 0; x < 128 * 4; x++) {
                pattern[y].push((x + y) % 2)
            }
        }
        let leftArm = new Pattern("leftArm", pattern, 371 / 4096, 60 / 4096, 1714 / 4096, 1732 / 4096);
        //let rightArm = new Pattern([], 2224, 52, 3548, 1700);

        let element = document.getElementById('canvas')!!

        makeScene(element, [leftArm], ['red', 'white']);
    }

    useEffect(() => {
        onLoad()
    }, []);

    return (
        <div id="canvas" style={{ height: "50vh", width: "25vw" }}></div>
    );
}

export default KnittingPreview;
