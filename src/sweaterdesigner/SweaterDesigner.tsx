import React, { useState } from 'react';
import './SweaterDesigner.css';

import KnittingPreview from './knittingpreview/KnittingPreview';
import KnittingEditor from './knittingeditor/KnittingEditor';
import { SweaterPart } from './SweaterPart';

function SweaterDesigner() {

    const [selectedSweaterPart, setSelectedSweaterPart] = useState<SweaterPart | undefined>(undefined);
    return (
        <div style={{ display: "flex" }}>
            {!selectedSweaterPart &&
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
            }
            <KnittingEditor
                selectedSweaterPart={selectedSweaterPart}
            />
            <KnittingPreview
                setSelectedSweaterPart={setSelectedSweaterPart}
            />
        </div>
    );
}

export default SweaterDesigner;
