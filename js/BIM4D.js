import {Viewer} from "@xeokit/xeokit-sdk/src/viewer/Viewer.js";
import {XKTLoaderPlugin} from "@xeokit/xeokit-sdk/src/plugins/XKTLoaderPlugin/XKTLoaderPlugin.js";
import {loadHospitalModel} from "./loadHospitalModel.js";
import {GanttData} from "./GanttData/GanttData.js";
import {buildGanttData} from "./GanttData/buildGanttData.js";

import {getUpdates, removeUpdates} from "./GanttData/updateUtils.js";
import {applyUpdates} from "./GanttData/updateUtils.js";

class BIM4D {

    constructor(cfg = {}) {

        if (!cfg.canvasElement) {
            throw "Argument expected: canvasElement";
        }

        this.viewer = new Viewer({
            canvasElement: cfg.canvasElement,
            transparent: true
        });

        const viewer = this.viewer;

        viewer.camera.eye = [-2.56, 8.38, 8.27];
        viewer.camera.look = [13.44, 3.31, -14.83];
        viewer.camera.up = [0.10, 0.98, -0.14];

        viewer.scene.xrayMaterial.fillColor = [0, 0, 0];
        viewer.scene.xrayMaterial.fillAlpha = 0.0;
        viewer.scene.xrayMaterial.edgeColor = [0, 0, 0];
        viewer.scene.xrayMaterial.edgeAlpha = 0.2;

        this._xktLoader = new XKTLoaderPlugin(viewer);

        this.ganttData = new GanttData();

        this._updates = [];
        this._numUpdates = 0;

        this._initialized = false;
    }

    init(done) {

        if (this._initialized) {
            throw "Already initialized";
        }

        if (!done) {
            throw "Argument expected: done()";
        }

        this._initialized = true;

        loadHospitalModel(this._xktLoader, () => {

            this.viewer.cameraFlight.jumpTo(this.viewer.scene.aabb);

            buildGanttData(this.viewer, this.ganttData);

            done();
        });
    }

    setTime(time) {

        removeUpdates(this._updates, this._numUpdates);

        this._numUpdates = getUpdates(this.ganttData, time, this.viewer, this._updates);

        applyUpdates(this._updates, this._numUpdates);
    }

}

export {BIM4D};
