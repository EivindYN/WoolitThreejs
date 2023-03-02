import React from 'react';

import { useEffect, useState } from 'react'
import { Settings } from '../settings'
import { loadGrid } from './gridcanvas';

function KnittingEditor(props: any) {

    function make2DArray(x: number, y: number) {
        return new Array(y).fill(0).map(() => new Array(x).fill(0))
    }

    const [grid, setGrid] = useState(make2DArray(90, 90));
    const [brush, setBrush] = useState(undefined)
    const [showBrushPopup, setShowBrushPopup] = useState(false)

    useEffect(() => {
        if (!props.selectedPattern) return
        loadGrid(props.selectedPattern, grid, setGrid)
    }, [props.selectedPattern]);

    const colors = ["white", "black"]

    return (
        <div style={{ height: "100vh", minWidth: "50%", backgroundColor: "#f9f5f2", maxWidth: "50%" }}>
            {showBrushPopup &&
                <div
                    className='box'
                    style={{
                        position: "absolute",
                        marginLeft: "10px",
                        marginTop: "70px",
                        width: "300px",
                        height: "80px",
                        backgroundColor: "white"
                    }}>
                    <div style={{ display: "flex" }}>
                        <button onClick={() => setShowBrushPopup(false)}>
                            <img src="paint.png" style={{
                                width: "30px",
                                imageRendering: "crisp-edges"
                            }}></img>
                        </button>
                        {/*<hr></hr>*/}
                    </div>
                </div>
            }
            <div style={{ display: "flex" }}>
                <button style={{ marginRight: "0px" }} onClick={() => setShowBrushPopup(true)}>
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
