import React from 'react';

import { useEffect, useState } from 'react'
import { RepeatMode } from '../enums';
import { getSweaterParts, resetCanvas, setUpdateCanvasNextFrame } from '../knittingpreview/scene';
import { createCanvas } from '../knittingpreview/texturecanvas';
import { Pattern } from '../Pattern';
import { Settings } from '../settings'
import { SweaterPart } from '../SweaterPart';
import { loadGrid, state, onLoadImages, drawSelection, getGrid, unCacheDraw, draw } from './gridcanvas';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';

let pos: number[][] = []
let lastPos: number[] = []

function KnittingEditor(props: any) {

    function make2DArray(x: number, y: number) {
        return new Array(y).fill(0).map(() => new Array(x).fill(0))
    }

    const [grid, setGrid] = useState(make2DArray(Settings.gridSizeX, Settings.gridSizeY)); //NB, should change depending on pattern
    const [repeatOptions, setRepeatOptions] = useState(["None", "", "", ""])
    const [brush, setBrush] = useState(undefined)
    const [showBrushPopup, setShowBrushPopup] = useState(false)
    const [repeat, setRepeat] = useState(1)
    const [posUpdated, setPosUpdated] = useState(false)

    let brushImg: HTMLElement | null;

    useEffect(() => {
        //brushImg = document.getElementById('brush')
        //window.addEventListener('pointermove', onPointerMove);
    }, [])


    useEffect(() => {
        if (!props.selectedSweaterPart) return
        loadGrid(props.selectedSweaterPart, setGrid)
        const thirdRepeatOption = props.selectedSweaterPart.name.includes("Arm") ? "Arms" : "Torso"
        setRepeatOptions(["None", props.selectedSweaterPart.name, thirdRepeatOption, "Arms & Torso"])
    }, [props.selectedSweaterPart]);

    function onPointerMove(event: { clientX: number; clientY: number; }) {
        brushImg!!.style.marginLeft = event.clientX + "px"
        brushImg!!.style.marginTop = event.clientY + "px"
    }

    function drawBrush(pattern: Pattern, endX: any, endY: any) {
        let startX = lastPos[0]
        let startY = lastPos[1]
        let numDraw = Math.max(Math.abs(endY - startY), Math.abs(endX - startX)) + 1
        for (let n = 0; n < numDraw; n++) {
            let x = startX + Math.round((endX - startX) * n / numDraw)
            let y = startY + Math.round((endY - startY) * n / numDraw)
            lastPos = [x, y]
            drawSelection([props.selectedSweaterPart], pattern, x, y, false)
        }
        setGrid(getGrid())
        setUpdateCanvasNextFrame(props.selectedSweaterPart)
    }

    function onMouseOver(endX: any, endY: any, end: boolean) {
        if (!props.selectedSweaterPart) return;
        let repeatMode;
        switch (repeat) {
            case 1: repeatMode = RepeatMode.NONE; break;
            case 2: repeatMode = RepeatMode.ONE; break;
            case 3: repeatMode = RepeatMode.BOTH; break;
            case 4: repeatMode = RepeatMode.ALL; break;
        }
        let sweaterParts: SweaterPart[];
        switch (repeatMode) {
            case RepeatMode.ONE: sweaterParts = [props.selectedSweaterPart]; break;
            case RepeatMode.BOTH: sweaterParts = []; break; //TODO
            case RepeatMode.ALL: sweaterParts = getSweaterParts(); break;
            default: sweaterParts = []; break;
        }
        let grid = [
            [-1, 2, 2, -1],
            [2, 2, 2, 2],
            [2, 2, 2, 2],
            [-1, 2, 2, -1]
        ]
        let pattern = new Pattern(grid)
        if (repeatMode == RepeatMode.NONE) {
            drawBrush(pattern, endX, endY);
        }
        else if (end) {
            drawPattern(pattern, endX, endY, sweaterParts);
        }
    }

    function drawPattern(pattern: Pattern, endX: number, endY: number, sweaterParts: SweaterPart[]) {
        drawSelection(sweaterParts, pattern, endX, endY, true)
        if (sweaterParts.length !== 1) {
            draw(props.selectedSweaterPart) //Grid got cleared in drawSelection, so redraw it
        }
        setGrid(getGrid())
        setUpdateCanvasNextFrame(sweaterParts)
    }

    function changeMaskSize(size: string) {
        const oldMasksPer10Cm = Settings.masksPer10Cm
        switch (size) {
            case "S": Settings.masksPer10Cm = 28; break;
            case "M": Settings.masksPer10Cm = 18; break;
            case "L": Settings.masksPer10Cm = 12; break;
        }
        if (oldMasksPer10Cm === Settings.masksPer10Cm) return;
        Settings.updateCanvasDimensions()
        resetCanvas()
        unCacheDraw()
        loadGrid(props.selectedSweaterPart, setGrid) //Re-select sweaterPart
    }

    const colors = ["white", "red", "black"]

    return (
        <div style={{ height: "98vh", minWidth: "50%", backgroundColor: "#f9f5f2", maxWidth: "50%" }}>
            {showBrushPopup &&
                <div
                    className='box'
                    style={{
                        position: "absolute",
                        marginLeft: "10px",
                        marginTop: "70px",
                        width: "300px",
                        height: "80px",
                        backgroundColor: "white",
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
            {/*<div id='brush' style={{ position: "absolute" }}>
                <img src="brush.png" style={{ width: "30px" }}></img>
            </div>*/}
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{
                    marginLeft: "10px",
                    paddingTop: "5px",
                    marginTop: "5px",
                    height: "55px",
                    backgroundColor: "rgba(237,233,230,1)",
                    width: "60px",
                    display: "flex",
                    borderTopLeftRadius: "10px",
                    borderTopRightRadius: "10px",
                    border: "0.5px solid rgba(0,0,0,0.1)",
                    borderBottom: "none",
                    flexDirection: "column"
                }}>
                    {/*
                    marginLeft: "10px",
                    marginTop: "10px",
                    height: "56px",
                    backgroundColor: "rgba(0,0,0,0.05)",
                    width: "46px",
                    display: "flex",
                    borderRadius: "10px",
                    flexDirection: "column"
                    */}
                    <div className='buttonContainer' style={{ alignSelf: "center" }}>
                        <button style={{ margin: "0px" }} onClick={() => setShowBrushPopup(true)}>
                            <img src="brush.png" style={{ width: "30px" }}></img>
                        </button>
                    </div>
                    {/*<img src="arrow_down.png" style={{ opacity: 0.5, width: "10px", margin: "auto", marginTop: "-3px" }}></img>*/}
                    <div style={{ width: "80%", margin: "auto", height: "2.5px", backgroundColor: "rgba(0,0,0,0.2)" }}></div>
                </div>
                <div className='buttonContainer'>
                    <button>
                        <img src="undo.png" style={{ width: "30px" }}></img>
                    </button>
                    <button>
                        <img src="redo.png" style={{ width: "30px" }}></img>
                    </button>
                </div>
                <div className='buttonContainer'>
                    <button onClick={() => changeMaskSize("S")}>
                        S
                    </button>
                    <button onClick={() => changeMaskSize("M")}>
                        M
                    </button>
                    <button onClick={() => changeMaskSize("L")}>
                        L
                    </button>
                </div>
            </div >
            <div style={{
                backgroundColor: "rgba(237,233,230,1)",
                marginLeft: "10px",
                borderRadius: "5px",
                borderTopLeftRadius: "0px",
                marginTop: "-5px",
                padding: "5px",
                border: "0.5px solid rgba(0,0,0,0.1)",
                display: "flex"
            }}>
                <p style={{ margin: "10px" }}>
                    Repeat:
                </p>
                <FormControl >
                    <Select
                        labelId="demo-simple-select-label"
                        id="demo-simple-select"
                        value={repeat}
                        style={{ height: "30px", marginTop: "auto", marginBottom: "auto", backgroundColor: "white" }}
                        onChange={(e) => setRepeat(e.target.value as number)}
                    >
                        {repeatOptions.map((_, i) =>
                            <MenuItem value={i + 1}>{repeatOptions[i]}</MenuItem>)
                        }
                    </Select>
                </FormControl>
            </div>
            <div className="box" style={{ margin: "10px", height: "82.5vh", overflow: "scroll" }}>
                <div style={{ margin: "0px" }}>
                    {grid.map((gridY, y) =>
                        <div style={{ display: "flex" }} key={y}>
                            {gridY.map((colorIndex, x) =>
                                <div className="grid"
                                    onMouseDown={(_) => {
                                        lastPos = [x, y]
                                        onMouseOver(x, y, false)
                                    }}
                                    onMouseUp={(_) => {
                                        onMouseOver(x, y, true)
                                    }}
                                    onMouseOver={(e: any) => {
                                        let flags = e.buttons !== undefined ? e.buttons : e.which;
                                        let primaryMouseButtonDown = (flags & 1) === 1;
                                        if (primaryMouseButtonDown)
                                            onMouseOver(x, y, false)
                                    }}
                                    style={{ backgroundColor: colors[colorIndex] }} key={colorIndex + "," + x + "," + y}></div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}

export default KnittingEditor;
