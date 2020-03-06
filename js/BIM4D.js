import {Viewer} from "@xeokit/xeokit-sdk/src/viewer/Viewer.js";
import {XKTLoaderPlugin} from "@xeokit/xeokit-sdk/src/plugins/XKTLoaderPlugin/XKTLoaderPlugin.js";
import {loadHospitalModel} from "./loadHospitalModel.js";
import {GanttData} from "./GanttData/GanttData.js";
import {buildGanttData} from "./GanttData/buildGanttData.js";

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

    /**
     * Sets object states according to the given time on the Gantt timeline.
     * @param time
     */
    setTime(time) {

        const viewer = this.viewer;
        const scene = viewer.scene;
        const ganttData = this.ganttData;
        const objects = viewer.scene.objects;
        const tasks = ganttData.tasks;
        const types = ganttData.types;
        const links = ganttData.links;

        scene.setObjectsColorized(scene.colorizedObjectIds, null);

        const objectIds = scene.objectIds;

        // Set object visibilities according to the time instant

        for (var i = 0, len = objectIds.length; i < len; i++) {
            const objectId = objectIds[i];
            const object = scene.objects[objectId];
            const objectCreationTime = ganttData.objectCreationTimes[objectId];
            const visible = (objectCreationTime !== null && objectCreationTime !== undefined && objectCreationTime <= time);
            object.visible = visible;
        }

        // Set object colors according to the time instant

        for (let i = 0, len = tasks.length; i < len; i++) {
            const task = tasks[i];
            if (task.startTime <= time && time <= task.endTime) {
                for (let j = 0, lenj = links.length; j < lenj; j++) {
                    const link = links[j];
                    if (task.id === link.taskId) {
                        const typeId = task.typeId;
                        const type = types[typeId];
                        const color = type.color;
                        const objectId = link.objectId;
                        const entity = objects[objectId];
                        if (!entity) {
                            console.error("Object not found: " + objectId);
                            continue;
                        }
                        entity.colorize = color;
                    }
                }
            }
        }
    }
}

export {BIM4D};
