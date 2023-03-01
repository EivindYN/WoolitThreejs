import React from 'react';
import './SweaterDesigner.css';

import { useEffect } from 'react'
import { make_preview } from "./knittingpreview/knittingpreview";
import { Pattern } from "./pattern";

function SweaterDesigner() {

    function main() {
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

        make_preview(element, [leftArm], ['red', 'white']);
    }

    useEffect(() => {
        main()
    }, []);

    return (
        <div style={{ display: "flex" }}>
            <div
                style={{
                    position: "absolute",
                    height: "100%",
                    width: "50%",
                    display: "flex",
                    backgroundColor: "black",
                    opacity: 0.6,
                    borderRadius: "3px"
                }}>
                <div style={{ margin: "auto", fontSize: "20px", color: "white", fontWeight: 100 }}>
                    Click on any part of the sweater to start
                </div>
            </div>
            <div style={{ height: "100vh", minWidth: "50%", backgroundColor: "#f9f5f2" }}>
                <div style={{ display: "flex" }}>
                    <button style={{ marginRight: "0px" }}>
                        <img src="brush.png" style={{ width: "30px" }}></img>
                    </button>
                    <button style={{ marginRight: "0px", borderTopRightRadius: "0px", borderBottomRightRadius: "0px" }}>
                        <img src="undo.png" style={{ width: "30px" }}></img>
                    </button>
                    <button style={{ marginLeft: "0px", borderTopLeftRadius: "0px", borderBottomLeftRadius: "0px" }}>
                        <img src="redo.png" style={{ width: "30px" }}></img>
                    </button>
                </div>
                <div className="box" style={{ margin: "10px", height: "85vh" }}>
                    <div style={{ margin: "10px" }}>
                        <div className="grid"></div>
                        <div className="grid"></div>
                    </div>
                </div>
            </div>
            <div id="canvas" style={{ height: "50vh", width: "25vw" }}></div>
        </div>
    );
}

export default SweaterDesigner;
