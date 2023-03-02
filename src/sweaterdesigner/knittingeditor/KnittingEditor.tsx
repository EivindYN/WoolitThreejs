import React from 'react';

import { useEffect, useState } from 'react'
import { Settings } from '../settings'
import { loadGrid } from './gridcanvas';

function KnittingEditor(props: any) {

    const [grid, setGrid] = useState(new Array(90).fill(0).map(() => new Array(90).fill(0)));

    useEffect(() => {
        if (!props.selectedPattern) return
        loadGrid(props.selectedPattern, grid, setGrid)
    }, [props.selectedPattern]);

    const colors = ["white", "black"]

    return (
        <div style={{ height: "100vh", minWidth: "50%", backgroundColor: "#f9f5f2", maxWidth: "50%" }}>
            <div style={{ display: "flex" }}>
                <button style={{ marginRight: "0px" }} onClick={() => console.log("hi")}>
                    <img src="brush.png" style={{ width: "30px" }}></img>
                </button>
                <button style={{ marginRight: "0px", borderTopRightRadius: "0px", borderBottomRightRadius: "0px" }}>
                    <img src="undo.png" style={{ width: "30px" }}></img>
                </button>
                <button style={{ marginLeft: "0px", borderTopLeftRadius: "0px", borderBottomLeftRadius: "0px" }}>
                    <img src="redo.png" style={{ width: "30px" }}></img>
                </button>
            </div>
            <div className="box" style={{ margin: "10px", height: "85vh", overflow: "scroll" }}>
                <div style={{ margin: "10px" }}>
                    {grid.map((gridY, y) =>
                        <div style={{ display: "flex" }} key={y}>
                            {gridY.map((colorIndex, x) =>
                                <div className="grid" style={{ backgroundColor: colors[colorIndex] }} key={x + "," + y}></div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default KnittingEditor;
