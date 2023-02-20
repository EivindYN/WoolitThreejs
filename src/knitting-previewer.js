"use strict";

class KnittingPreviewer extends HTMLElement {
    connectedCallback() {
        import(/* webpackChunkName: "knittingpreview" */ "./knittingpreview.js")
            .then(knittingpreview => {
                this.previewer = new knittingpreview.KnittingPreview(
                    this,
                    JSON.parse(this.getAttribute("pattern")),
                    JSON.parse(this.getAttribute("colors"))
                );
                this.previewer.setRepeatY(JSON.parse(this.getAttribute("repeat-y")));
            })
            .catch(err => {
                console.error("error importing knittingpreview.js");
                console.error(err);
            });

        window.app.ports.sendToDesignPreview.subscribe(cmd => {
            this.onPortCommand(cmd);
        });
    }
}

customElements.define("knitting-previewer", KnittingPreviewer);