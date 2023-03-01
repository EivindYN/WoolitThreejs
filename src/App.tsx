import React from 'react';
import './App.css';

import { useEffect } from 'react';
import { main } from './sweaterdesigner/main'

function App() {
  useEffect(() => {
    main()
  }, []);

  return (
    <div className="App">
      <header className="App-header">
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
          <div id="canvas1" style={{ height: "50vh", width: "25vw" }}></div>
        </div>
      </header>
    </div>
  );
}

export default App;
